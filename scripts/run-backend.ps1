# HexaShield - Backend dev runner
# Starts the FastAPI backend with auto-reload scoped to the backend source.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
$python = Join-Path $backend ".venv\Scripts\python.exe"

if (-not (Test-Path $python)) {
    Write-Host "[setup] Creating virtual environment..." -ForegroundColor Cyan
    python -m venv (Join-Path $backend ".venv")
    & $python -m pip install --upgrade pip
    & $python -m pip install -r (Join-Path $backend "requirements.txt")
}

Set-Location $backend
Write-Host "[backend] Starting FastAPI on http://0.0.0.0:8000 (reload)" -ForegroundColor Green
& $python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload --reload-dir $backend
