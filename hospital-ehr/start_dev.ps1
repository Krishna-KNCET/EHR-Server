param(
    [switch]$UseDockerMongo
)

# PowerShell script to start backend development safely (without port conflicts)
$ErrorActionPreference = "Stop"

# Ensure the script runs from the backend folder
Set-Location $PSScriptRoot

if ($UseDockerMongo) {
    Write-Host "Checking Docker installation..."
    if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
        Write-Error "Docker is not installed or not in PATH. Install Docker Desktop or run without -UseDockerMongo."
        exit 1
    }

    Write-Host "Starting MongoDB container only..."
    docker compose up -d mongo
}

Write-Host "Using MongoDB URI: mongodb://localhost:27017/hospital_ehr"
$env:MONGO_URI = "mongodb://localhost:27017/hospital_ehr"

Write-Host "Checking whether port 4000 is already in use..."
$portListener = Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($portListener) {
    $owner = Get-Process -Id $portListener.OwningProcess -ErrorAction SilentlyContinue
    $ownerName = if ($owner) { $owner.ProcessName } else { "PID $($portListener.OwningProcess)" }
    Write-Error "Port 4000 is already in use by $ownerName (PID $($portListener.OwningProcess)). Stop it before starting the API."
    exit 1
}

Write-Host "Starting API on port 4000..."
npm run dev