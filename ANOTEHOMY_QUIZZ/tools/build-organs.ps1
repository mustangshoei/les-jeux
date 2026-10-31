# ==========================================================================
# Anotehomy Quizz - tools/build-organs.ps1
# --------------------------------------------------------------------------
# Regenere js/data/organ-model.js (jeu "Les organes") a partir du modele
# libre Z-Anatomy (CC BY-SA 4.0) :
#   1. telecharge (une seule fois) les systemes visceral, lymphoide, nerveux,
#      cardiovasculaire et squelettique de Z-Anatomy au format FBX
#   2. regroupe les maillages par organe selon js/data/organs.js (objets
#      Z-Anatomy de chaque entree, pris dans n'importe lequel de ces fichiers),
#      un organe par cote du corps
#   3. ajoute le squelette Z-Anatomy en decor (sans les cartilages du larynx ni
#      les osselets, qui sont des organes du jeu)
#   4. organes feminins (le modele Z-Anatomy est masculin) : organes de reference
#      de la femme du Human Reference Atlas (HuBMAP, CC BY 4.0, objets "VH_F_..."),
#      telecharges une seule fois et recales dans le bassin Z-Anatomy (similitude
#      dans le plan sagittal ajustee sur la symphyse pubienne, le promontoire et le
#      coccyx des deux modeles) ou sur le thorax (glandes mammaires) ; organes absents
#      des deux modeles generes (objets "#...") : uretre feminin, clitoris, bulbes du
#      vestibule, glandes vestibulaires majeures, ureteres prolonges jusqu'a la
#      vessie feminine
#   5. simplifie, calcule les vues ou chaque organe est visible (Visibility.cs,
#      entre organes seulement : le squelette est affiche en transparence),
#      quantifie, compresse (gzip) et encode en base64
#
# Utilisation (PowerShell, depuis le dossier du projet) :
#   powershell -ExecutionPolicy Bypass -File tools\build-organs.ps1
#   powershell -ExecutionPolicy Bypass -File tools\build-organs.ps1 -Budget 450000
# ==========================================================================
param(
  [int]$Budget = 340000,                 # triangles au total (organes et squelette)
  [int]$MinTris = 150,                   # minimum par organe
  [int]$MaxTris = 9000,                  # maximum par organe
  [double]$DecoFactor = 0.2,             # squelette : detail reduit
  [double]$FemaleDz = -10,               # bloc pelvien feminin : recul (mm) apres recalage sur le bassin
  [double]$BreastGap = 16,               # glande mammaire : distance aux cotes (muscle grand pectoral)
  [string]$Cache = (Join-Path $env:TEMP 'anotehomy-zanatomy'),
  [string]$HraCache = (Join-Path $env:TEMP 'anotehomy-hra')
)
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $here
$base = 'https://raw.githubusercontent.com/LluisV/Z-Anatomy/PC-Version/Resources/Models/FBX'
$files = @('VisceralSystem100.fbx', 'LymphoidOrgans100.fbx', 'NervousSystem100.fbx', 'CardioVascular41.fbx', 'SkeletalSystem100.fbx')

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

$hraFile = Join-Path $HraCache 'united-female.glb'
if (-not (Test-Path $hraFile)) {
  New-Item -ItemType Directory -Force $HraCache | Out-Null
  Write-Host 'Telechargement des organes de reference de la femme (HuBMAP, environ 210 Mo) ...'
  & curl.exe -L -s -S --retry 3 -o $hraFile 'https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/assets/3d-vh-f-united.glb'
  if ($LASTEXITCODE -ne 0) { throw 'Echec du telechargement du modele HuBMAP' }
}

Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem, System.Web.Extensions
Add-Type -Path @((Join-Path $here 'MeshBuild.cs'), (Join-Path $here 'FbxRead.cs'), (Join-Path $here 'GlbRead.cs'), (Join-Path $here 'Visibility.cs')) `
  -ReferencedAssemblies System.IO.Compression, System.IO.Compression.FileSystem, System.Web.Extensions
$sw = [Diagnostics.Stopwatch]::StartNew()

# ---------- 2. catalogue : objet Z-Anatomy -> organe ----------
$cat = [System.IO.File]::ReadAllText((Join-Path $root 'js\data\organs.js'))
$map = @{}
$ids = New-Object System.Collections.Generic.List[string]
$unpaired = @{}                          # option "u: 1" : organe impair (une seule instance)
$thorax = @{}                            # option "th: 1" : objets HuBMAP recales sur le thorax
$sexOf = @{}                             # option "s: 'm'" ou "s: 'f'" : organe d'un seul sexe
$lineRe = "(?m)^\s*G\('([a-z_0-9]+)', '[a-z]+',.*?\[((?:[^\]'\\]|'(?:[^'\\]|\\.)*')*)\](.*)$"
foreach ($m in [regex]::Matches($cat, $lineRe)) {
  $id = $m.Groups[1].Value
  $ids.Add($id)
  foreach ($z in [regex]::Matches($m.Groups[2].Value, "'((?:[^'\\]|\\.)*)'")) { $map[($z.Groups[1].Value -replace "\\'", "'")] = $id }
  if ($m.Groups[3].Value -match '\bu: 1\b') { $unpaired[$id] = $true }
  if ($m.Groups[3].Value -match '\bth: 1\b') { $thorax[$id] = $true }
  if ($m.Groups[3].Value -match "\bs: '(m|f)'") { $sexOf[$id] = $Matches[1] }
}
Write-Host ("Catalogue : {0} organes, {1} objets Z-Anatomy" -f $ids.Count, $map.Count)

# ---------- 3. organes (tous les fichiers) et squelette (decor) ----------
$groups = @{}
$parts = New-Object System.Collections.Generic.List[Part]
$nb = 0
$ribs = New-Object 'System.Collections.Generic.List[Mesh]'      # cotes, cartilages, sternum (glandes mammaires)
$hips = New-Object 'System.Collections.Generic.List[Mesh]'      # os coxaux (perinee)
function Add-Group($key, $mesh) {
  if (-not $groups.ContainsKey($key)) { $groups[$key] = New-Object System.Collections.Generic.List[Mesh] }
  $groups[$key].Add($mesh)
}
foreach ($f in $files) {
  $sc = [FbxScene]::Load((Join-Path $Cache $f))
  $skeleton = $f -eq 'SkeletalSystem100.fbx'
  foreach ($mdl in $sc.Models.Values) {
    $baseName = $mdl.Name -replace '\.(r|l)$', ''
    $inCat = $map.ContainsKey($baseName)
    if (-not $inCat -and -not $skeleton) { continue }
    # squelette : ignores les reperes d'etiquettes (.j .i .s .t), zones d'origine (.o) et d'insertion (.e)
    # des muscles superposees aux os, cavites (sinus)
    if (-not $inCat -and ($mdl.Name -match '\.(j|i|s|t)$' -or $mdl.Name -match '\.(o|e)\d*[rl]?$' -or $mdl.Name -match '^Sinus')) { continue }
    $mesh = $sc.WorldMesh($mdl)
    if ($null -eq $mesh -or $mesh.TriCount -eq 0) { continue }
    if (-not $inCat -and $mesh.TriCount -lt 20) { continue }
    # centimetres -> millimetres
    for ($i = 0; $i -lt $mesh.P.Count; $i++) { $mesh.P[$i] = $mesh.P[$i] * 10 }
    if (-not $inCat) {
      if ($mdl.Name -match '(?i)\b(rib|costal cartilage|sternum)\b') { $ribs.Add($mesh) }
      if ($mdl.Name -match '^Hip bone\.(r|l)$') { $hips.Add($mesh) }
      if ($mdl.Name -eq 'Sacrum') { $sacrumZ = $mesh }
      if ($mdl.Name -eq 'Coccyx') { $coccyxZ = $mesh }
      $p = New-Object Part
      $p.Bone = 'os'; $p.Side = ''; $p.Label = ''; $p.Kind = 'd'
      $p.Mesh = [MeshIO]::MergeWeld([Mesh[]]@($mesh))
      $parts.Add($p); $nb++
      continue
    }
    # cote du corps : suffixe Z-Anatomy (.r : droite du sujet, x < 0), sinon « Right » / « Left »
    # dans le nom, sinon position du maillage
    $side = if ($mdl.Name -match '\.r$') { 'R' } elseif ($mdl.Name -match '\.l$') { 'L' }
      elseif ($baseName -match '(?i)\bright\b') { 'R' } elseif ($baseName -match '(?i)\bleft\b') { 'L' } else {
        $sx = 0.0
        for ($i = 0; $i -lt $mesh.P.Count; $i += 3) { $sx += $mesh.P[$i] }
        $cx = $sx / $mesh.VertexCount        # millimetres
        if ($cx -lt -20) { 'R' } elseif ($cx -gt 20) { 'L' } else { '' }
      }
    if ($unpaired.ContainsKey($map[$baseName])) { $side = '' }
    Add-Group ($map[$baseName] + '|' + $side) $mesh
  }
  Write-Host ("{0} lu ({1:0} s)" -f $f, $sw.Elapsed.TotalSeconds)
}

# ---------- 4. organes feminins (HuBMAP, recales) et organes generes ----------
$hra = [GlbScene]::Load($hraFile, 1000.0)
$hraMesh = { param($n) $m = $hra.MeshOf($n); if ($null -eq $m) { throw "Objet HuBMAP absent : $n" }; return $m }
function Mid($a, $b) { return [double[]]@((($a[0] + $b[0]) / 2), (($a[1] + $b[1]) / 2), (($a[2] + $b[2]) / 2)) }
function Plus($a, $dx, $dy, $dz) { return [double[]]@(($a[0] + $dx), ($a[1] + $dy), ($a[2] + $dz)) }
function Pts($list) { $r = New-Object 'System.Collections.Generic.List[double]'; foreach ($p in $list) { $r.AddRange([double[]]$p) }; return $r.ToArray() }
# fin d'un uretere Z-Anatomy : centre de sa tranche la plus basse, et direction de descente
function UreterEnd($side) {
  $m = [MeshIO]::MergeWeld($groups["ureter|$side"]); $b = [Shape]::Bounds([Mesh[]]@($m))
  $end = [Shape]::SliceCenter($m, 1, $b[1] + 1.5, 1.5); $up = [Shape]::SliceCenter($m, 1, $b[1] + 12, 1.5)
  $d = @(($end[0] - $up[0]), ($end[1] - $up[1]), ($end[2] - $up[2])); $l = [math]::Sqrt($d[0] * $d[0] + $d[1] * $d[1] + $d[2] * $d[2])
  return @{ P = $end; D = [double[]]@(($d[0] / $l), ($d[1] / $l), ($d[2] / $l)); M = $m }
}
# reperes du bassin pres du plan median : haut et bas de la symphyse pubienne, promontoire, pointe du coccyx
function PelvisMarks($pubis, $sacrum, $coccyx) {
  $b = [Shape]::Bounds($sacrum); $xm = ($b[0] + $b[3]) / 2
  return @{ X = $xm; P = @(
    [Shape]::Extreme($pubis, $xm, 6, 1, 0, -1e9), [Shape]::Extreme($pubis, $xm, 6, -1, 0, -1e9),
    [Shape]::Extreme($sacrum, $xm, 8, 0, 1, $b[4] - 30), [Shape]::Extreme($coccyx, $xm, 10, -1, 0, -1e9)) }
}
$uR = UreterEnd 'R'; $uL = UreterEnd 'L'
$zPel = PelvisMarks ([Mesh[]]$hips) ([Mesh[]]@($sacrumZ)) ([Mesh[]]@($coccyxZ))
$hPel = PelvisMarks ([Mesh[]]@((& $hraMesh 'VH_F_pubis_compact_bone_R'), (& $hraMesh 'VH_F_pubis_compact_bone_L'))) ([Mesh[]]@((& $hraMesh 'VH_F_sacrum'))) ([Mesh[]]@((& $hraMesh 'VH_F_coccyx')))
# similitude (y, z) aux moindres carres (Procuste ponderee : la symphyse compte double, le coccyx pour moitie)
$w = @(2, 2, 1, 0.5); $sw2 = 0; $hc = @(0, 0); $zc = @(0, 0)
for ($i = 0; $i -lt 4; $i++) { $sw2 += $w[$i]; for ($k = 0; $k -lt 2; $k++) { $hc[$k] += $w[$i] * $hPel.P[$i][$k + 1]; $zc[$k] += $w[$i] * $zPel.P[$i][$k + 1] } }
for ($k = 0; $k -lt 2; $k++) { $hc[$k] /= $sw2; $zc[$k] /= $sw2 }
$pa = 0; $pb = 0; $pn = 0
for ($i = 0; $i -lt 4; $i++) {
  $hy = $hPel.P[$i][1] - $hc[0]; $hz = $hPel.P[$i][2] - $hc[1]; $zy = $zPel.P[$i][1] - $zc[0]; $zz = $zPel.P[$i][2] - $zc[1]
  $pa += $w[$i] * ($hy * $zy + $hz * $zz); $pb += $w[$i] * ($hy * $zz - $hz * $zy); $pn += $w[$i] * ($hy * $hy + $hz * $hz)
}
$theta = [math]::Atan2($pb, $pa); $scale = [math]::Sqrt($pa * $pa + $pb * $pb) / $pn
$hFrom = [double[]]@($hPel.X, $hc[0], $hc[1]); $hTo = [double[]]@($zPel.X, $zc[0], ($zc[1] + $FemaleDz))
Write-Host ("Bassin feminin recale : echelle {0:0.000}, rotation {1:0.0} degres" -f $scale, ($theta * 180 / [math]::PI))
$pelvic = { param($m) [Shape]::Similar($m, $hFrom, $hTo, $scale, $theta); return $m }
# thorax : boite des poumons HuBMAP amenee sur celle des poumons Z-Anatomy ; la glande mammaire est
# ensuite posee a $BreastGap mm devant les cotes
$hl = New-Object 'System.Collections.Generic.List[Mesh]'
foreach ($n in @($hra.ByName.Keys)) { if ($n -match 'bronchopulmonary_segm') { $hl.Add((& $hraMesh $n)) } }
$zl = New-Object 'System.Collections.Generic.List[Mesh]'
foreach ($k in @($groups.Keys)) { if ($k -match '^lobus_(superior|medius|inferior)_pulmonis') { $zl.AddRange($groups[$k]) } }
$hLungB = [Shape]::Bounds($hl); $zLungB = [Shape]::Bounds($zl)
$breastDz = @{}
foreach ($s in @('R', 'L')) {
  $lob = & $hraMesh "VH_F_mammary_lobes_$s"; [Shape]::MapBox($lob, $hLungB, $zLungB); $b = [Shape]::Bounds([Mesh[]]@($lob))
  $rib = [Shape]::MaxZNear($ribs, ($b[0] + $b[3]) / 2, ($b[1] + $b[4]) / 2, 25)
  $breastDz[$s] = $rib + $BreastGap - $b[2]
}
$sideOf = { param($n) if ($n -match '(?i)(^|_)(right|R)(_|$)') { 'R' } elseif ($n -match '(?i)(^|_)(left|L)(_|$)') { 'L' } else { '' } }
$nh = 0
foreach ($z in @($map.Keys)) {
  if ($z -notlike 'VH_F_*') { continue }
  $id = $map[$z]; $m = & $hraMesh $z; $side = & $sideOf $z
  if ($thorax.ContainsKey($id)) { [Shape]::MapBox($m, $hLungB, $zLungB); [Shape]::Translate($m, 0, 0, $breastDz[$side]) } else { $null = & $pelvic $m }
  if ($unpaired.ContainsKey($id)) { $side = '' }
  Add-Group "$id|$side" $m; $nh++
}
# reperes : orifices ureteraux, col de la vessie et orifice du vagin (apres recalage) ; bas de la symphyse
$oR = [Shape]::Center([Mesh[]]@((& $pelvic (& $hraMesh 'VH_F_ureteral_orifice_R')))); $oL = [Shape]::Center([Mesh[]]@((& $pelvic (& $hraMesh 'VH_F_ureteral_orifice_L'))))
$neck = [Shape]::Center([Mesh[]]@((& $pelvic (& $hraMesh 'VH_F_urinary_bladder_neck_smooth_muscle'))))
$vag = & $pelvic (& $hraMesh 'VH_F_vagina'); $vb = [Shape]::Bounds([Mesh[]]@($vag))
$vo = [Shape]::SliceCenter($vag, 1, $vb[1] + 3, 3)
$sym = $zPel.P[1]
Write-Host ("Reperes : orifice du vagin ({0:0}, {1:0}, {2:0}), col vesical ({3:0}, {4:0}, {5:0}), bas de la symphyse ({6:0}, {7:0})" -f $vo[0], $vo[1], $vo[2], $neck[0], $neck[1], $neck[2], $sym[1], $sym[2])
$gen = @{}
# uretere de la femme : l'uretere Z-Anatomy prolonge le long du col de l'uterus jusqu'a l'orifice ureteral
# de la vessie feminine (plus en avant et plus bas que la fin de l'uretere masculin)
foreach ($s in @('R', 'L')) {
  $u = if ($s -eq 'R') { $uR } else { $uL }; $o = if ($s -eq 'R') { $oR } else { $oL }
  $p0 = Plus $u.P (-3 * $u.D[0]) (-3 * $u.D[1]) (-3 * $u.D[2]); $p1 = Plus $u.P (8 * $u.D[0]) (8 * $u.D[1]) (8 * $u.D[2])
  $mid = Plus (Mid $p1 $o) ($o[0] * 0.25) 0 0
  $ext = [Shape]::Tube((Pts @($p0, $p1, $mid, $o)), [double[]]@(2.4, 2.4, 2.3, 2.0), 40, 12, 1)
  $gen["#ureter_f|$s"] = [MeshIO]::MergeWeld([Mesh[]]@($u.M, $ext))
}
# uretre feminin : du col de la vessie a son orifice externe, juste en avant de l'orifice du vagin
$uo = Plus $vo 0 3 10
$gen['#urethra_feminina|'] = [Shape]::Tube((Pts @((Plus $neck 0 2 0), (Plus (Mid $neck $uo) 0 0 2), $uo)), [double[]]@(3.0, 2.8, 2.4), 28, 14, 1)
# clitoris : gland en avant et au-dessous de la symphyse, corps remontant devant elle jusqu'a l'angle,
# piliers repartant en arriere sous la symphyse puis le long des rameaux ischio-pubiens
$ang = Plus $sym 0 6 12
$gl = Plus $sym 0 -12 10
$cl = New-Object 'System.Collections.Generic.List[Mesh]'
$cl.Add([Shape]::Ellipsoid($gl, [double[]]@(0, -0.6, 1), 3.6, 3, 2.8, 12, 16))
$cl.Add([Shape]::Tube((Pts @($ang, (Plus (Mid $ang $gl) 0 0 2), $gl)), [double[]]@(3.2, 3.0, 2.6), 16, 14, 1))
$r2 = [Shape]::Lowest($hips, 20, -60); $r3 = [Shape]::Lowest($hips, 30, -60)
foreach ($sg in @(1, -1)) {
  $c = @((Plus $ang ($sg * 2) -1 -1), (Plus $sym ($sg * 7) -7 -2), [double[]]@(($sg * 17), ($r2[1] + 1), ($r2[2] + 2)), [double[]]@(($sg * 26), ($r3[1] + 3), ($r3[2] + 6)))
  $cl.Add([Shape]::Tube((Pts $c), [double[]]@(3.0, 3.2, 2.6, 1.6), 32, 12, 0.8))
}
$gen['#clitoris|'] = [MeshIO]::MergeWeld($cl)
# bulbes du vestibule (de chaque cote des orifices de l'uretre et du vagin) et glandes vestibulaires
# majeures (a leur extremite posterieure)
$vm = Mid $uo $vo
foreach ($s in @('R', 'L')) {
  $sg = if ($s -eq 'R') { -1 } else { 1 }
  $gen["#bulbus_vestibuli|$s"] = [Shape]::Ellipsoid((Plus $vm ($sg * 12) 1 2), [double[]]@(0, 0.35, 1), 13, 3.5, 5.5, 14, 18)
  $gen["#glandula_vestibularis_major|$s"] = [Shape]::Ellipsoid((Plus $vo ($sg * 10) -1 -9), [double[]]@(0, 0.3, 1), 5, 3.8, 3.2, 10, 14)
}
foreach ($z in @($map.Keys)) {
  if ($z -notlike '#*') { continue }
  $id = $map[$z]; $n = 0
  foreach ($s in @('R', 'L', '')) {
    if (-not $gen.ContainsKey("$z|$s")) { continue }
    $side = if ($unpaired.ContainsKey($id)) { '' } else { $s }
    Add-Group "$id|$side" $gen["$z|$s"]; $n++
  }
  if (-not $n) { throw "Organe genere inconnu : $z" }
}
Write-Host ("Organes feminins : {0} objets HuBMAP, {1} organes generes ({2:0} s)" -f $nh, $gen.Count, $sw.Elapsed.TotalSeconds)
$organs = New-Object System.Collections.Generic.List[Part]
foreach ($id in $ids) {
  foreach ($side in @('R', 'L', '')) {
    $key = "$id|$side"
    if (-not $groups.ContainsKey($key)) { continue }
    $p = New-Object Part
    $p.Bone = $id; $p.Side = $side; $p.Label = ''; $p.Kind = 'b'
    $p.Mesh = [MeshIO]::MergeWeld($groups[$key])
    $organs.Add($p)
  }
}
$missing = $ids | Where-Object { -not ($groups.ContainsKey("$_|R") -or $groups.ContainsKey("$_|L") -or $groups.ContainsKey("$_|")) }
if ($missing) { Write-Host ("Sans maillage : " + ($missing -join ', ')) }
Write-Host ("Organes : {0} instances ; squelette : {1} os" -f $organs.Count, $nb)

# ---------- 5. simplification et emballage ----------
$plist = New-Object 'System.Collections.Generic.List[Part]'
foreach ($p in $organs) { $plist.Add($p) }
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
# vues ou chaque organe est visible, entre organes seulement (squelette en transparence) ;
# pixels de 1 mm ; moins de 30 pixels : organe profond. Un calcul par sexe du corps : un organe commun
# aux deux garde les deux resultats s'ils different ("masculin|feminin")
$male = New-Object 'System.Collections.Generic.List[Part]'
$female = New-Object 'System.Collections.Generic.List[Part]'
foreach ($p in $plist) {
  if ($p.Kind -ne 'b') { continue }
  if ($sexOf[$p.Bone] -ne 'f') { $male.Add($p) }
  if ($sexOf[$p.Bone] -ne 'm') { $female.Add($p) }
}
Write-Host ("Visibilite, corps masculin : " + [Visibility]::Annotate($male, 1.0, 30))
$lm = @{}
foreach ($p in $male) { $lm[$p] = $p.Label }
Write-Host ("Visibilite, corps feminin : " + [Visibility]::Annotate($female, 1.0, 30))
foreach ($p in $male) {
  if ($sexOf[$p.Bone]) { continue }
  $p.Label = if ($lm[$p] -eq $p.Label) { $lm[$p] } else { $lm[$p] + '|' + $p.Label }
}
# repere Z-Anatomy deja conforme : x = gauche du sujet, y = haut, z = anterieur
$stats = ''
$body = [Packer]::Pack($plist, 0, 1, 2, 1, 1, 1, [ref]$stats)
$header = @"
/* ==========================================================================
   Anotehomy Quizz - data/organ-model.js
   FICHIER GENERE par tools/build-organs.ps1 : ne pas modifier a la main.
   Charge a la demande par le jeu "Les organes".
   --------------------------------------------------------------------------
   Modele 3D : Z-Anatomy (https://github.com/Z-Anatomy), licence Creative
   Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0), lui-meme
   derive de BodyParts3D, (c) The Database Center for Life Science (CC BY 4.0).
   Modifications : regroupement des maillages par organe (js/data/organs.js),
   squelette en decor, simplification, quantification 16 bits, gzip.
   Ce fichier est donc distribue sous licence CC BY-SA 4.0.
   Unites : millimetres. Repere : x = gauche du sujet, y = haut, z = anterieur.
   Contenu : $stats
   parts : [type ("b" organe / "d" squelette), id de l'organe, cote,
            vues ou l'organe est visible ";" part visible en % (corps masculin, puis
            "|" corps feminin si different), nb sommets, nb indices]
   Organes feminins : Human Reference Atlas (HuBMAP), 3D Reference Organ Set for
   Female v1.5, Kristen Browne et Heidi Schlehlein (CC BY 4.0), recales ;
   clitoris, bulbes du vestibule, glandes vestibulaires majeures et uretre
   feminin generes.
   ========================================================================== */
AQ.data.ORGAN_MODEL =
"@
[System.IO.File]::WriteAllText((Join-Path $root 'js\data\organ-model.js'), $header + ' ' + $body + ";`n", (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Organes et squelette : $stats"
Write-Host "Termine en $([math]::Round($sw.Elapsed.TotalSeconds, 1)) s"
