const fs = require('fs');
const bs58 = require('bs58');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const {
  Keypair,
  Connection,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  VersionedTransaction
} = require('@solana/web3.js');

async function main() {
  console.log('Starting smoke test (devnet)');
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  // Create ephemeral keypair
  const kp = Keypair.generate();
  console.log('Generated Keypair:', kp.publicKey.toBase58());

  // Airdrop 1 SOL
  console.log('Requesting airdrop of 1 SOL...');
  const sig = await connection.requestAirdrop(kp.publicKey, LAMPORTS_PER_SOL);
  await connection.confirmTransaction(sig, 'confirmed');
  console.log('Airdrop confirmed:', sig);

  // Load token list and pick a non-SOL token as target
  const tokenListRes = await fetch('https://token.jup.ag/strict?cluster=devnet');
  const tokenList = await tokenListRes.json();
  const nonSol = tokenList.find(t => t.address !== 'So11111111111111111111111111111111111111112');
  if (!nonSol) {
    throw new Error('No token found in Jupiter token list (devnet)');
  }
  const fromMint = 'So11111111111111111111111111111111111111112';
  const toMint = nonSol.address;
  console.log(`Swapping SOL -> ${nonSol.symbol} (${toMint})`);

  // Prepare amount: 0.01 SOL
  const amountRaw = Math.floor(0.01 * 1e9); // SOL decimals = 9

  const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${fromMint}&outputMint=${toMint}&amount=${amountRaw}&slippageBps=200&swapMode=ExactIn&cluster=devnet`;
  console.log('Fetching quote...');
  let quote = null;
  try {
    const qres = await fetch(quoteUrl + `&userPublicKey=${kp.publicKey.toBase58()}`);
    quote = await qres.json();
  } catch (e) {
    writeDebug({stage: 'quote_fetch_error', error: String(e), kp: kp.publicKey.toBase58()});
    throw e;
  }
  if (!quote || !quote.routes || !quote.routes[0]) {
    const msg = `No route from Jupiter: ${JSON.stringify(quote).slice(0,500)}`;
    writeDebug({stage: 'no_route', quote, kp: kp.publicKey.toBase58()});
    throw new Error(msg);
  }

  console.log('Requesting swap transaction from Jupiter...');
  let swapData = null;
  try {
    const swapRes = await fetch('https://quote-api.jup.ag/v6/swap', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        route: quote.routes[0],
        userPublicKey: kp.publicKey.toBase58(),
        wrapUnwrapSOL: true,
        asLegacyTransaction: false,
        cluster: 'devnet'
      })
    });
    swapData = await swapRes.json();
    if (!swapData || !swapData.swapTransaction) {
      writeDebug({stage: 'no_swap_tx', swapData, quote, kp: kp.publicKey.toBase58()});
      throw new Error('Swap endpoint did not return a transaction');
    }
  } catch (e) {
    writeDebug({stage: 'swap_request_error', error: String(e), swapData, quote, kp: kp.publicKey.toBase58()});
    throw e;
  }

  // Decode base64 transaction, deserialize, sign and send
  const txBuf = Buffer.from(swapData.swapTransaction, 'base64');
  const tx = VersionedTransaction.deserialize(new Uint8Array(txBuf));
  tx.sign([kp]);

  console.log('Sending signed transaction...');
  const raw = tx.serialize();
  const sendSig = await connection.sendRawTransaction(raw);
  console.log('Transaction sent:', sendSig);
  console.log('Explorer URL: https://explorer.solana.com/tx/' + sendSig + '?cluster=devnet');
  await connection.confirmTransaction(sendSig, 'confirmed');
  console.log('Transaction confirmed. Smoke test complete.');
}

main().catch(e => {
  console.error('Smoke test failed:', e && e.stack ? e.stack : e);
  process.exit(1);
});

function writeDebug(obj) {
  try {
    const path = __dirname + '/smoke_debug.json';
    fs.writeFileSync(path, JSON.stringify({ts: new Date().toISOString(), ...obj}, null, 2));
    console.error('Wrote debug file to', path);
  } catch (err) {
    console.error('Failed to write debug file', err);
  }
}
