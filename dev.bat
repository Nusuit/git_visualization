@echo off
echo Starting Git Flow Visualizer...
echo.

echo Step 1: Starting Vite dev server...
start /B npm run dev:vite

echo Step 2: Waiting for Vite to be ready...
timeout /t 5 /nobreak > nul

echo Step 3: Compiling TypeScript...
call tsc -p tsconfig.main.json
if errorlevel 1 (
    echo ERROR: TypeScript compilation failed for main process!
    pause
    exit /b 1
)

call tsc -p tsconfig.preload.json
if errorlevel 1 (
    echo ERROR: TypeScript compilation failed for preload script!
    pause
    exit /b 1
)

echo Step 4: Starting Electron...
set NODE_ENV=development
electron .

pause

