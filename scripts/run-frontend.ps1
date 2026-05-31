# HexaShield - Frontend dev runner
# Starts the Vite dev server. Pass -Host to expose on the local network.
param([switch]$Expose)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root "frontend"

if (-not (Test-Path (Join-Path $frontend "node_modules"))) {
    Write-Host "[setup] Installing frontend dependencies..." -ForegroundColor Cyan
    npm --prefix $frontend install
}

Write-Host "[frontend] Starting Vite dev server on http://localhost:5174" -ForegroundColor Green
if ($Expose) {
    npm --prefix $frontend run dev -- --host
} else {
    npm --prefix $frontend run dev
}
