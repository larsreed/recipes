[CmdletBinding()]
param(
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontend = Join-Path $root "recipe-frontend"

if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    throw "Java was not found on PATH. Install a Java 17 JDK and set JAVA_HOME, then run this script again."
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm was not found on PATH. Install Node.js 20.19+ or 22.12+, then run this script again."
}

if (-not $SkipInstall -and -not (Test-Path (Join-Path $frontend "node_modules"))) {
    Write-Host "Installing frontend dependencies with npm ci..."
    Push-Location $frontend
    try {
        npm ci
        if ($LASTEXITCODE -ne 0) {
            throw "npm ci failed."
        }
    }
    finally {
        Pop-Location
    }
}

$backendCommand = "& '$root\gradlew.bat' bootRun"
$frontendCommand = "& npm run dev"

Start-Process powershell.exe `
    -WorkingDirectory $root `
    -ArgumentList @("-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $backendCommand)

Start-Process powershell.exe `
    -WorkingDirectory $frontend `
    -ArgumentList @("-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $frontendCommand)

Write-Host "Backend console started: http://localhost:8080"
Write-Host "Frontend console started: http://localhost:5173"
Write-Host "Close both child PowerShell windows to stop the application."

