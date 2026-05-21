@echo off
echo ========================================
echo  Property Inventory AI - GitHub Push
echo ========================================
echo.

cd /d "%~dp0"

echo Configuring Git for large repository...
git config http.postBuffer 1048576000
git config http.timeout 3600
git config core.compression 0

echo.
echo Attempting to push to GitHub...
echo Repository: https://github.com/hyndhavamahesh345/InventoryAI
echo.

git push -f origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  SUCCESS! Code pushed to GitHub
    echo ========================================
    echo.
    echo View your repository at:
    echo https://github.com/hyndhavamahesh345/InventoryAI
    echo.
) else (
    echo.
    echo ========================================
    echo  Push failed. Try these alternatives:
    echo ========================================
    echo.
    echo 1. Use GitHub Desktop (Recommended)
    echo    Download: https://desktop.github.com/
    echo.
    echo 2. Try with SSH:
    echo    git remote set-url origin git@github.com:hyndhavamahesh345/InventoryAI.git
    echo    git push -f origin main
    echo.
    echo 3. Use different network (mobile hotspot/VPN)
    echo.
    echo 4. See MANUAL_PUSH_COMMANDS.txt for more options
    echo.
)

pause
