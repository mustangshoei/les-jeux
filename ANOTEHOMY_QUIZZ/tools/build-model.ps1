# ==========================================================================
# Anotehomy Quizz - tools/build-model.ps1
# --------------------------------------------------------------------------
# Regenere js/data/skeleton-model.js a partir de BodyParts3D :
#   1. telecharge (une seule fois) l'archive OBJ et les tables d'elements
#   2. extrait les os listes dans bp3d-map.csv
#   3. simplifie les maillages pour tenir le budget de triangles
#   4. quantifie, compresse (gzip) et encode le tout en base64
#
# Utilisation (PowerShell, depuis le dossier du projet) :
#   powershell -ExecutionPolicy Bypass -File tools\build-model.ps1
#   powershell -ExecutionPolicy Bypass -File tools\build-model.ps1 -Budget 800000
#
# Le cache des telechargements (~140 Mo) est place par defaut dans le dossier
# temporaire de Windows pour ne pas etre synchronise par OneDrive.
# ==========================================================================
param(
  [int]$Budget = 300000,                 # triangles au total (equilibre)
  [int]$MinTris = 300,                   # minimum par os (jamais plus que l'original)
  [int]$MaxTris = 14000,                 # maximum par os
  [double]$DecoFactor = 0.35,            # dents et cartilages : detail reduit
  [string]$Cache = (Join-Path $env:TEMP 'anotehomy-bp3d')
)
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $here
$base = 'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST'
$files = @('isa_BP3D_4.0_obj_99.zip', 'isa_element_parts.txt', 'partof_element_parts.txt')

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

# ---------- 2-4. traitement (C#) ----------
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
Add-Type -TypeDefinition ([System.IO.File]::ReadAllText((Join-Path $here 'MeshBuild.cs'))) -Language CSharp `
  -ReferencedAssemblies System.IO.Compression, System.IO.Compression.FileSystem
$sw = [Diagnostics.Stopwatch]::StartNew()
$rows = [Builder]::LoadMap((Join-Path $here 'bp3d-map.csv'),
  [string[]]@((Join-Path $Cache 'isa_element_parts.txt'), (Join-Path $Cache 'partof_element_parts.txt')))
$parts = [Builder]::LoadParts((Join-Path $Cache 'isa_BP3D_4.0_obj_99.zip'), $rows)
# le coccyx est fusionne au sacrum dans BodyParts3D : separation automatique
Write-Host ([Builder]::SplitCoccyx($parts, 2, 0))
$targets = [Builder]::Targets($parts, $Budget, $MinTris, $MaxTris, $DecoFactor)
$warn = [Builder]::Simplify($parts, $targets, 7.0)
if ($warn) { Write-Host $warn }
# repere BodyParts3D (x = gauche, y = posterieur, z = haut) -> Three.js (x = gauche, y = haut, z = anterieur)
$stats = ''
$body = [Packer]::Pack($parts, 0, 2, 1, 1, 1, -1, [ref]$stats)

$header = @"
/* ==========================================================================
   Anotehomy Quizz - data/skeleton-model.js
   FICHIER GENERE par tools/build-model.ps1 : ne pas modifier a la main.
   --------------------------------------------------------------------------
   Modele 3D : BodyParts3D, (c) The Database Center for Life Science,
   licensed under CC Attribution 4.0 International
   (https://creativecommons.org/licenses/by/4.0/).
   Modifications : selection des os, separation du coccyx (fusionne au
   sacrum dans BodyParts3D), simplification des maillages, changement de
   repere, quantification 16 bits, compression gzip.
   Unites : millimetres. Repere : x = gauche du sujet, y = haut, z = anterieur.
   Contenu : $stats
   parts : [type ("b" os / "d" decor), id, cote, etiquette, nb sommets, nb indices]
   data  : base64(gzip(positions Int16 x3 puis indices Uint16 locaux a chaque partie))
   ========================================================================== */
AQ.data.MODEL =
"@
[System.IO.File]::WriteAllText((Join-Path $root 'js\data\skeleton-model.js'), $header + ' ' + $body + ";`n", (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Squelette : $stats"

# ---------- 5. os detailles du jeu "Osteologie descriptive" ----------
# resolution d'origine (pas de simplification), un os par ligne de osteo-map.csv,
# avec l'element BodyParts3D d'origine de chaque triangle (ex. : les 3 pieces du sternum)
$orows = [Builder]::LoadMap((Join-Path $here 'osteo-map.csv'),
  [string[]]@((Join-Path $Cache 'isa_element_parts.txt'), (Join-Path $Cache 'partof_element_parts.txt')))
$oparts = [Builder]::LoadParts((Join-Path $Cache 'isa_BP3D_4.0_obj_99.zip'), $orows)
# le coccyx detaille (separe du sacrum) est aussi un os de l'osteologie
[void][Builder]::SplitCoccyx($oparts, 2, 0, $true)
$ostats = ''
$obody = [Packer]::Pack($oparts, 0, 2, 1, 1, 1, -1, $true, [ref]$ostats)
$oheader = @"
/* ==========================================================================
   Anotehomy Quizz - data/osteo-model.js
   FICHIER GENERE par tools/build-model.ps1 : ne pas modifier a la main.
   Charge a la demande par le jeu "Osteologie descriptive".
   --------------------------------------------------------------------------
   Modele 3D : BodyParts3D, (c) The Database Center for Life Science,
   licensed under CC Attribution 4.0 International
   (https://creativecommons.org/licenses/by/4.0/).
   Modifications : selection des os (cote droit pour les os pairs), separation
   du coccyx, changement de repere, quantification 16 bits, compression gzip.
   Contenu : $ostats
   data : base64(gzip(positions Int16 x3 | indices Uint16 | element d'origine Uint8 par triangle))
   ========================================================================== */
AQ.data.OSTEO_MODEL =
"@
[System.IO.File]::WriteAllText((Join-Path $root 'js\data\osteo-model.js'), $oheader + ' ' + $obody + ";`n", (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Osteologie : $ostats"
Write-Host "Termine en $([math]::Round($sw.Elapsed.TotalSeconds, 1)) s"
