<#
install_and_smoke.ps1
Runs npm install, executes the smoke test (devnet), then starts the static server.

Usage:
.\install_and_smoke.ps1

Notes:
- This script does not elevate. Run PowerShell as Administrator if you need to install Node via winget.
- It assumes Node.js is already installed and available in PATH.
#>
Write-Host "Running install_and_smoke.ps1" -ForegroundColor Cyan
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

# Log file
$logFile = Join-Path $projectDir 'install_and_smoke.log'
"=== install_and_smoke started: $(Get-Date -Format o) ===" | Out-File -FilePath $logFile -Encoding utf8 -Append

function Write-Log([string]$s) {
    $line = "$(Get-Date -Format o) `t $s"
    Write-Host $s
    $line | Out-File -FilePath $logFile -Encoding utf8 -Append
}

function Run-Command($cmd) {
    Write-Log "> $cmd"
    try {
        $output = & cmd /c $cmd 2>&1
        if ($output) { $output | Out-File -FilePath $logFile -Encoding utf8 -Append }
    } catch {
        $_ | Out-String | Out-File -FilePath $logFile -Encoding utf8 -Append
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Log "Command failed with exit code $LASTEXITCODE: $cmd"
        throw "Command failed: $cmd (exit $LASTEXITCODE)"
    }
}

try {
    Write-Log "Installing npm dependencies..."
    Run-Command "npm install"

    Write-Log "Running smoke test (this will airdrop 1 SOL to an ephemeral key on devnet)..."
    Run-Command "npm run smoke"

    Write-Log "Starting static server in a new PowerShell window..."
    $serverCmd = "npm start"
    Start-Process -FilePath powershell -ArgumentList "-NoExit","-Command","$serverCmd" -WindowStyle Normal

    Write-Log "Opening browser to http://localhost:8080"
    Start-Process "http://localhost:8080"

    Write-Log "install_and_smoke completed successfully."
} catch {
    $err = $_.Exception.Message
    Write-Log "ERROR: $err"
    if ($_.Exception.InnerException) { Write-Log "Inner: $($_.Exception.InnerException.Message)" }
    Write-Log "See log file for full details: $logFile"
    exit 1
} finally {
    "=== install_and_smoke finished: $(Get-Date -Format o) ===`n" | Out-File -FilePath $logFile -Encoding utf8 -Append
}
