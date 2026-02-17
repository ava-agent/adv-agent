@echo off
REM ADV Moto Hub - CloudBase Deployment Script (Windows)
REM This script automates the deployment of both cloud functions and frontend

echo ==========================================
echo ADV Moto Hub - CloudBase Deployment
echo ==========================================
echo.

REM Check if CloudBase CLI is installed
where cloudbase >nul 2>nul
if %errorlevel% neq 0 (
    echo CloudBase CLI not found. Installing...
    call npm install -g @cloudbase/cli
    echo [OK] CloudBase CLI installed
) else (
    echo [OK] CloudBase CLI found
)

echo.
echo Checking CloudBase login status...
cloudbase env:list >nul 2>nul
if %errorlevel% neq 0 (
    echo Please login to CloudBase:
    call cloudbase login
) else (
    echo [OK] Already logged in to CloudBase
)

echo.
echo Current CloudBase environments:
call cloudbase env:list

REM Deploy cloud functions
echo.
echo Deploying cloud functions...
call cloudbase functions:deploy
if %errorlevel% neq 0 (
    echo [ERROR] Cloud functions deployment failed
    exit /b %errorlevel%
)
echo [OK] Cloud functions deployed

REM Build frontend
echo.
echo Building frontend...
cd adv-moto-web

REM Check if .env.local exists
if not exist .env.local (
    echo [ERROR] .env.local not found. Please create it from .env.example
    echo.
    echo Run: copy .env.example .env.local
    echo Then edit .env.local with your CloudBase Environment ID
    exit /b 1
)

REM Install dependencies if needed
if not exist node_modules (
    echo Installing dependencies...
    call npm install
)

REM Build the project
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed
    cd ..
    exit /b %errorlevel%
)
echo [OK] Frontend built successfully

cd ..

REM Deploy frontend to hosting
echo.
echo Deploying frontend to CloudBase Hosting...
call cloudbase hosting deploy adv-moto-web\dist
if %errorlevel% neq 0 (
    echo [ERROR] Frontend deployment failed
    exit /b %errorlevel%
)
echo [OK] Frontend deployed

echo.
echo ==========================================
echo [SUCCESS] Deployment completed successfully!
echo.
echo Next steps:
echo 1. Configure database security rules
echo 2. Create database indexes
echo 3. Configure storage rules
echo 4. Test your deployment
echo.
echo For detailed instructions, see DEPLOYMENT.md
echo ==========================================

pause
