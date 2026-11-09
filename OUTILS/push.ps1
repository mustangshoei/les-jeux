# OUTILS/push.ps1 — git add / commit / push rapide
# Usage (depuis n'importe quel dossier) : .\OUTILS\push.ps1 "message du commit"
# Le script se place d'abord à la racine du dépôt (le dossier au-dessus de OUTILS/).
param(
    [Parameter(Mandatory, HelpMessage = 'Message du commit')]
    [string]$Message
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Dossiers a ne jamais pousser
$INTERDITS = @('SERVEUR/donnees', 'IGNORED_BY_CLAUDE')

Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    Write-Host "`n=== Etat avant add ===" -ForegroundColor Cyan
    git status --short

    git add .

    # Verification de securite sur les fichiers indexes
    $indexes = git diff --cached --name-only
    foreach ($chemin in $indexes) {
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
}
finally {
    Pop-Location
}
