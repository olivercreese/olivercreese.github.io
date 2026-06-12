@echo off
rem Double-click this file to preview the site like a real website.
rem It starts a tiny web server on your PC and opens the site in your
rem browser. YouTube videos only play when viewed this way (not when
rem opening the HTML files directly).

cd /d "%~dp0"
echo.
echo   Site preview running at http://localhost:8000
echo   Keep this window open while browsing.
echo   CLOSE THIS WINDOW when you're done to stop the preview.
echo.
start "" "http://localhost:8000"
python -m http.server 8000 >nul 2>&1
