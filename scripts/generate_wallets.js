const fs = require('fs');
const path = require('path');
const solanaWeb3 = require('@solana/web3.js');

(async () => {
  const outFile = path.join(__dirname, '..', 'wallets_test.txt');
  const outPubFile = path.join(__dirname, '..', 'wallets_with_pub.txt');
  const arg = process.argv[2] || process.env.COUNT || '3';
  const count = Math.max(1, parseInt(arg, 10) || 3);
  const lines = [];
  const pubLines = [];
  console.log('Generating', count, 'keypairs...');
  for (let i = 0; i < count; i++) {
    const kp = solanaWeb3.Keypair.generate();
    const secretArray = Array.from(kp.secretKey);
    lines.push(JSON.stringify(secretArray));
    pubLines.push(`${kp.publicKey.toBase58()},${JSON.stringify(secretArray)}`);
    console.log(`Wallet ${i+1}: ${kp.publicKey.toBase58()}`);
  }
  fs.writeFileSync(outFile, lines.join('\n'));
  fs.writeFileSync(outPubFile, pubLines.join('\n'));
  console.log('Wrote wallets to', outFile);
  console.log('Wrote public+secret list to', outPubFile);
})();
