@echo off
echo [Opgaver] Starter WSL Sync...
wsl bash -c "cd /mnt/c/DEV/Centralen/backend && ./sync"
echo.
echo Færdig!
pause
