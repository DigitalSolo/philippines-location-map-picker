@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM Root directory is fixed
set "ROOT=C:\www\packages\philippines-location-map-picker"

REM Extract directory name (e.g. anitas-crud)
for %%I in ("%ROOT%") do set "DIRNAME=%%~nxI"
for %%I in ("%ROOT%") do set "PARENT=%%~dpI"
if "%PARENT:~-1%"=="\" set "PARENT=%PARENT:~0,-1%"

set "ZIP=%ROOT%\%DIRNAME%.zip"

REM Remove existing archive if present
if exist "%ZIP%" del /f /q "%ZIP%"

REM Build dynamic WinRAR excludes for all junctions / reparse links under ROOT
set "JX="
for /f "delims=" %%J in ('dir "%ROOT%" /a:l /s /b 2^>nul') do (
    REM Exclude the link itself and anything under it
    set "JX=!JX! -x"%%~fJ" -x"%%~fJ\*""
)

REM Run from parent so ZIP keeps \... structure
pushd "%PARENT%"

"C:\Program Files\WinRAR\WinRAR.exe" -inul a -afzip -r "%ZIP%" "%DIRNAME%\*" ^
 -x*.exe ^
 -x*.msi ^
 -x*.log ^
 -x*.tmp ^
 -x*.txt ^
 -x*.sql ^
 -x*.bak ^
 -x*.md ^
 -x*.woff ^
 -x*.log ^
 -x*\.qodo\ ^
 -x*\installers\ ^
 -x*\database\ ^
 -x*\mkcert\ ^
 -x*\sql\ ^
 -x*\temp\ ^
 -x*\test\ ^
 -x*\tests\ ^
 -x*\external\ ^
 -x*\uploads\ ^
 -x*\node_modules\ ^
 -x*\vendor\ ^
 -x*\ffmpeg\ ^
 -x*\backups\ ^
 -x*\.git\ ^
 -x*\_DEL\ ^
 -x*\government\ ^
 -x*\wm\ ^
 -x*\wm\plugins\ ^
 -x*\wm\program\ ^
 -x*\wm\*.log ^
 -x*\filepond_upload\ ^
 -x*\NoPublicUpload\ ^
 -x*\migrations\ ^
 -x*\.vscode\ ^
 -x*\scripts\ ^
 -x*.png ^
 -x*.jpg ^
 -x*.xcf ^
 -x*.flac ^
 -x*.svg ^
 -x*.mp4 ^
 -x*.mp3 ^
 -x*.flac ^
 -x*.jpeg ^
 -x*.gif ^
 -x*.zip ^
 -x*.ico ^
 -x*.bat ^
 -x*.xml ^
 -x*.csv ^
 -x*.gz ^
 -x*.exe ^
 -x*.pem ^
 -x*.lock ^
 -x*.ftpquota ^
 -x*error_log ^
 !JX!

popd
endlocal