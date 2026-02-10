$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$BackendVenvDir = Join-Path $BackendDir "venv"
$BackendPython = Join-Path $BackendDir "venv\Scripts\python.exe"
$FrontendVite = Join-Path $FrontendDir "node_modules\.bin\vite.cmd"

function Invoke-External {
    param(
        [string]$FilePath,
        [string[]]$Arguments,
        [string]$WorkingDirectory
    )

    Push-Location $WorkingDirectory
    try {
        & $FilePath @Arguments
        if ($LASTEXITCODE -ne 0) {
            throw "Command failed: $FilePath $($Arguments -join ' ')"
        }
    }
    finally {
        Pop-Location
    }
}

if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    Write-Host "npm is not available on PATH."
    Write-Host "Install Node.js (includes npm), then re-run this script."
    exit 1
}

if (-not (Test-Path $BackendPython)) {
    $pythonLauncher = $null
    if (Get-Command py -ErrorAction SilentlyContinue) {
        $pythonLauncher = "py"
    }
    elseif (Get-Command python -ErrorAction SilentlyContinue) {
        $pythonLauncher = "python"
    }

    if ($null -eq $pythonLauncher) {
        Write-Host "Python is not installed or not available on PATH."
        Write-Host "Install Python 3, then re-run this script."
        exit 1
    }

    Write-Host "Backend venv not found. Creating it at $BackendVenvDir"
    Invoke-External -FilePath $pythonLauncher -Arguments @("-m", "venv", $BackendVenvDir) -WorkingDirectory $RootDir
}

$backendDepsMissing = $false
Push-Location $BackendDir
try {
    & $BackendPython -c "import fastapi, uvicorn"
    if ($LASTEXITCODE -ne 0) {
        $backendDepsMissing = $true
    }
}
finally {
    Pop-Location
}

if ($backendDepsMissing) {
    Write-Host "Backend dependencies missing. Installing from requirements.txt"
    Invoke-External -FilePath $BackendPython -Arguments @("-m", "pip", "install", "-r", "requirements.txt") -WorkingDirectory $BackendDir
}

if (-not (Test-Path $FrontendVite)) {
    Write-Host "Frontend dependencies missing. Installing with npm"
    Invoke-External -FilePath "npm.cmd" -Arguments @("install") -WorkingDirectory $FrontendDir
}

$backendProcess = $null
$frontendProcess = $null

try {
    Write-Host "Starting backend (FastAPI)"
    $backendProcess = Start-Process `
        -FilePath $BackendPython `
        -ArgumentList @("-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000") `
        -WorkingDirectory $BackendDir `
        -NoNewWindow `
        -PassThru

    Write-Host "Starting frontend (Vite)"
    $frontendProcess = Start-Process `
        -FilePath "npm.cmd" `
        -ArgumentList @("run", "dev") `
        -WorkingDirectory $FrontendDir `
        -NoNewWindow `
        -PassThru

    Wait-Process -Id @($backendProcess.Id, $frontendProcess.Id)
}
finally {
    if ($null -ne $backendProcess -and -not $backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -ErrorAction SilentlyContinue
    }
    if ($null -ne $frontendProcess -and -not $frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -ErrorAction SilentlyContinue
    }
}
