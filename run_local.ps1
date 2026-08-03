$ErrorActionPreference = "Stop"
$ProjectDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $ProjectDirectory

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Python was not found. Install Python 3.11 or newer from https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path -LiteralPath ".venv\Scripts\python.exe")) {
    Write-Host "Creating the local Python environment..."
    python -m venv .venv
}

Write-Host "Installing the small set of required packages..."
& ".venv\Scripts\python.exe" -m pip install --disable-pip-version-check -r requirements.txt

Write-Host ""
Write-Host "Loan Statement Calculator is starting at http://127.0.0.1:5000" -ForegroundColor Green
Write-Host "On first use, the browser will ask you to create the shared login."
Write-Host "Press Ctrl+C here when you want to stop it."
Start-Process "http://127.0.0.1:5000"
& ".venv\Scripts\python.exe" app.py
