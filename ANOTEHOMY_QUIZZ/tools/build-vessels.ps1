# ==========================================================================
# Anotehomy Quizz - tools/build-vessels.ps1
# --------------------------------------------------------------------------
# Regenere js/data/vessel-model.js (jeu "Les vaisseaux sanguins") a partir du
# modele libre Z-Anatomy (CC BY-SA 4.0) :
#   1. telecharge (une seule fois) le systeme cardiovasculaire et le squelette
#      Z-Anatomy au format FBX
#   2. regroupe les maillages par vaisseau selon js/data/vessels.js (objets
#      Z-Anatomy de chaque entree), un vaisseau par cote du corps
#   3. ajoute le coeur (cavites, decor) et le squelette Z-Anatomy (decor)
#   4. simplifie, calcule les vues ou chaque vaisseau est visible
#      (Visibility.cs, entre vaisseaux seulement : le squelette est affiche en
#      transparence), quantifie, compresse (gzip) et encode en base64
#
# Utilisation (PowerShell, depuis le dossier du projet) :
#   powershell -ExecutionPolicy Bypass -File tools\build-vessels.ps1
#   powershell -ExecutionPolicy Bypass -File tools\build-vessels.ps1 -Budget 400000
# ==========================================================================
param(
  [int]$Budget = 300000,                 # triangles au total (vaisseaux, coeur, squelette)
  [int]$MinTris = 120,                   # minimum par vaisseau
  [int]$MaxTris = 7000,                  # maximum par vaisseau
  [double]$DecoFactor = 0.25,            # squelette : detail reduit
  [string]$Cache = (Join-Path $env:TEMP 'anotehomy-zanatomy')
)
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $here
$base = 'https://raw.githubusercontent.com/LluisV/Z-Anatomy/PC-Version/Resources/Models/FBX'
$files = @('CardioVascular41.fbx', 'SkeletalSystem100.fbx')
# cavites du coeur : decor (non cliquable), en transparence
$heart = @('Right atrium', 'Right ventricle', 'Left atrium', 'Left ventricle')

# ---------- 1. telechargements ----------
New-Item -ItemType Directory -Force $Cache | Out-Null
foreach ($f in $files) {
  $dst = Join-Path $Cache $f
  if (-not (Test-Path $dst)) {
    Write-Host "Telechargement de $f ..."
    & curl.exe -L -s -S --retry 3 -o $dst "$base/$f"
    if ($LASTEXITCODE -ne 0) { throw "Echec du telechargement de $f" }
  }
}

Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
Add-Type -Path @((Join-Path $here 'MeshBuild.cs'), (Join-Path $here 'FbxRead.cs'), (Join-Path $here 'Visibility.cs')) `
  -ReferencedAssemblies System.IO.Compression, System.IO.Compression.FileSystem
$sw = [Diagnostics.Stopwatch]::StartNew()

# ---------- 2. catalogue : objet Z-Anatomy -> vaisseau ----------
$cat = [System.IO.File]::ReadAllText((Join-Path $root 'js\data\vessels.js'))
$map = @{}
$ids = New-Object System.Collections.Generic.List[string]
$unpaired = @{}                          # option "u: 1" : vaisseau impair (une seule instance)
$lineRe = "(?m)^\s*V\('([a-z_]+)', '[av]', '[a-z]+',.*?\[((?:[^\]'\\]|'(?:[^'\\]|\\.)*')*)\](.*)$"
foreach ($m in [regex]::Matches($cat, $lineRe)) {
  $id = $m.Groups[1].Value
  $ids.Add($id)
  foreach ($z in [regex]::Matches($m.Groups[2].Value, "'((?:[^'\\]|\\.)*)'")) { $map[($z.Groups[1].Value -replace "\\'", "'")] = $id }
  if ($m.Groups[3].Value -match '\bu: 1\b') { $unpaired[$id] = $true }
}
Write-Host ("Catalogue : {0} vaisseaux, {1} objets Z-Anatomy" -f $ids.Count, $map.Count)

# ---------- 3. vaisseaux : un maillage par vaisseau et par cote ; coeur ----------
$sc = [FbxScene]::Load((Join-Path $Cache 'CardioVascular41.fbx'))
$groups = @{}
$hearts = New-Object System.Collections.Generic.List[Mesh]
$unused = New-Object System.Collections.Generic.List[string]
foreach ($mdl in $sc.Models.Values) {
  $mesh = $sc.WorldMesh($mdl)
  if ($null -eq $mesh -or $mesh.TriCount -eq 0) { continue }
  $baseName = $mdl.Name -replace '\.(r|l)$', ''
  # centimetres -> millimetres
  for ($i = 0; $i -lt $mesh.P.Count; $i++) { $mesh.P[$i] = $mesh.P[$i] * 10 }
  if ($heart -contains $baseName) { $hearts.Add($mesh); continue }
  if (-not $map.ContainsKey($baseName)) { $unused.Add($mdl.Name); continue }
  # cote du corps : suffixe Z-Anatomy (.r : droite du sujet, x < 0), sinon « Right » / « Left »
  # dans le nom (« Right renal artery », « ... of left lung »), sinon position du maillage
  $side = if ($mdl.Name -match '\.r$') { 'R' } elseif ($mdl.Name -match '\.l$') { 'L' }
    elseif ($baseName -match '(?i)\bright\b') { 'R' } elseif ($baseName -match '(?i)\bleft\b') { 'L' } else {
      $sx = 0.0
      for ($i = 0; $i -lt $mesh.P.Count; $i += 3) { $sx += $mesh.P[$i] }
      $cx = $sx / $mesh.VertexCount        # millimetres
      if ($cx -lt -20) { 'R' } elseif ($cx -gt 20) { 'L' } else { '' }
    }
  if ($unpaired.ContainsKey($map[$baseName])) { $side = '' }
  $key = $map[$baseName] + '|' + $side
  if (-not $groups.ContainsKey($key)) { $groups[$key] = New-Object System.Collections.Generic.List[Mesh] }
  $groups[$key].Add($mesh)
}
$parts = New-Object System.Collections.Generic.List[Part]
foreach ($id in $ids) {
  foreach ($side in @('R', 'L', '')) {
    $key = "$id|$side"
    if (-not $groups.ContainsKey($key)) { continue }
    $p = New-Object Part
    $p.Bone = $id; $p.Side = $side; $p.Label = ''; $p.Kind = 'b'
    $p.Mesh = [MeshIO]::MergeWeld($groups[$key])
    $parts.Add($p)
  }
}
$missing = $ids | Where-Object { -not ($groups.ContainsKey("$_|R") -or $groups.ContainsKey("$_|L") -or $groups.ContainsKey("$_|")) }
if ($missing) { Write-Host ("Sans maillage : " + ($missing -join ', ')) }
Write-Host ("Vaisseaux : {0} instances ; objets non utilises : {1}" -f $parts.Count, $unused.Count)
[System.IO.File]::WriteAllLines((Join-Path $Cache 'vaisseaux-non-utilises.txt'), $unused)
$p = New-Object Part
$p.Bone = 'coeur'; $p.Side = ''; $p.Label = ''; $p.Kind = 'c'
$p.Mesh = [MeshIO]::MergeWeld($hearts)
$parts.Add($p)

# ---------- 4. squelette Z-Anatomy (decor) ----------
$sk = [FbxScene]::Load((Join-Path $Cache 'SkeletalSystem100.fbx'))
$nb = 0
foreach ($mdl in $sk.Models.Values) {
  # ignores : reperes d'etiquettes (.j .i .s .t), zones d'origine (.o) et d'insertion (.e)
  # des muscles superposees aux os, cavites (sinus)
  if ($mdl.Name -match '\.(j|i|s|t)$' -or $mdl.Name -match '\.(o|e)\d*[rl]?$' -or $mdl.Name -match '^Sinus') { continue }
  $mesh = $sk.WorldMesh($mdl)
  if ($null -eq $mesh -or $mesh.TriCount -lt 20) { continue }
  for ($i = 0; $i -lt $mesh.P.Count; $i++) { $mesh.P[$i] = $mesh.P[$i] * 10 }
  $p = New-Object Part
  $p.Bone = 'os'; $p.Side = ''; $p.Label = ''; $p.Kind = 'd'
  $p.Mesh = [MeshIO]::MergeWeld([Mesh[]]@($mesh))
  $parts.Add($p); $nb++
}
Write-Host "Squelette : $nb os"

# ---------- 5. simplification et emballage ----------
$plist = New-Object 'System.Collections.Generic.List[Part]'
foreach ($p in $parts) { $plist.Add($p) }
$targets = [Builder]::Targets($plist, $Budget, $MinTris, $MaxTris, $DecoFactor)
$warn = [Builder]::Simplify($plist, $targets, 7.0)
if ($warn) { Write-Host $warn }
# le squelette (decor) est regroupe en quelques gros maillages (moins d'objets a dessiner)
$final = New-Object 'System.Collections.Generic.List[Part]'
$chunk = New-Object 'System.Collections.Generic.List[Mesh]'
$cv = 0
foreach ($p in $plist) {
  if ($p.Kind -ne 'd') { $final.Add($p); continue }
  if ($cv + $p.Mesh.VertexCount -gt 60000 -and $chunk.Count) {
    $q = New-Object Part; $q.Bone = 'os'; $q.Side = ''; $q.Label = ''; $q.Kind = 'd'; $q.Mesh = [MeshIO]::MergeWeld($chunk)
    $final.Add($q); $chunk = New-Object 'System.Collections.Generic.List[Mesh]'; $cv = 0
  }
  $chunk.Add($p.Mesh); $cv += $p.Mesh.VertexCount
}
if ($chunk.Count) { $q = New-Object Part; $q.Bone = 'os'; $q.Side = ''; $q.Label = ''; $q.Kind = 'd'; $q.Mesh = [MeshIO]::MergeWeld($chunk); $final.Add($q) }
$plist = $final
# vues ou chaque vaisseau est visible, entre vaisseaux seulement (squelette et coeur en transparence) ;
# pixels de 1 mm ; moins de 20 pixels : vaisseau profond
$vlist = New-Object 'System.Collections.Generic.List[Part]'
foreach ($p in $plist) { if ($p.Kind -eq 'b') { $vlist.Add($p) } }
Write-Host ("Visibilite : " + [Visibility]::Annotate($vlist, 1.0, 20))
# repere Z-Anatomy deja conforme : x = gauche du sujet, y = haut, z = anterieur
$stats = ''
$body = [Packer]::Pack($plist, 0, 1, 2, 1, 1, 1, [ref]$stats)
$header = @"
/* ==========================================================================
   Anotehomy Quizz - data/vessel-model.js
   FICHIER GENERE par tools/build-vessels.ps1 : ne pas modifier a la main.
   Charge a la demande par le jeu "Les vaisseaux sanguins".
   --------------------------------------------------------------------------
   Modele 3D : Z-Anatomy (https://github.com/Z-Anatomy), licence Creative
   Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0), lui-meme
   derive de BodyParts3D, (c) The Database Center for Life Science (CC BY 4.0).
   Modifications : regroupement des maillages par vaisseau (js/data/vessels.js),
   coeur et squelette en decor, simplification, quantification 16 bits, gzip.
   Ce fichier est donc distribue sous licence CC BY-SA 4.0.
   Unites : millimetres. Repere : x = gauche du sujet, y = haut, z = anterieur.
   Contenu : $stats
   parts : [type ("b" vaisseau / "c" coeur / "d" squelette), id du vaisseau, cote,
            vues ou le vaisseau est visible ";" part visible en %, nb sommets, nb indices]
   ========================================================================== */
AQ.data.VESSEL_MODEL =
"@
[System.IO.File]::WriteAllText((Join-Path $root 'js\data\vessel-model.js'), $header + ' ' + $body + ";`n", (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Vaisseaux, coeur et squelette : $stats"
Write-Host "Termine en $([math]::Round($sw.Elapsed.TotalSeconds, 1)) s"
