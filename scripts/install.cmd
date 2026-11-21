@echo off
if "%~2"=="" (echo Usage: scripts\install.cmd TARGET HOST & exit /b 1)
node packages\cli\accesssutra.mjs install-ide --target "%~1" --host "%~2"
exit /b %errorlevel%
