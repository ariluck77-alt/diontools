const fs = require('fs');
const path = require('path');
const solanaWeb3 = require('@solana/web3.js');

(async () => {
  const infile = path.join(__dirname, '..', 'wallets_test.txt');
  if (!fs.existsSync(infile)) {
    console.error('wallets_test.txt not found. Run generate_wallets.js first.');
    process.exit(1);
  }
  const lines = fs.readFileSync(infile, 'utf8').trim().split(/\r?\n/).filter(Boolean);
  const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'), 'confirmed');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    let secretArr;
    try {
      secretArr = JSON.parse(line);
    } catch (e) {
      console.error('Invalid line (not JSON array):', line);
      continue;
    }
    const keypair = solanaWeb3.Keypair.fromSecretKey(new Uint8Array(secretArr));
    const pub = keypair.publicKey;
    console.log(`Requesting airdrop 1 SOL to wallet ${i+1} ${pub.toBase58()}...`);
    try {
      const sig = await connection.requestAirdrop(pub, solanaWeb3.LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, 'confirmed');
      console.log('Airdrop confirmed:', sig);
    } catch (err) {
      console.error('Airdrop failed for', pub.toBase58(), err.message || err);
    }
  }
})();
