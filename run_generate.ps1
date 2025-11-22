# PowerShell helper: install deps and generate test wallets
param(
    [int]$Count = 3
)

Set-Location -Path (Join-Path $PSScriptRoot "..")
if (-not (Test-Path node_modules)) {
  Write-Host "Installing dependencies..."
  npm install @solana/web3.js@1.95.2
}
Write-Host "Generating wallets_test.txt... (count=$Count)"
node .\scripts\generate_wallets.js $Count
Write-Host "Done. Files: $(Join-Path (Get-Location) 'wallets_test.txt') and wallets_with_pub.txt" 
