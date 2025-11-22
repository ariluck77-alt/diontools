<#
setup_and_run.ps1
Automates local setup for the Solana multi-wallet demo.

Usage examples (PowerShell, run from project folder or right-click -> Run with PowerShell):

# Basic: generate 10 wallets
.\setup_and_run.ps1 -Count 10

# Generate 10 wallets and airdrop 1 SOL to each (devnet)
.\setup_and_run.ps1 -Count 10 -Airdrop

# If Node is missing and you want the script to try to install via winget
.\setup_and_run.ps1 -Count 10 -InstallNode -Airdrop

Notes:
- This script attempts to be safe: it will prompt or exit if required tools are missing.
- Installing Node with winget requires Administrator rights.
- The script will start the static server in a new PowerShell window and open http://localhost:8080.
#>
param(
    [int]$Count = 10,
    [switch]$Airdrop,
    [switch]$InstallNode
)

function Write-Info($s) { Write-Host $s -ForegroundColor Cyan }
function Write-Warn($s) { Write-Host $s -ForegroundColor Yellow }
function Write-Err($s) { Write-Host $s -ForegroundColor Red }

# Run from repo root
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir
Write-Info "Working directory: $projectDir"

# Check Node
$nodeExists = $false
try {
    $nv = & node -v 2>$null
    if ($LASTEXITCODE -eq 0) { $nodeExists = $true; Write-Info "Node detected: $nv" }
} catch {
    $nodeExists = $false
}

if (-not $nodeExists) {
    if ($InstallNode) {
        Write-Info "Attempting to install Node.js LTS via winget... (may require admin)"
        try {
            Start-Process -FilePath winget -ArgumentList 'install','OpenJS.NodeJS.LTS','-e','--source','winget' -Wait -NoNewWindow
            $nv = & node -v 2>$null
            if ($LASTEXITCODE -eq 0) { $nodeExists = $true; Write-Info "Node installed: $nv" }
        } catch {
            Write-Warn "winget install failed or winget not available. Please install Node.js manually from https://nodejs.org/"
        }
    } else {
        Write-Warn "Node.js not found. Install Node.js LTS and re-run this script, or re-run with -InstallNode to attempt winget install."
        exit 1
    }
}

# Ensure npm modules folder exists (npm init not required)
Write-Info "Running npm install (this will install runtime libs for helper scripts)..."
try {
    & npm install 2>&1 | Write-Host
} catch {
    Write-Warn "npm install may have failed; continue if you plan to run helper scripts which will install required deps.";
}

# Generate wallets
Write-Info "Generating $Count wallet(s)..."
try {
    & .\run_generate.ps1 -Count $Count
} catch {
    Write-Err "Failed to run run_generate.ps1: $_"; exit 1
}

# Optional airdrop
if ($Airdrop) {
    Write-Info "Running airdrop (devnet) to generated wallets..."
    try {
        & .\run_airdrop.ps1
    } catch {
        Write-Err "Airdrop script failed: $_"; exit 1
    }
}

# Start static server in new window
Write-Info "Starting static server (http://localhost:8080) in a new PowerShell window..."
$serverCmd = "npx http-server -c-1 -p 8080"
try {
    # Launch new PowerShell to run the server and keep it open
    Start-Process -FilePath powershell -ArgumentList "-NoExit","-Command","$serverCmd" -WindowStyle Normal
    Start-Sleep -Seconds 1
    Write-Info "Opening browser to http://localhost:8080"
    Start-Process "http://localhost:8080"
} catch {
    Write-Warn "Failed to start server automatically. You can run: npx http-server -c-1 -p 8080 or python -m http.server 8080"
}

Write-Info "Done. If you generated wallets, files are: wallets_test.txt and wallets_with_pub.txt in the project folder."