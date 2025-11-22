# PowerShell helper: install deps and run airdrop script (devnet)
Set-Location -Path (Join-Path $PSScriptRoot "..")
if (-not (Test-Path node_modules)) {
  Write-Host "Installing dependencies..."
  npm install @solana/web3.js@1.95.2
}
Write-Host "Airdropping 1 SOL to each wallet in wallets_test.txt..."
node .\scripts\airdrop_devnet.js
Write-Host "Done."
