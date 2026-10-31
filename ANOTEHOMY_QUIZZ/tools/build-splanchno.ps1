# ==========================================================================
# Anotehomy Quizz - tools/build-splanchno.ps1
# --------------------------------------------------------------------------
# Regenere les modeles du jeu "Splanchnologie descriptive" : un fichier par
# organe etudie, js/data/splanchno/<cle>.js, charge a la demande.
#   1. lit le catalogue js/data/splanchnology.js : organes (O) et parties (P),
#      avec les noms des objets 3D de chaque partie ("*" : n'importe quels
#      caracteres)
#   2. prend ces objets dans les organes de reference de la femme du Human
#      Reference Atlas (HuBMAP, CC BY 4.0, source "h") ou dans Z-Anatomy
#      (CC BY-SA 4.0, source "z"), telecharges une seule fois
#   3. option k d'une partie (vaisseau, conduit) : seuls ses triangles proches
#      des autres parties sont gardes (k millimetres autour de leur boite)
#   4. centre l'organe et le met a l'echelle (plus grande dimension : $Size mm,
#      quelle que soit sa taille reelle : il est toujours affiche seul)
#   5. simplifie, calcule les vues ou chaque partie est visible (Visibility.cs),
#      quantifie, compresse (gzip) et encode en base64
#
# Utilisation (PowerShell, depuis le dossier du projet) :
#   powershell -ExecutionPolicy Bypass -File tools\build-splanchno.ps1
#   powershell -ExecutionPolicy Bypass -File tools\build-splanchno.ps1 -Only rein,coeur
# ==========================================================================
param(
  [int]$Budget = 36000,                  # triangles par organe
  [int]$MinTris = 80,                    # minimum par partie
  [int]$MaxTris = 7000,                  # maximum par partie
  [double]$Size = 220,                   # plus grande dimension de l'organe affiche (mm)
  [string]$Only = '',                    # cles des organes a regenerer (separees par des virgules)
  [string]$Cache = (Join-Path $env:TEMP 'anotehomy-zanatomy'),
  [string]$HraCache = (Join-Path $env:TEMP 'anotehomy-hra')
)
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $here
$zBase = 'https://raw.githubusercontent.com/LluisV/Z-Anatomy/PC-Version/Resources/Models/FBX'
$zFiles = @('VisceralSystem100.fbx', 'LymphoidOrgans100.fbx', 'NervousSystem100.fbx', 'CardioVascular41.fbx', 'SkeletalSystem100.fbx')
$hraFile = Join-Path $HraCache 'united-female.glb'

# ---------- 1. catalogue ----------
$cat = [System.IO.File]::ReadAllText((Join-Path $root 'js\data\splanchnology.js'))
$organs = New-Object System.Collections.Generic.List[object]
$cur = $null
$strRe = "'((?:[^'\\]|\\.)*)'"
$str = "'(?:[^'\\]|\\.)*'"
foreach ($line in ($cat -split "`n")) {
  if ($line -match "^\s*O\('([a-z_0-9]+)', '[a-z]+', .*'(h|z)'(?:,|\))") {
    $cur = @{ Key = $Matches[1]; Src = $Matches[2]; Parts = New-Object System.Collections.Generic.List[object] }
    $organs.Add($cur)
  }
  # P(id, nom, latin, [objets], options) : le nom et le latin peuvent contenir des crochets ("[S I]")
  elseif ($line -match ("^\s*P\('([a-z_0-9]+)', " + $str + ", " + $str + ", \[((?:[^\]'\\]|'(?:[^'\\]|\\.)*')*)\](.*)$")) {
    $id = $Matches[1]; $objs = $Matches[2]; $opts = $Matches[3]     # avant tout autre -match ($Matches remplace)
    $names = @(); foreach ($z in [regex]::Matches($objs, $strRe)) { $names += ($z.Groups[1].Value -replace "\\'", "'") }
    $k = if ($opts -match '\bk: (\d+)') { [double]$Matches[1] } else { 0 }
    $cur.Parts.Add(@{ Id = $id; Names = $names; K = $k })
  }
}
$wanted = if ($Only) { $Only -split ',' } else { $null }
$todo = @($organs | Where-Object { -not $wanted -or $wanted -contains $_.Key })
Write-Host ("Catalogue : {0} organes, {1} parties ; a generer : {2}" -f $organs.Count, ($organs | ForEach-Object { $_.Parts.Count } | Measure-Object -Sum).Sum, $todo.Count)

# ---------- 2. sources ----------
$needZ = @($todo | Where-Object { $_.Src -eq 'z' }).Count -gt 0
$needH = @($todo | Where-Object { $_.Src -eq 'h' }).Count -gt 0
New-Item -ItemType Directory -Force $Cache, $HraCache | Out-Null
if ($needZ) {
  foreach ($f in $zFiles) {
    $dst = Join-Path $Cache $f
    if (-not (Test-Path $dst)) {
      Write-Host "Telechargement de $f ..."
      & curl.exe -L -s -S --retry 3 -o $dst "$zBase/$f"
      if ($LASTEXITCODE -ne 0) { throw "Echec du telechargement de $f" }
    }
  }
}
if ($needH -and -not (Test-Path $hraFile)) {
  Write-Host 'Telechargement des organes de reference de la femme (HuBMAP, environ 210 Mo) ...'
  & curl.exe -L -s -S --retry 3 -o $hraFile 'https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/assets/3d-vh-f-united.glb'
  if ($LASTEXITCODE -ne 0) { throw 'Echec du telechargement du modele HuBMAP' }
}
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem, System.Web.Extensions
Add-Type -Path @((Join-Path $here 'MeshBuild.cs'), (Join-Path $here 'FbxRead.cs'), (Join-Path $here 'GlbRead.cs'), (Join-Path $here 'Visibility.cs')) `
  -ReferencedAssemblies System.IO.Compression, System.IO.Compression.FileSystem, System.Web.Extensions
$sw = [Diagnostics.Stopwatch]::StartNew()

# nom (avec "*") -> expression reguliere
function Pattern($n) { return '^' + ([regex]::Escape($n) -replace '\\\*', '.*') + '$' }
# objets Z-Anatomy : nom exact (suffixe .r / .l compris) -> maillages (mm)
$zMesh = @{}
if ($needZ) {
  $pats = @(); foreach ($o in $todo) { if ($o.Src -eq 'z') { foreach ($p in $o.Parts) { foreach ($n in $p.Names) { $pats += (Pattern $n) } } } }
  foreach ($f in $zFiles) {
    $sc = [FbxScene]::Load((Join-Path $Cache $f))
    foreach ($mdl in $sc.Models.Values) {
      # reperes d'etiquettes (.j .i .s .t) et zones d'insertion des muscles (.o .e) : jamais repris
      if ($mdl.Name -match '\.(j|i|s|t)$' -or $mdl.Name -match '\.(o|e)\d*[rl]?$') { continue }
      $hit = $false; foreach ($pt in $pats) { if ($mdl.Name -match $pt) { $hit = $true; break } }
      if (-not $hit) { continue }
      $m = $sc.WorldMesh($mdl)
      if ($null -eq $m -or $m.TriCount -eq 0) { continue }
      for ($i = 0; $i -lt $m.P.Count; $i++) { $m.P[$i] = $m.P[$i] * 10 }
      if (-not $zMesh.ContainsKey($mdl.Name)) { $zMesh[$mdl.Name] = New-Object System.Collections.Generic.List[Mesh] }
      $zMesh[$mdl.Name].Add($m)
    }
    Write-Host ("{0} lu ({1:0} s)" -f $f, $sw.Elapsed.TotalSeconds)
  }
}
$hra = if ($needH) { [GlbScene]::Load($hraFile, 1000.0) } else { $null }

# maillages d'une partie (tous les objets dont le nom correspond)
function PartMeshes($src, $names) {
  $list = New-Object 'System.Collections.Generic.List[Mesh]'
  foreach ($n in $names) {
    $pt = Pattern $n; $found = 0
    if ($src -eq 'h') {
      foreach ($k in $hra.ByName.Keys) { if ($k -match $pt) { $m = $hra.MeshOf($k); if ($m -and $m.TriCount) { $list.Add($m); $found++ } } }
    } else {
      foreach ($k in $zMesh.Keys) { if ($k -match $pt) { $list.AddRange($zMesh[$k]); $found++ } }
    }
    if (-not $found) { throw "Objet introuvable ($src) : $n" }
  }
  return ,$list
}
# triangles dont les trois sommets sont dans la boite b elargie de k
function ClipToBox($m, $b, $k) {
  $r = New-Object Mesh; $map = @{}
  for ($t = 0; $t + 2 -lt $m.T.Count; $t += 3) {
    $in = $true
    for ($j = 0; $j -lt 3 -and $in; $j++) { $v = $m.T[$t + $j]; for ($c = 0; $c -lt 3; $c++) { $x = $m.P[3 * $v + $c]; if ($x -lt $b[$c] - $k -or $x -gt $b[$c + 3] + $k) { $in = $false; break } } }
    if (-not $in) { continue }
    for ($j = 0; $j -lt 3; $j++) {
      $v = $m.T[$t + $j]
      if (-not $map.ContainsKey($v)) { $map[$v] = $r.VertexCount; $r.P.Add($m.P[3 * $v]); $r.P.Add($m.P[3 * $v + 1]); $r.P.Add($m.P[3 * $v + 2]) }
      $r.T.Add($map[$v])
    }
  }
  return $r
}

# ---------- 3. un fichier par organe ----------
$outDir = Join-Path $root 'js\data\splanchno'
New-Item -ItemType Directory -Force $outDir | Out-Null
foreach ($o in $todo) {
  $parts = New-Object 'System.Collections.Generic.List[Part]'
  $clip = @()
  foreach ($p in $o.Parts) {
    $q = New-Object Part
    $q.Bone = $p.Id; $q.Side = ''; $q.Label = ''; $q.Kind = 'b'
    $q.Mesh = [Shape]::Compact([MeshIO]::MergeWeld((PartMeshes $o.Src $p.Names)))
    if (-not $q.Mesh.TriCount) { throw "Partie sans triangles : $($o.Key) $($p.Id)" }
    $parts.Add($q)
    if ($p.K -gt 0) { $clip += @{ Part = $q; K = $p.K } }
  }
  # parties coupees (vaisseaux, conduits) : pres des autres parties seulement
  if ($clip.Count) {
    $core = New-Object 'System.Collections.Generic.List[Mesh]'
    foreach ($q in $parts) { if (-not ($clip | Where-Object { $_.Part -eq $q })) { $core.Add($q.Mesh) } }
    $cb = [Shape]::Bounds($core)
    foreach ($c in $clip) { $c.Part.Mesh = ClipToBox $c.Part.Mesh $cb $c.K; if (-not $c.Part.Mesh.TriCount) { throw "Partie vide apres coupe : $($o.Key) $($c.Part.Bone)" } }
  }
  # centrage et mise a l'echelle
  $all = New-Object 'System.Collections.Generic.List[Mesh]'
  foreach ($q in $parts) { $all.Add($q.Mesh) }
  $b = [Shape]::Bounds($all)
  $ext = [math]::Max($b[3] - $b[0], [math]::Max($b[4] - $b[1], $b[5] - $b[2]))
  $c = [double[]]@((($b[0] + $b[3]) / 2), (($b[1] + $b[4]) / 2), (($b[2] + $b[5]) / 2))
  foreach ($q in $parts) { [Shape]::Similar($q.Mesh, $c, [double[]]@(0, 0, 0), $Size / $ext, 0) }
  $targets = [Builder]::Targets($parts, $Budget, $MinTris, $MaxTris, 1.0)
  $warn = [Builder]::Simplify($parts, $targets, 7.0)
  if ($warn) { Write-Host $warn }
  $vis = [Visibility]::Annotate($parts, 1.0, 30)
  $stats = ''
  $body = [Packer]::Pack($parts, 0, 1, 2, 1, 1, 1, [ref]$stats)
  $lic = if ($o.Src -eq 'h') {
    "Modele 3D : Human Reference Atlas (HuBMAP), 3D Reference Organ Set for`n   Female v1.5, Kristen Browne et Heidi Schlehlein (2023), licence Creative`n   Commons Attribution 4.0 International (CC BY 4.0)."
  } else {
    "Modele 3D : Z-Anatomy (https://github.com/Z-Anatomy), licence Creative`n   Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0), lui-meme`n   derive de BodyParts3D, (c) The Database Center for Life Science (CC BY 4.0).`n   Ce fichier est donc distribue sous licence CC BY-SA 4.0."
  }
  $header = @"
/* ==========================================================================
   Anotehomy Quizz - data/splanchno/$($o.Key).js
   FICHIER GENERE par tools/build-splanchno.ps1 : ne pas modifier a la main.
   Charge a la demande par le jeu "Splanchnologie descriptive".
   --------------------------------------------------------------------------
   $lic
   Modifications : regroupement des maillages par partie (js/data/splanchnology.js),
   centrage, mise a l'echelle ($Size mm), simplification, quantification 16 bits, gzip.
   Contenu : $stats
   parts : ["b", partie, "", vues ou la partie est visible ";" part visible en %,
            nb sommets, nb indices]
   ========================================================================== */
AQ.data.SPLANCHNO_MODEL = AQ.data.SPLANCHNO_MODEL || {};
AQ.data.SPLANCHNO_MODEL['$($o.Key)'] =
"@
  [System.IO.File]::WriteAllText((Join-Path $outDir ($o.Key + '.js')), $header + ' ' + $body + ";`n", (New-Object System.Text.UTF8Encoding($false)))
  Write-Host ("{0,-24} {1} ; {2} ({3:0} s)" -f $o.Key, $stats, $vis, $sw.Elapsed.TotalSeconds)
}
Write-Host "Termine en $([math]::Round($sw.Elapsed.TotalSeconds, 1)) s"
