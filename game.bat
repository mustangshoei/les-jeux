@echo off
rem ==========================================================================
rem  game.bat - Lance les jeux AVEC les comptes (Windows) : double-cliquez dessus.
rem  Demarre le serveur des jeux (SERVEUR\serveur.py, Python 3.8 ou plus recent)
rem  et ouvre la page d'accueil dans le navigateur. Laissez la fenetre ouverte
rem  pendant que vous jouez ; la fermer arrete le serveur. Serveur deja lance :
rem  un nouveau double-clic ouvre simplement le navigateur.
rem  Options transmises au serveur, par exemple :  game.bat --port 8081
rem ==========================================================================
chcp 65001 >nul
title Les jeux - serveur
cd /d "%~dp0"

rem Python : lanceur "py" de Windows, sinon "python" (pas le raccourci du Microsoft Store)
set "PY="
py -3 --version >nul 2>nul && set "PY=py -3"
if not defined PY (
  python --version >nul 2>nul && set "PY=python"
)

if not defined PY (
  echo.
  echo  Python est introuvable sur cet ordinateur.
  echo  Installez Python 3 depuis https://www.python.org/downloads/
  echo  en cochant « Add python.exe to PATH », puis relancez game.bat.
  echo.
  echo  Sans Python, on peut quand même jouer en invité, sans comptes :
  echo  ouvrez index.html.
  echo.
  pause
  exit /b 1
)

echo.
echo  Serveur des jeux : laissez cette fenêtre ouverte pendant que vous jouez.
echo  Pour l'arrêter : fermez cette fenêtre, ou Ctrl+C.
echo  Si Windows demande d'autoriser Python sur le réseau, acceptez pour jouer
echo  aussi depuis les autres appareils de la maison.
echo.
%PY% "SERVEUR\serveur.py" --ouvrir %*
if errorlevel 1 (
  echo.
  pause
) else (
  timeout /t 4 >nul
)
