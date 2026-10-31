# push.ps1 — git add / commit / push rapide
# Usage : .\push.ps1 "message du commit"
param(
    [Parameter(Mandatory, HelpMessage='Message du commit')]
    [string]$Message
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Dossiers a ne jamais pousser
$INTERDITS = @('SERVEUR/donnees', 'IGNORED_BY_CLAUDE')

Write-Host "`n=== Etat avant add ===" -ForegroundColor Cyan
git status --short

git add .

# Verification de securite sur les fichiers stagnes
$stagnes = git diff --cached --name-only
foreach ($chemin in $stagnes) {
    foreach ($interdit in $INTERDITS) {
        if ($chemin -like "$interdit*") {
            Write-Host "`nARRET : fichier sensible detecte dans l'index :" -ForegroundColor Red
            Write-Host "  $chemin" -ForegroundColor Red
            git reset HEAD -- $chemin | Out-Null
            Write-Error "Push annule. Relancez apres correction."
            exit 1
        }
    }
}

Write-Host "`n=== Fichiers qui seront commites ===" -ForegroundColor Cyan
git diff --cached --stat

git commit -m $Message
git push

Write-Host "`nPush termine." -ForegroundColor Green
