# ==========================================================================
# Anotehomy Quizz - tools/build-muscles.ps1
# --------------------------------------------------------------------------
# Regenere js/data/muscle-model.js (jeu "Les muscles du corps humain") a
# partir du modele libre Z-Anatomy (CC BY-SA 4.0) :
#   1. telecharge (une seule fois) le systeme musculaire et le squelette
#      Z-Anatomy au format FBX
#   2. regroupe les maillages par muscle selon js/data/muscles.js (champ des
#      objets Z-Anatomy de chaque entree), un muscle par cote du corps
#   3. ajoute le squelette Z-Anatomy (decor, parfaitement aligne)
#   4. simplifie, calcule les vues ou chaque muscle est visible (Visibility.cs),
#      quantifie, compresse (gzip) et encode en base64
#
# Utilisation (PowerShell, depuis le dossier du projet) :
#   powershell -ExecutionPolicy Bypass -File tools\build-muscles.ps1
#   powershell -ExecutionPolicy Bypass -File tools\build-muscles.ps1 -Budget 500000
# ==========================================================================
param(
  [int]$Budget = 360000,                 # triangles au total (muscles + squelette)
  [int]$MinTris = 160,                   # minimum par muscle
  [int]$MaxTris = 9000,                  # maximum par muscle
  [double]$DecoFactor = 0.3,             # squelette : detail reduit
  [string]$Cache = (Join-Path $env:TEMP 'anotehomy-zanatomy')
)
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $here
$base = 'https://raw.githubusercontent.com/LluisV/Z-Anatomy/PC-Version/Resources/Models/FBX'
$files = @('MuscularSystem100.fbx', 'SkeletalSystem100.fbx')

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

# ---------- 2. catalogue : objet Z-Anatomy -> muscle ----------
$cat = [System.IO.File]::ReadAllText((Join-Path $root 'js\data\muscles.js'))
$map = @{}
$ids = New-Object System.Collections.Generic.List[string]
$unpaired = @{}                          # option "u: 1" : muscle impair (une seule instance)
foreach ($m in [regex]::Matches($cat, "(?m)^\s*M\('([a-z_]+)',.*?\[([^\]]*)\](.*)$")) {
  $id = $m.Groups[1].Value
  $ids.Add($id)
  foreach ($z in [regex]::Matches($m.Groups[2].Value, "'([^']+)'")) { $map[$z.Groups[1].Value] = $id }
  if ($m.Groups[3].Value -match '\bu: 1\b') { $unpaired[$id] = $true }
}
Write-Host ("Catalogue : {0} muscles, {1} objets Z-Anatomy" -f $ids.Count, $map.Count)

# ---------- 3. muscles : un maillage par muscle et par cote ----------
$sc = [FbxScene]::Load((Join-Path $Cache 'MuscularSystem100.fbx'))
$groups = @{}
$unused = New-Object System.Collections.Generic.List[string]
foreach ($mdl in $sc.Models.Values) {
  $mesh = $sc.WorldMesh($mdl)
  if ($null -eq $mesh -or $mesh.TriCount -eq 0) { continue }
  $baseName = $mdl.Name -replace '\.(r|l)$', ''
  if (-not $map.ContainsKey($baseName)) { $unused.Add($mdl.Name); continue }
  # cote du corps d'apres le suffixe Z-Anatomy (.r : droite du sujet, x < 0 ; .l : gauche) ;
  # sans suffixe : muscle impair (diaphragme, ligne blanche...), sauf maillage nettement
  # lateral (suffixe oublie dans Z-Anatomy, ex. "Iliocostalis colli muscle" gauche)
  $side = if ($mdl.Name -match '\.r$') { 'R' } elseif ($mdl.Name -match '\.l$') { 'L' } else {
    $sx = 0.0
    for ($i = 0; $i -lt $mesh.P.Count; $i += 3) { $sx += $mesh.P[$i] }
    $cx = $sx / $mesh.VertexCount        # centimetres
    if ($cx -lt -2) { 'R' } elseif ($cx -gt 2) { 'L' } else { '' }
  }
  # muscle impair coupe en deux moities dans Z-Anatomy (orbiculaire de la bouche...)
  if ($unpaired.ContainsKey($map[$baseName])) { $side = '' }
  # centimetres -> millimetres
  for ($i = 0; $i -lt $mesh.P.Count; $i++) { $mesh.P[$i] = $mesh.P[$i] * 10 }
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
Write-Host ("Muscles : {0} instances ; objets non utilises : {1}" -f $parts.Count, $unused.Count)
[System.IO.File]::WriteAllLines((Join-Path $Cache 'objets-non-utilises.txt'), $unused)

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
# vues ou chaque muscle est visible (pixels de 1,5 mm ; moins de 30 pixels : muscle profond)
Write-Host ("Visibilite : " + [Visibility]::Annotate($plist, 1.5, 30))
# repere Z-Anatomy deja conforme : x = gauche du sujet, y = haut, z = anterieur
$stats = ''
$body = [Packer]::Pack($plist, 0, 1, 2, 1, 1, 1, [ref]$stats)
$header = @"
/* ==========================================================================
   Anotehomy Quizz - data/muscle-model.js
   FICHIER GENERE par tools/build-muscles.ps1 : ne pas modifier a la main.
   Charge a la demande par le jeu "Les muscles du corps humain".
   --------------------------------------------------------------------------
   Modele 3D : Z-Anatomy (https://github.com/Z-Anatomy), licence Creative
   Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0), lui-meme
   derive de BodyParts3D, (c) The Database Center for Life Science (CC BY 4.0).
   Modifications : regroupement des maillages par muscle (js/data/muscles.js),
   squelette en decor, simplification, quantification 16 bits, gzip.
   Ce fichier est donc distribue sous licence CC BY-SA 4.0.
   Unites : millimetres. Repere : x = gauche du sujet, y = haut, z = anterieur.
   Contenu : $stats
   parts : [type ("b" muscle / "d" squelette), id du muscle, cote,
            vues ou le muscle est visible ";" part visible en %, nb sommets, nb indices]
   ========================================================================== */
AQ.data.MUSCLE_MODEL =
"@
[System.IO.File]::WriteAllText((Join-Path $root 'js\data\muscle-model.js'), $header + ' ' + $body + ";`n", (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Muscles et squelette : $stats"
Write-Host "Termine en $([math]::Round($sw.Elapsed.TotalSeconds, 1)) s"
