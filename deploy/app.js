// ===== SOLANA PRO TRADING SUITE - MAIN APPLICATION =====

// BS58 decode function (if bs58 library not available)
const bs58 = {
	decode: function(str) {
		const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
		const ALPHABET_MAP = {};
		for (let i = 0; i < ALPHABET.length; i++) {
			ALPHABET_MAP[ALPHABET[i]] = i;
		}
		
		let bytes = [0];
		for (let i = 0; i < str.length; i++) {
			const c = str[i];
			if (!(c in ALPHABET_MAP)) throw new Error('Invalid base58 character');
			
			let carry = ALPHABET_MAP[c];
			for (let j = 0; j < bytes.length; j++) {
				carry += bytes[j] * 58;
				bytes[j] = carry & 0xff;
				carry >>= 8;
			}
			
			while (carry > 0) {
				bytes.push(carry & 0xff);
				carry >>= 8;
			}
		}
		
		for (let i = 0; i < str.length && str[i] === '1'; i++) {
			bytes.push(0);
		}
		
		return new Uint8Array(bytes.reverse());
	}
};

let wallets = []; // Array to store up to 99 wallets
let masterWallet = null; // Master wallet for funding
let stopTrading = false;
let priceChart = null;
let dexUpdateInterval = null;
let monitoredToken = null;
let currentTimeframe = '5m';
let chartData = {
	labels: [],
	prices: []
};

let phantomWallet = null; // Phantom wallet connection

// ===== PHANTOM WALLET FUNCTIONS =====

async function connectPhantom() {
	try {
		// Check if Phantom is installed
		const isPhantomInstalled = window.solana && window.solana.isPhantom;
		
		if (!isPhantomInstalled) {
			alert('Phantom wallet not found! Please install Phantom extension from phantom.app');
			window.open('https://phantom.app/', '_blank');
			return;
		}
		
		// Connect to Phantom
		const resp = await window.solana.connect();
		const publicKey = resp.publicKey.toString();
		
		// Create wallet object that works with existing functions
		phantomWallet = {
			publicKey: resp.publicKey,
			isPhantom: true
		};
		
		// Set as master wallet
		masterWallet = phantomWallet;
		
		// Update UI
		document.getElementById('phantomAddress').textContent = 
			publicKey.substring(0, 8) + '...' + publicKey.substring(publicKey.length - 8);
		document.getElementById('phantomWalletInfo').style.display = 'block';
		document.getElementById('phantomConnectBtn').style.display = 'none';
		document.getElementById('phantomDisconnectBtn').style.display = 'block';
		
		// Update balance
		await updatePhantomBalance();
		
		showNotification('Phantom Connected', 'Wallet connected successfully');
		
	} catch (error) {
		console.error('Error connecting to Phantom:', error);
		alert('Failed to connect to Phantom: ' + error.message);
	}
}

async function disconnectPhantom() {
	try {
		if (window.solana && window.solana.isPhantom) {
			await window.solana.disconnect();
		}
		
		phantomWallet = null;
		if (masterWallet && masterWallet.isPhantom) {
			masterWallet = null;
		}
		
		document.getElementById('phantomWalletInfo').style.display = 'none';
		document.getElementById('phantomConnectBtn').style.display = 'block';
		document.getElementById('phantomDisconnectBtn').style.display = 'none';
		
		showNotification('Phantom Disconnected', 'Wallet disconnected');
		
	} catch (error) {
		console.error('Error disconnecting Phantom:', error);
	}
}

async function updatePhantomBalance() {
	if (!phantomWallet) return;
	
	try {
		const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'), 'confirmed');
		const balance = await connection.getBalance(phantomWallet.publicKey);
		const solBalance = (balance / solanaWeb3.LAMPORTS_PER_SOL).toFixed(4);
		
		document.getElementById('phantomBalance').textContent = `${solBalance} SOL`;
		
	} catch (error) {
		console.error('Error fetching Phantom balance:', error);
	}
}

// ===== MASTER WALLET FUNCTIONS =====

// Load master wallet from private key
async function loadMasterWallet() {
	const privateKeyInput = document.getElementById('masterWalletPrivateKey').value.trim();
	
	if (!privateKeyInput) {
		alert('Please enter a private key');
		return;
	}
	
	try {
		let secretKey;
		
		// Try to parse as base58 (most common format)
		try {
			secretKey = bs58.decode(privateKeyInput);
		} catch (e) {
			// Try to parse as JSON array
			try {
				secretKey = new Uint8Array(JSON.parse(privateKeyInput));
			} catch (e2) {
				throw new Error('Invalid private key format. Use base58 string or JSON array [1,2,3,...]');
			}
		}
		
		if (secretKey.length !== 64) {
			throw new Error('Invalid private key length. Must be 64 bytes.');
		}
		
		masterWallet = solanaWeb3.Keypair.fromSecretKey(secretKey);
		
		// Update display
		document.getElementById('masterWalletAddress').textContent = 
			masterWallet.publicKey.toBase58().substring(0, 12) + '...' + 
			masterWallet.publicKey.toBase58().substring(masterWallet.publicKey.toBase58().length - 12);
		
		// Get balance
		await updateMasterWalletBalance();
		
		document.getElementById('masterWalletInfo').style.display = 'block';
		showNotification('Master Wallet Loaded', 'Ready to distribute/collect SOL');
	} catch (error) {
		alert('Error loading master wallet: ' + error.message);
		console.error(error);
	}
}

// Update master wallet balance
async function updateMasterWalletBalance() {
	if (!masterWallet) return;
	
	try {
		const rpcEndpoint = document.getElementById('rpcEndpoint')?.value || 'https://api.mainnet-beta.solana.com';
		const customRpc = document.getElementById('customRpc')?.value;
		const finalRpc = rpcEndpoint === 'custom' && customRpc ? customRpc : rpcEndpoint;
		
		const connection = new solanaWeb3.Connection(finalRpc, 'confirmed');
		const balance = await connection.getBalance(masterWallet.publicKey);
		const solBalance = (balance / solanaWeb3.LAMPORTS_PER_SOL).toFixed(4);
		
		document.getElementById('masterWalletBalance').textContent = `${solBalance} SOL`;
	} catch (error) {
		console.error('Error fetching master wallet balance:', error);
		document.getElementById('masterWalletBalance').textContent = 'Error';
	}
}

// Distribute SOL to selected wallets
async function distributeToSelected() {
	if (!masterWallet) {
		alert('Please load master wallet first');
		return;
	}
	
	const selectedCheckboxes = document.querySelectorAll('.wallet-checkbox:checked');
	if (selectedCheckboxes.length === 0) {
		alert('No wallets selected');
		return;
	}
	
	const amount = parseFloat(document.getElementById('distributionAmount').value);
	if (!amount || amount <= 0) {
		alert('Please enter a valid amount');
		return;
	}
	
	const confirmMsg = `Distribute ${amount} SOL to ${selectedCheckboxes.length} wallet(s)?\n\nTotal: ${(amount * selectedCheckboxes.length).toFixed(4)} SOL`;
	if (!confirm(confirmMsg)) return;
	
	try {
		const rpcEndpoint = document.getElementById('rpcEndpoint')?.value || 'https://api.mainnet-beta.solana.com';
		const customRpc = document.getElementById('customRpc')?.value;
		const finalRpc = rpcEndpoint === 'custom' && customRpc ? customRpc : rpcEndpoint;
		
		const connection = new solanaWeb3.Connection(finalRpc, 'confirmed');
		let successCount = 0;
		let failCount = 0;
		
		for (const checkbox of selectedCheckboxes) {
			const index = parseInt(checkbox.dataset.index);
			const wallet = wallets[index];
			
			if (!wallet) continue;
			
			try {
				const recipientPubkey = new solanaWeb3.PublicKey(wallet.publicKey);
				const lamports = amount * solanaWeb3.LAMPORTS_PER_SOL;
				
				const transaction = new solanaWeb3.Transaction().add(
					solanaWeb3.SystemProgram.transfer({
						fromPubkey: masterWallet.publicKey,
						toPubkey: recipientPubkey,
						lamports: lamports
					})
				);
				
				let signature;
				if (masterWallet.isPhantom) {
					// Use Phantom to sign transaction
					transaction.feePayer = masterWallet.publicKey;
					const { blockhash } = await connection.getLatestBlockhash();
					transaction.recentBlockhash = blockhash;
					
					const signed = await window.solana.signAndSendTransaction(transaction);
					signature = signed.signature;
				} else {
					// Use keypair to sign
					signature = await solanaWeb3.sendAndConfirmTransaction(
						connection,
						transaction,
						[masterWallet],
						{ commitment: 'confirmed' }
					);
				}
				
				successCount++;
				console.log(`✅ Distributed ${amount} SOL to wallet #${index + 1}: ${signature}`);
				
				// Update wallet balance display
				const newBalance = await connection.getBalance(recipientPubkey);
				const balanceEl = document.getElementById(`balance-${index}`);
				if (balanceEl) {
					balanceEl.textContent = `${(newBalance / solanaWeb3.LAMPORTS_PER_SOL).toFixed(4)} SOL`;
				}
				
			} catch (error) {
				failCount++;
				console.error(`❌ Failed to distribute to wallet #${index + 1}:`, error);
			}
		}
		
		await updateMasterWalletBalance();
		alert(`Distribution complete!\n✅ Success: ${successCount}\n❌ Failed: ${failCount}`);
		
	} catch (error) {
		alert('Distribution error: ' + error.message);
		console.error(error);
	}
}

// Collect SOL from selected wallets
async function collectFromSelected() {
	if (!masterWallet) {
		alert('Please load master wallet first');
		return;
	}
	
	const selectedCheckboxes = document.querySelectorAll('.wallet-checkbox:checked');
	if (selectedCheckboxes.length === 0) {
		alert('No wallets selected');
		return;
	}
	
	const confirmMsg = `Collect all SOL from ${selectedCheckboxes.length} wallet(s) to master wallet?`;
	if (!confirm(confirmMsg)) return;
	
	try {
		const rpcEndpoint = document.getElementById('rpcEndpoint')?.value || 'https://api.mainnet-beta.solana.com';
		const customRpc = document.getElementById('customRpc')?.value;
		const finalRpc = rpcEndpoint === 'custom' && customRpc ? customRpc : rpcEndpoint;
		
		const connection = new solanaWeb3.Connection(finalRpc, 'confirmed');
		let successCount = 0;
		let failCount = 0;
		let totalCollected = 0;
		
		for (const checkbox of selectedCheckboxes) {
			const index = parseInt(checkbox.dataset.index);
			const wallet = wallets[index];
			
			if (!wallet || !wallet.secretKey) {
				failCount++;
				continue;
			}
			
			try {
				const senderKeypair = solanaWeb3.Keypair.fromSecretKey(new Uint8Array(wallet.secretKey));
				const balance = await connection.getBalance(senderKeypair.publicKey);
				
				// Calculate transfer amount (leave some for rent)
				const rentExemption = await connection.getMinimumBalanceForRentExemption(0);
				const transferAmount = balance - rentExemption - 5000; // Keep small buffer
				
				if (transferAmount <= 0) {
					console.log(`⚠️ Wallet #${index + 1} has insufficient balance`);
					failCount++;
					continue;
				}
				
				const transaction = new solanaWeb3.Transaction().add(
					solanaWeb3.SystemProgram.transfer({
						fromPubkey: senderKeypair.publicKey,
						toPubkey: masterWallet.publicKey,
						lamports: transferAmount
					})
				);
				
				const signature = await solanaWeb3.sendAndConfirmTransaction(
					connection,
					transaction,
					[senderKeypair],
					{ commitment: 'confirmed' }
				);
				
				const collected = transferAmount / solanaWeb3.LAMPORTS_PER_SOL;
				totalCollected += collected;
				successCount++;
				console.log(`✅ Collected ${collected.toFixed(4)} SOL from wallet #${index + 1}: ${signature}`);
				
				// Update wallet balance display
				const newBalance = await connection.getBalance(senderKeypair.publicKey);
				const balanceEl = document.getElementById(`balance-${index}`);
				if (balanceEl) {
					balanceEl.textContent = `${(newBalance / solanaWeb3.LAMPORTS_PER_SOL).toFixed(4)} SOL`;
				}
				
			} catch (error) {
				failCount++;
				console.error(`❌ Failed to collect from wallet #${index + 1}:`, error);
			}
		}
		
		await updateMasterWalletBalance();
		alert(`Collection complete!\n✅ Success: ${successCount}\n❌ Failed: ${failCount}\n💰 Total collected: ${totalCollected.toFixed(4)} SOL`);
		
	} catch (error) {
		alert('Collection error: ' + error.message);
		console.error(error);
	}
}

// Distribute total amount equally among selected wallets
async function distributeTotalEqually() {
	if (!masterWallet) {
		alert('⚠️ Please load Master Wallet first!');
		return;
	}
	
	const totalAmountInput = document.getElementById('totalDistributionAmount');
	const totalAmount = parseFloat(totalAmountInput.value);
	
	if (!totalAmount || totalAmount <= 0) {
		alert('⚠️ Please enter valid total amount!');
		return;
	}
	
	const selectedCheckboxes = document.querySelectorAll('.wallet-checkbox:checked');
	if (selectedCheckboxes.length === 0) {
		alert('⚠️ Please select at least one wallet!');
		return;
	}
	
	const perWalletAmount = totalAmount / selectedCheckboxes.length;
	const totalLamports = Math.floor(totalAmount * solanaWeb3.LAMPORTS_PER_SOL);
	const perWalletLamports = Math.floor(perWalletAmount * solanaWeb3.LAMPORTS_PER_SOL);
	
	// Check master wallet balance
	const masterBalance = await connection.getBalance(masterWallet.publicKey);
	if (masterBalance < totalLamports) {
		alert(`⚠️ Insufficient balance in Master Wallet!\nRequired: ${totalAmount.toFixed(4)} SOL\nAvailable: ${(masterBalance / solanaWeb3.LAMPORTS_PER_SOL).toFixed(4)} SOL`);
		return;
	}
	
	const confirmed = confirm(
		`💎 Split Total Equally Distribution:\n\n` +
		`Total Amount: ${totalAmount.toFixed(4)} SOL\n` +
		`Selected Wallets: ${selectedCheckboxes.length}\n` +
		`Amount per wallet: ${perWalletAmount.toFixed(6)} SOL\n\n` +
		`Do you want to proceed?`
	);
	
	if (!confirmed) return;
	
	try {
		let successCount = 0;
		let failCount = 0;
		
		for (const checkbox of selectedCheckboxes) {
			const index = parseInt(checkbox.dataset.index);
			const wallet = wallets[index];
			
			if (!wallet || !wallet.secretKey) {
				failCount++;
				continue;
			}
			
			try {
				const recipientKeypair = solanaWeb3.Keypair.fromSecretKey(new Uint8Array(wallet.secretKey));
				
				const transaction = new solanaWeb3.Transaction().add(
					solanaWeb3.SystemProgram.transfer({
						fromPubkey: masterWallet.publicKey,
						toPubkey: recipientKeypair.publicKey,
						lamports: perWalletLamports
					})
				);
				
				let signature;
				if (masterWallet.isPhantom) {
					// Use Phantom to sign transaction
					transaction.feePayer = masterWallet.publicKey;
					const { blockhash } = await connection.getLatestBlockhash();
					transaction.recentBlockhash = blockhash;
					
					const signed = await window.solana.signAndSendTransaction(transaction);
					signature = signed.signature;
				} else {
					// Use keypair to sign
					signature = await solanaWeb3.sendAndConfirmTransaction(
						connection,
						transaction,
						[masterWallet],
						{ commitment: 'confirmed' }
					);
				}
				
				successCount++;
				console.log(`✅ Distributed ${perWalletAmount.toFixed(6)} SOL to wallet #${index + 1}: ${signature}`);
				
				// Update wallet balance display
				const newBalance = await connection.getBalance(recipientKeypair.publicKey);
				const balanceEl = document.getElementById(`balance-${index}`);
				if (balanceEl) {
					balanceEl.textContent = `${(newBalance / solanaWeb3.LAMPORTS_PER_SOL).toFixed(4)} SOL`;
				}
				
			} catch (error) {
				failCount++;
				console.error(`❌ Failed to distribute to wallet #${index + 1}:`, error);
			}
		}
		
		await updateMasterWalletBalance();
		alert(
			`💎 Equal Distribution Complete!\n\n` +
			`Total Distributed: ${totalAmount.toFixed(4)} SOL\n` +
			`Per Wallet: ${perWalletAmount.toFixed(6)} SOL\n` +
			`✅ Success: ${successCount}\n` +
			`❌ Failed: ${failCount}`
		);
		
	} catch (error) {
		alert('Distribution error: ' + error.message);
		console.error(error);
	}
}

// ===== HELPER FUNCTIONS =====

// Set token address from quick buttons
function setToken(inputId, address) {
	const input = document.getElementById(inputId);
	if (input) {
		input.value = address;
		input.style.borderColor = 'rgba(16, 185, 129, 0.5)';
		input.style.background = 'rgba(16, 185, 129, 0.05)';
		
		// Reset style after 500ms
		setTimeout(() => {
			input.style.borderColor = '';
			input.style.background = '';
		}, 500);
	}
}

// ===== WALLET MANAGEMENT =====

// Show generate dialog
function showGenerateDialog() {
	const count = prompt("How many wallets to generate? (1-99)", "10");
	if (count && !isNaN(count) && count >= 1 && count <= 99) {
		generateMultipleWallets(parseInt(count));
	}
}

// Generate multiple wallets
async function generateMultipleWallets(count = 10) {
	const newWallets = [];
	for (let i = 0; i < count; i++) {
		const keypair = solanaWeb3.Keypair.generate();
		newWallets.push({
			publicKey: keypair.publicKey.toBase58(),
			secretKey: Array.from(keypair.secretKey)
		});
	}
	
	wallets = newWallets;
	renderWalletList();
	updateHeaderStats();
	
	// Auto-download
	const dataStr = JSON.stringify(newWallets, null, 2);
	const blob = new Blob([dataStr], {type: 'application/json'});
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `solana-wallets-${Date.now()}.json`;
	a.click();
	URL.revokeObjectURL(url);
	
	showNotification('Wallets Generated', `${count} wallets created and downloaded`);
}

// Import wallets from file
function importWalletsFromFile(event) {
	const file = event.target.files[0];
	if (!file) return;
	
	const reader = new FileReader();
	reader.onload = function(e) {
		try {
			const content = e.target.result;
			let imported = [];
			
			// Try JSON format
			try {
				imported = JSON.parse(content);
			} catch {
				// Try line-by-line format
				const lines = content.split('\n').filter(l => l.trim());
				imported = lines.map(line => {
					try {
						const parsed = JSON.parse(line);
						return parsed;
					} catch {
						// Assume it's a base58 secret key
						const decoded = bs58.decode(line.trim());
						const keypair = solanaWeb3.Keypair.fromSecretKey(decoded);
						return {
							publicKey: keypair.publicKey.toBase58(),
							secretKey: Array.from(keypair.secretKey)
						};
					}
				});
			}
			
			if (imported.length > 99) {
				imported = imported.slice(0, 99);
				alert('Only first 99 wallets imported (limit)');
			}
			
			wallets = imported;
			renderWalletList();
			updateHeaderStats();
			showNotification('Import Success', `${wallets.length} wallets loaded`);
		} catch (err) {
			alert('Error importing wallets: ' + err.message);
		}
	};
	reader.readAsText(file);
}

// Export all wallets
function exportAllWallets() {
	if (wallets.length === 0) {
		alert('No wallets to export');
		return;
	}
	
	const dataStr = JSON.stringify(wallets, null, 2);
	const blob = new Blob([dataStr], {type: 'application/json'});
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `solana-wallets-export-${Date.now()}.json`;
	a.click();
	URL.revokeObjectURL(url);
	
	showNotification('Export Complete', `${wallets.length} wallets exported`);
}

// Delete selected wallets
function deleteSelectedWallets() {
	const checkboxes = document.querySelectorAll('.wallet-checkbox:checked');
	if (checkboxes.length === 0) {
		alert('No wallets selected for deletion');
		return;
	}
	
	const confirmDelete = confirm(`Are you sure you want to delete ${checkboxes.length} selected wallet(s)?\n\nThis action cannot be undone!`);
	if (!confirmDelete) return;
	
	const selectedIndices = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index));
	wallets = wallets.filter((_, index) => !selectedIndices.includes(index));
	
	renderWalletList();
	updateHeaderStats();
	showNotification('Wallets Deleted', `${checkboxes.length} wallet(s) removed successfully`);
}

// Save all wallets (same as export)
function saveAllWallets() {
	exportAllWallets();
}

// Render wallet list (1-99)
function renderWalletList() {
	const container = document.getElementById('walletListContainer');
	
	if (wallets.length === 0) {
		container.innerHTML = `
			<div class="empty-state">
				<p>📭</p>
				<p>No wallets loaded</p>
				<p>Import or generate wallets to start</p>
			</div>
		`;
		return;
	}
	
	container.innerHTML = '';
	
	wallets.forEach((wallet, index) => {
		const item = document.createElement('div');
		item.className = 'wallet-item';
		item.id = `wallet-${index}`;
		
		const shortAddr = wallet.publicKey.substring(0, 8) + '...' + wallet.publicKey.substring(wallet.publicKey.length - 6);
		
		item.innerHTML = `
			<div class="wallet-item-header">
				<input type="checkbox" class="wallet-checkbox" data-index="${index}" onchange="updateSelectionCount()">
				<span class="wallet-number">#${index + 1}</span>
				<span class="wallet-balance" id="balance-${index}">-- SOL</span>
			</div>
			<div class="wallet-address">${shortAddr}</div>
			<div class="wallet-status" id="status-${index}">Ready</div>
		`;
		
		item.onclick = function(e) {
			if (e.target.type !== 'checkbox') {
				const checkbox = item.querySelector('.wallet-checkbox');
				checkbox.checked = !checkbox.checked;
				updateSelectionCount();
			}
		};
		
		container.appendChild(item);
	});
	
	updateSelectionCount();
}

// Select/deselect all
function selectAllWallets() {
	document.querySelectorAll('.wallet-checkbox').forEach(cb => {
		cb.checked = true;
	});
	updateSelectionCount();
}

function deselectAllWallets() {
	document.querySelectorAll('.wallet-checkbox').forEach(cb => {
		cb.checked = false;
	});
	updateSelectionCount();
}

// Select wallet range (e.g., 1-10, 11-20, etc.)
function selectWalletRange(startIndex, endIndex) {
	// First deselect all
	document.querySelectorAll('.wallet-checkbox').forEach(cb => {
		cb.checked = false;
	});
	
	// Then select the range
	document.querySelectorAll('.wallet-checkbox').forEach((cb, idx) => {
		const walletIndex = parseInt(cb.dataset.index);
		if (walletIndex >= startIndex && walletIndex <= endIndex) {
			cb.checked = true;
		}
	});
	
	updateSelectionCount();
	showNotification('Range Selected', `Wallets ${startIndex + 1}-${endIndex + 1} selected`);
}

// Update selection count
function updateSelectionCount() {
	const selected = document.querySelectorAll('.wallet-checkbox:checked').length;
	const allExecuteCountElements = document.querySelectorAll('#executeSelectedCount');
	allExecuteCountElements.forEach(el => el.textContent = selected);
	
	if (document.getElementById('selectedWalletsCount')) {
		document.getElementById('selectedWalletsCount').textContent = selected;
	}
	
	// Update total trade value
	updateTradeDisplay();
	
	// Update visual state for selected wallets
	document.querySelectorAll('.wallet-item').forEach((item, idx) => {
		const checkbox = item.querySelector('.wallet-checkbox');
		if (checkbox.checked) {
			item.classList.add('selected');
		} else {
			item.classList.remove('selected');
		}
	});
}

// Update trade display information
function updateTradeDisplay() {
	const selected = document.querySelectorAll('.wallet-checkbox:checked').length;
	const amount = parseFloat(document.getElementById('tradeAmount')?.value || 0.01);
	const slippage = parseFloat(document.getElementById('slippageBps')?.value || 1);
	const fromToken = document.getElementById('fromToken')?.value || '';
	const toToken = document.getElementById('toToken')?.value || '';
	
	// Update amount display
	if (document.getElementById('displayAmountPerWallet')) {
		document.getElementById('displayAmountPerWallet').textContent = `${amount} SOL`;
	}
	
	// Update total value
	const totalValue = (selected * amount).toFixed(3);
	const allTotalValueElements = document.querySelectorAll('#executeTotalValue');
	allTotalValueElements.forEach(el => el.textContent = `${totalValue} SOL`);
	
	// Update estimated tokens
	updateEstimatedTokens(amount, toToken);
	
	// Update slippage display
	if (document.getElementById('displaySlippage')) {
		document.getElementById('displaySlippage').textContent = `${slippage}%`;
	}
	
	// Update token displays
	if (document.getElementById('displayFromToken')) {
		if (fromToken && fromToken.length >= 32) {
			const shortAddr = fromToken.substring(0, 8) + '...' + fromToken.substring(fromToken.length - 8);
			document.getElementById('displayFromToken').textContent = shortAddr;
			document.getElementById('displayFromTokenName').textContent = getTokenName(fromToken);
		} else {
			document.getElementById('displayFromToken').textContent = 'Not set';
			document.getElementById('displayFromTokenName').textContent = '-';
		}
	}
	
	if (document.getElementById('displayToToken')) {
		if (toToken && toToken.length >= 32) {
			const shortAddr = toToken.substring(0, 8) + '...' + toToken.substring(toToken.length - 8);
			document.getElementById('displayToToken').textContent = shortAddr;
			document.getElementById('displayToTokenName').textContent = getTokenName(toToken);
		} else {
			document.getElementById('displayToToken').textContent = 'Not set';
			document.getElementById('displayToTokenName').textContent = '-';
		}
	}
}

// Estimate tokens based on SOL amount
async function updateEstimatedTokens(solAmount, tokenAddress) {
	const displayEl = document.getElementById('displayEstTokens');
	if (!displayEl) return;
	
	if (!tokenAddress || tokenAddress.length < 32 || !solAmount) {
		displayEl.textContent = '...';
		return;
	}
	
	try {
		displayEl.textContent = 'Loading...';
		
		// Try to get price from DexScreener
		const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
		const data = await response.json();
		
		if (data && data.pairs && data.pairs.length > 0) {
			const pair = data.pairs[0];
			const priceUsd = parseFloat(pair.priceUsd);
			
			if (priceUsd > 0) {
				// Assume SOL = $100 (you can make this dynamic)
				const solPriceUsd = 100;
				const usdAmount = solAmount * solPriceUsd;
				const tokensEstimated = usdAmount / priceUsd;
				
				if (tokensEstimated > 1000000) {
					displayEl.textContent = `~${(tokensEstimated / 1000000).toFixed(2)}M tokens`;
				} else if (tokensEstimated > 1000) {
					displayEl.textContent = `~${(tokensEstimated / 1000).toFixed(2)}K tokens`;
				} else {
					displayEl.textContent = `~${tokensEstimated.toFixed(2)} tokens`;
				}
				return;
			}
		}
		
		displayEl.textContent = 'Price N/A';
	} catch (error) {
		console.error('Error fetching token price:', error);
		displayEl.textContent = 'Price N/A';
	}
}

// Get token name from known addresses
function getTokenName(address) {
	const knownTokens = {
		'So11111111111111111111111111111111111111112': 'Solana (SOL)',
		'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USD Coin (USDC)',
		'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'Tether USD (USDT)'
	};
	return knownTokens[address] || 'Custom Token';
}

// Update header stats
function updateHeaderStats() {
	document.getElementById('totalWalletsCount').textContent = wallets.length;
}

// Refresh all wallet balances
async function refreshAllWalletBalances() {
	if (wallets.length === 0) {
		alert('No wallets loaded');
		return;
	}
	
	const rpcEndpoint = document.getElementById('rpcEndpoint')?.value || 'https://api.mainnet-beta.solana.com';
	const customRpc = document.getElementById('customRpc')?.value;
	const finalRpc = rpcEndpoint === 'custom' && customRpc ? customRpc : rpcEndpoint;
	const connection = new solanaWeb3.Connection(finalRpc, 'confirmed');
	
	let totalBalance = 0;
	
	for (let i = 0; i < wallets.length; i++) {
		try {
			const keypair = solanaWeb3.Keypair.fromSecretKey(new Uint8Array(wallets[i].secretKey));
			const balance = await connection.getBalance(keypair.publicKey);
			const sol = (balance / 1e9).toFixed(4);
			
			const balanceEl = document.getElementById(`balance-${i}`);
			if (balanceEl) {
				balanceEl.textContent = `${sol} SOL`;
			}
			
			totalBalance += parseFloat(sol);
		} catch (err) {
			console.error(`Error fetching balance for wallet ${i}:`, err);
		}
	}
	
	document.getElementById('totalBalanceDisplay').textContent = `${totalBalance.toFixed(4)} SOL`;
	showNotification('Balances Refreshed', `Total: ${totalBalance.toFixed(4)} SOL`);
}

// ===== TRADING FUNCTIONS =====

// Execute trade for selected wallets
async function executeTradeForSelected(isBuy) {
	const selectedCheckboxes = document.querySelectorAll('.wallet-checkbox:checked');
	
	if (selectedCheckboxes.length === 0) {
		alert('Please select at least one wallet');
		return;
	}
	
	if (!confirm(`Execute ${isBuy ? 'BUY' : 'SELL'} for ${selectedCheckboxes.length} wallets?`)) {
		return;
	}
	
	stopTrading = false;
	const statusDisplay = document.getElementById('tradeStatusDisplay');
	statusDisplay.innerHTML = `<p style="color:#fbbf24;">⏳ Starting trades for ${selectedCheckboxes.length} wallets...</p>`;
	
	// Get configuration
	const fromToken = document.getElementById('fromToken').value.trim();
	const toToken = document.getElementById('toToken').value.trim();
	const amount = parseFloat(document.getElementById('tradeAmount').value);
	const slippage = parseFloat(document.getElementById('slippageBps').value);
	const batchSize = parseInt(document.getElementById('batchSize')?.value || 5);
	const txDelay = parseInt(document.getElementById('txDelay')?.value || 1000);
	
	// Validate token addresses
	if (!fromToken || fromToken.length < 32) {
		alert('Invalid FROM token address');
		return;
	}
	
	if (!toToken || toToken.length < 32) {
		alert('Invalid TO token address');
		return;
	}
	
	// Auto-monitor the traded token if enabled
	const autoMonitor = document.getElementById('autoMonitorToken')?.checked;
	if (autoMonitor) {
		const tokenToMonitor = isBuy ? toToken : fromToken;
		document.getElementById('monitorTokenAddress').value = tokenToMonitor;
		// Start monitoring after a delay
		setTimeout(() => {
			monitoredToken = tokenToMonitor;
			startDexMonitoring();
		}, 2000);
	}
	
	// Get RPC
	const rpcEndpoint = document.getElementById('rpcEndpoint')?.value || 'https://api.mainnet-beta.solana.com';
	const customRpc = document.getElementById('customRpc')?.value;
	const finalRpc = rpcEndpoint === 'custom' && customRpc ? customRpc : rpcEndpoint;
	const connection = new solanaWeb3.Connection(finalRpc, 'confirmed');
	
	// Initialize monitor
	const monitorContainer = document.getElementById('liveMonitorGrid');
	monitorContainer.innerHTML = '';
	
	const selectedIndices = Array.from(selectedCheckboxes).map(cb => parseInt(cb.getAttribute('data-index')));
	
	// Create monitor cards
	selectedIndices.forEach(idx => {
		const card = document.createElement('div');
		card.className = 'monitor-card';
		card.id = `monitor-${idx}`;
		card.innerHTML = `
			<div class="monitor-card-header">
				<span class="monitor-wallet-num">Wallet #${idx + 1}</span>
				<span class="monitor-status pending" id="monitor-status-${idx}">Pending</span>
			</div>
			<div class="monitor-progress">
				<div class="monitor-progress-bar" id="monitor-progress-${idx}" style="width:0%"></div>
			</div>
			<div class="monitor-stats">
				<div class="monitor-stat-box">
					<div class="monitor-stat-label">${isBuy ? 'Buy' : 'Sell'} Amount</div>
					<div class="monitor-stat-value" id="monitor-amount-${idx}">0</div>
				</div>
				<div class="monitor-stat-box">
					<div class="monitor-stat-label">P&L</div>
					<div class="monitor-stat-value" id="monitor-pnl-${idx}">--</div>
				</div>
			</div>
		`;
		monitorContainer.appendChild(card);
	});
	
	// Execute trades in batches
	let successCount = 0;
	let errorCount = 0;
	
	for (let i = 0; i < selectedIndices.length; i += batchSize) {
		if (stopTrading) break;
		
		const batch = selectedIndices.slice(i, i + batchSize);
		const promises = batch.map(idx => executeSingleTrade(idx, isBuy, fromToken, toToken, amount, slippage, connection));
		
		const results = await Promise.allSettled(promises);
		
		results.forEach((result, batchIdx) => {
			if (result.status === 'fulfilled' && result.value.success) {
				successCount++;
			} else {
				errorCount++;
			}
		});
		
		// Delay between batches
		if (i + batchSize < selectedIndices.length && !stopTrading) {
			await new Promise(resolve => setTimeout(resolve, txDelay));
		}
	}
	
	statusDisplay.innerHTML = `
		<p style="color:#10b981;">✅ Completed: ${successCount} successful</p>
		<p style="color:#ef4444;">❌ Failed: ${errorCount}</p>
	`;
	
	if (document.getElementById('enableSoundAlerts')?.checked) {
		playSoundAlert();
	}
	
	showNotification('Trading Complete', `${successCount} successful, ${errorCount} failed`);
}

// Execute single trade
async function executeSingleTrade(walletIndex, isBuy, fromToken, toToken, amount, slippage, connection) {
	const statusEl = document.getElementById(`status-${walletIndex}`);
	const monitorStatusEl = document.getElementById(`monitor-status-${walletIndex}`);
	const monitorProgressEl = document.getElementById(`monitor-progress-${walletIndex}`);
	const monitorAmountEl = document.getElementById(`monitor-amount-${walletIndex}`);
	const monitorPnlEl = document.getElementById(`monitor-pnl-${walletIndex}`);
	
	try {
		// Update status
		if (statusEl) statusEl.textContent = 'Processing...';
		if (statusEl) statusEl.className = 'wallet-status trading';
		if (monitorStatusEl) {
			monitorStatusEl.textContent = 'Processing';
			monitorStatusEl.className = 'monitor-status processing';
		}
		if (monitorProgressEl) monitorProgressEl.style.width = '20%';
		
		// Get keypair
		const keypair = solanaWeb3.Keypair.fromSecretKey(new Uint8Array(wallets[walletIndex].secretKey));
		
		// Get balance before
		const balanceBefore = await connection.getBalance(keypair.publicKey);
		
		// Detect decimals
		let decimals = 9;
		if (fromToken !== 'So11111111111111111111111111111111111111112') {
			decimals = 6;
		}
		
		const amountRaw = Math.floor(amount * Math.pow(10, decimals));
		
		if (monitorProgressEl) monitorProgressEl.style.width = '40%';
		
		// Get Jupiter quote
		const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${fromToken}&outputMint=${toToken}&amount=${amountRaw}&slippageBps=${Math.floor(slippage * 100)}&swapMode=ExactIn`;
		const quoteRes = await fetch(quoteUrl);
		const quote = await quoteRes.json();
		
		if (!quote || quote.error) {
			throw new Error(quote.error || 'No route found');
		}
		
		if (monitorProgressEl) monitorProgressEl.style.width = '60%';
		
		// Get swap transaction
		const swapRes = await fetch('https://quote-api.jup.ag/v6/swap', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({
				quoteResponse: quote,
				userPublicKey: keypair.publicKey.toBase58(),
				wrapAndUnwrapSol: true
			})
		});
		
		const swapData = await swapRes.json();
		
		if (!swapData.swapTransaction) {
			throw new Error('Failed to get swap transaction');
		}
		
		if (monitorProgressEl) monitorProgressEl.style.width = '80%';
		
		// Deserialize and sign
		const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
		const transaction = solanaWeb3.VersionedTransaction.deserialize(swapTransactionBuf);
		transaction.sign([keypair]);
		
		// Send transaction
		const rawTransaction = transaction.serialize();
		const txid = await connection.sendRawTransaction(rawTransaction, {
			skipPreflight: true,
			maxRetries: 3
		});
		
		// Wait for confirmation
		await connection.confirmTransaction(txid, 'confirmed');
		
		// Get balance after
		const balanceAfter = await connection.getBalance(keypair.publicKey);
		
		// Calculate P&L
		const profit = (balanceAfter - balanceBefore) / 1e9;
		const profitPct = balanceBefore > 0 ? ((profit / (balanceBefore / 1e9)) * 100) : 0;
		
		// Update display
		if (monitorProgressEl) monitorProgressEl.style.width = '100%';
		if (monitorAmountEl) monitorAmountEl.textContent = `${amount.toFixed(4)}`;
		if (monitorPnlEl) {
			monitorPnlEl.textContent = `${profit >= 0 ? '+' : ''}${profit.toFixed(4)} (${profitPct.toFixed(2)}%)`;
			monitorPnlEl.className = profit >= 0 ? 'monitor-stat-value positive' : 'monitor-stat-value negative';
		}
		
		if (statusEl) {
			statusEl.innerHTML = `<a href="https://explorer.solana.com/tx/${txid}" target="_blank" style="color:#10b981;">Success ✓</a>`;
			statusEl.className = 'wallet-status success';
		}
		
		if (monitorStatusEl) {
			monitorStatusEl.textContent = 'Success';
			monitorStatusEl.className = 'monitor-status success';
		}
		
		return {success: true, txid};
	} catch (err) {
		console.error(`Wallet ${walletIndex} error:`, err);
		
		if (statusEl) {
			statusEl.textContent = `Error: ${err.message}`;
			statusEl.className = 'wallet-status error';
		}
		
		if (monitorStatusEl) {
			monitorStatusEl.textContent = 'Error';
			monitorStatusEl.className = 'monitor-status error';
		}
		
		if (monitorPnlEl) {
			monitorPnlEl.textContent = 'Failed';
			monitorPnlEl.className = 'monitor-stat-value negative';
		}
		
		return {success: false, error: err.message};
	}
}

// Stop all trades
function stopAllTrades() {
	stopTrading = true;
	const statusDisplay = document.getElementById('tradeStatusDisplay');
	statusDisplay.innerHTML = `<p style="color:#f59e0b;">⛔ Stopping all trades...</p>`;
}

// ===== DEX SCREEN / CHART =====

// Start DEX monitoring with real DexScreener API
async function startDexMonitoring() {
	let tokenAddress = document.getElementById('monitorTokenAddress')?.value.trim();
	
	// If no manual input, check if there's a monitored token from trading
	if (!tokenAddress && monitoredToken) {
		tokenAddress = monitoredToken;
	}
	
	if (!tokenAddress) {
		alert('Please enter a token address or execute a trade with auto-monitor enabled');
		return;
	}
	
	// Validate Solana address format
	if (tokenAddress.length < 32 || tokenAddress.length > 44) {
		alert('Invalid Solana token address');
		return;
	}
	
	monitoredToken = tokenAddress;
	document.getElementById('monitorTokenAddress').value = tokenAddress;
	
	// Clear previous interval
	if (dexUpdateInterval) {
		clearInterval(dexUpdateInterval);
	}
	
	// Show token info section
	const tokenInfo = document.getElementById('tokenInfo');
	if (tokenInfo) {
		tokenInfo.style.display = 'block';
	}
	
	// Initial fetch
	await updateDexStats();
	
	// Update every 10 seconds
	dexUpdateInterval = setInterval(updateDexStats, 10000);
	
	showNotification('DEX Monitor Started', `Tracking ${tokenAddress.substring(0, 8)}...`);
}

// Update DEX stats with real DexScreener API
async function updateDexStats() {
	if (!monitoredToken) return;
	
	try {
		// Fetch from DexScreener API
		const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${monitoredToken}`);
		const data = await response.json();
		
		if (!data.pairs || data.pairs.length === 0) {
			throw new Error('No trading pairs found');
		}
		
		// Get the pair with highest liquidity
		const pair = data.pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
		
		// Update token info
		const tokenName = pair.baseToken?.name || 'Unknown';
		const tokenSymbol = pair.baseToken?.symbol || '---';
		
		document.getElementById('tokenName').textContent = tokenName;
		document.getElementById('tokenSymbol').textContent = tokenSymbol;
		
		// Update page title
		document.title = `${tokenSymbol} - Solana Pro Trading Suite`;
		
		// Show notification on first update
		if (!document.getElementById('tokenInfo').style.display || document.getElementById('tokenInfo').style.display === 'none') {
			showNotification(`Monitoring ${tokenSymbol}`, `${tokenName} - Real-time updates active`);
		}
		
		// Update price
		const price = parseFloat(pair.priceUsd || 0);
		const priceEl = document.getElementById('dexCurrentPrice');
		if (priceEl) {
			priceEl.textContent = `$${price.toFixed(price < 0.01 ? 8 : price < 1 ? 4 : 2)}`;
		}
		
		// Update 5m change
		const change5m = parseFloat(pair.priceChange?.m5 || 0);
		const change5mEl = document.getElementById('priceChange5m');
		if (change5mEl) {
			const sign = change5m >= 0 ? '+' : '';
			change5mEl.textContent = `5m: ${sign}${change5m.toFixed(2)}%`;
			change5mEl.className = change5m >= 0 ? 'stat-change positive' : 'stat-change negative';
		}
		
		// Update 24h change
		const change24h = parseFloat(pair.priceChange?.h24 || 0);
		const change24hEl = document.getElementById('dex24hChange');
		if (change24hEl) {
			const sign = change24h >= 0 ? '+' : '';
			change24hEl.textContent = `${sign}${change24h.toFixed(2)}%`;
			change24hEl.style.color = change24h >= 0 ? '#10b981' : '#ef4444';
		}
		
		// Update high 24h
		const priceHigh = parseFloat(pair.priceChange?.h24High || 0);
		const priceHighEl = document.getElementById('priceHigh24h');
		if (priceHighEl) {
			priceHighEl.textContent = `High: $${priceHigh.toFixed(priceHigh < 0.01 ? 8 : priceHigh < 1 ? 4 : 2)}`;
		}
		
		// Update volume
		const volume24h = parseFloat(pair.volume?.h24 || 0);
		const volumeEl = document.getElementById('dexVolume24h');
		if (volumeEl) {
			volumeEl.textContent = `$${formatNumber(volume24h)}`;
		}
		
		// Update txns
		const txns24h = (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0);
		const txnsEl = document.getElementById('volumeChange');
		if (txnsEl) {
			txnsEl.textContent = `Txns: ${formatNumber(txns24h)}`;
		}
		
		// Update liquidity
		const liquidity = parseFloat(pair.liquidity?.usd || 0);
		const liquidityEl = document.getElementById('dexLiquidity');
		if (liquidityEl) {
			liquidityEl.textContent = `$${formatNumber(liquidity)}`;
		}
		
		// Update FDV
		const fdv = parseFloat(pair.fdv || 0);
		const fdvEl = document.getElementById('fdv');
		if (fdvEl) {
			fdvEl.textContent = `FDV: $${formatNumber(fdv)}`;
		}
		
		// Update market cap
		const marketCap = parseFloat(pair.marketCap || 0);
		const mcapEl = document.getElementById('dexMarketCap');
		if (mcapEl) {
			mcapEl.textContent = `$${formatNumber(marketCap)}`;
		}
		
		// Update buy/sell ratio
		const buys = pair.txns?.h24?.buys || 0;
		const sells = pair.txns?.h24?.sells || 0;
		const ratioEl = document.getElementById('buySellRatio');
		if (ratioEl) {
			const ratio = sells > 0 ? (buys / sells).toFixed(2) : '--';
			ratioEl.textContent = `${ratio}x`;
			ratioEl.style.color = buys > sells ? '#10b981' : '#ef4444';
		}
		
		const buySellCountEl = document.getElementById('buySellCount');
		if (buySellCountEl) {
			buySellCountEl.textContent = `24h: ${buys}B / ${sells}S`;
		}
		
		// Update chart
		updatePriceChart(price);
		
		// Update last update time
		const now = new Date();
		const timeStr = now.toLocaleTimeString();
		const lastUpdateEl = document.getElementById('lastUpdate');
		if (lastUpdateEl) {
			lastUpdateEl.textContent = `Updated: ${timeStr}`;
		}
		
		// Fetch recent transactions
		await updateRecentTrades(pair);
		
	} catch (err) {
		console.error('DEX update error:', err);
		document.getElementById('dexCurrentPrice').textContent = 'Error';
		document.getElementById('dexCurrentPrice').style.color = '#ef4444';
	}
}

// Update recent trades feed
async function updateRecentTrades(pair) {
	const feedEl = document.getElementById('recentTradesFeed');
	if (!feedEl) return;
	
	try {
		// DexScreener doesn't provide individual trades, so we'll show transaction stats
		const buys5m = pair.txns?.m5?.buys || 0;
		const sells5m = pair.txns?.m5?.sells || 0;
		const buys1h = pair.txns?.h1?.buys || 0;
		const sells1h = pair.txns?.h1?.sells || 0;
		const buys24h = pair.txns?.h24?.buys || 0;
		const sells24h = pair.txns?.h24?.sells || 0;
		
		feedEl.innerHTML = `
			<div class="trade-item buy">
				<div class="trade-header">
					<span class="trade-type buy">BUYS - 5min</span>
					<span class="trade-time">Recent</span>
				</div>
				<div class="trade-details">
					<span class="trade-amount">${buys5m} transactions</span>
				</div>
			</div>
			<div class="trade-item sell">
				<div class="trade-header">
					<span class="trade-type sell">SELLS - 5min</span>
					<span class="trade-time">Recent</span>
				</div>
				<div class="trade-details">
					<span class="trade-amount">${sells5m} transactions</span>
				</div>
			</div>
			<div class="trade-item buy">
				<div class="trade-header">
					<span class="trade-type buy">BUYS - 1hour</span>
					<span class="trade-time">1h ago</span>
				</div>
				<div class="trade-details">
					<span class="trade-amount">${buys1h} transactions</span>
				</div>
			</div>
			<div class="trade-item sell">
				<div class="trade-header">
					<span class="trade-type sell">SELLS - 1hour</span>
					<span class="trade-time">1h ago</span>
				</div>
				<div class="trade-details">
					<span class="trade-amount">${sells1h} transactions</span>
				</div>
			</div>
			<div class="trade-item buy">
				<div class="trade-header">
					<span class="trade-type buy">BUYS - 24h</span>
					<span class="trade-time">24h</span>
				</div>
				<div class="trade-details">
					<span class="trade-amount">${buys24h} transactions</span>
				</div>
			</div>
			<div class="trade-item sell">
				<div class="trade-header">
					<span class="trade-type sell">SELLS - 24h</span>
					<span class="trade-time">24h</span>
				</div>
				<div class="trade-details">
					<span class="trade-amount">${sells24h} transactions</span>
				</div>
			</div>
		`;
	} catch (err) {
		console.error('Trades update error:', err);
	}
}

// Update price chart
function updatePriceChart(newPrice) {
	if (!priceChart) return;
	
	const now = new Date();
	const timeLabel = now.toLocaleTimeString();
	
	// Add new data point
	chartData.labels.push(timeLabel);
	chartData.prices.push(newPrice);
	
	// Keep only last 50 points
	if (chartData.labels.length > 50) {
		chartData.labels.shift();
		chartData.prices.shift();
	}
	
	// Update chart
	priceChart.data.labels = chartData.labels;
	priceChart.data.datasets[0].data = chartData.prices;
	priceChart.update('none'); // Update without animation for smoother updates
}

// Change timeframe (for future implementation with historical data)
function changeTimeframe(timeframe) {
	currentTimeframe = timeframe;
	
	// Update active button
	document.querySelectorAll('.chart-btn').forEach(btn => {
		btn.classList.remove('active');
	});
	event.target.classList.add('active');
	
	// Reset chart data
	chartData = {labels: [], prices: []};
	if (priceChart) {
		priceChart.data.labels = [];
		priceChart.data.datasets[0].data = [];
		priceChart.update();
	}
	
	showNotification('Timeframe Changed', `Now showing ${timeframe} data`);
}

// Format large numbers
function formatNumber(num) {
	if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
	if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
	if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
	return num.toFixed(2);
}

function initPriceChart() {
	const ctx = document.getElementById('priceChart');
	if (!ctx) return;
	
	priceChart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: [],
			datasets: [{
				label: 'Price (USD)',
				data: [],
				borderColor: 'rgba(14, 165, 233, 1)',
				backgroundColor: 'rgba(14, 165, 233, 0.1)',
				borderWidth: 2,
				tension: 0.4,
				fill: true,
				pointRadius: 0,
				pointHoverRadius: 6,
				pointHoverBackgroundColor: 'rgba(14, 165, 233, 1)',
				pointHoverBorderColor: '#fff',
				pointHoverBorderWidth: 2
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			interaction: {
				intersect: false,
				mode: 'index'
			},
			plugins: {
				legend: {
					display: false
				},
				tooltip: {
					backgroundColor: 'rgba(0, 0, 0, 0.8)',
					borderColor: 'rgba(14, 165, 233, 0.5)',
					borderWidth: 1,
					padding: 10,
					displayColors: false,
					callbacks: {
						label: function(context) {
							return '$' + context.parsed.y.toFixed(8);
						}
					}
				}
			},
			scales: {
				x: {
					display: true,
					grid: {
						color: 'rgba(255,255,255,0.03)',
						drawBorder: false
					},
					ticks: {
						color: '#6b7280',
						font: {
							size: 10
						},
						maxTicksLimit: 8
					}
				},
				y: {
					display: true,
					grid: {
						color: 'rgba(255,255,255,0.03)',
						drawBorder: false
					},
					ticks: {
						color: '#6b7280',
						font: {
							size: 10
						},
						callback: function(value) {
							return '$' + value.toFixed(value < 0.01 ? 8 : 4);
						}
					}
				}
			},
			animation: {
				duration: 750,
				easing: 'easeInOutQuart'
			}
		}
	});
}
// ===== UTILITY FUNCTIONS =====

function playSoundAlert() {
	try {
		const audioContext = new (window.AudioContext || window.webkitAudioContext)();
		const oscillator = audioContext.createOscillator();
		const gainNode = audioContext.createGain();
		
		oscillator.connect(gainNode);
		gainNode.connect(audioContext.destination);
		
		oscillator.frequency.value = 800;
		oscillator.type = 'sine';
		
		gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
		gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
		
		oscillator.start(audioContext.currentTime);
		oscillator.stop(audioContext.currentTime + 0.5);
	} catch (err) {
		console.error('Sound alert error:', err);
	}
}

function showNotification(title, message) {
	if (document.getElementById('enableNotifications')?.checked) {
		if ('Notification' in window && Notification.permission === 'granted') {
			new Notification(title, {body: message});
		} else if ('Notification' in window && Notification.permission !== 'denied') {
			Notification.requestPermission().then(permission => {
				if (permission === 'granted') {
					new Notification(title, {body: message});
				}
			});
		}
	}
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', () => {
	// Request notification permission
	if ('Notification' in window && Notification.permission === 'default') {
		Notification.requestPermission();
	}
	
	// Initialize chart
	initPriceChart();
	
	// Add event listeners for live display updates
	const tradeAmountInput = document.getElementById('tradeAmount');
	const slippageInput = document.getElementById('slippageBps');
	const fromTokenInput = document.getElementById('fromToken');
	const toTokenInput = document.getElementById('toToken');
	const quickBuyToken = document.getElementById('quickBuyToken');
	const quickBuyAmount = document.getElementById('quickBuyAmount');
	
	if (tradeAmountInput) {
		tradeAmountInput.addEventListener('input', updateTradeDisplay);
	}
	if (slippageInput) {
		slippageInput.addEventListener('input', updateTradeDisplay);
	}
	if (fromTokenInput) {
		fromTokenInput.addEventListener('input', updateTradeDisplay);
	}
	if (toTokenInput) {
		toTokenInput.addEventListener('input', updateTradeDisplay);
	}
	
	// Quick buy token sync
	if (quickBuyToken) {
		quickBuyToken.addEventListener('input', (e) => {
			const tokenAddr = e.target.value;
			// Auto-set to "To Token" and "From Token" to SOL
			if (document.getElementById('toToken')) {
				document.getElementById('toToken').value = tokenAddr;
			}
			if (document.getElementById('fromToken')) {
				document.getElementById('fromToken').value = 'So11111111111111111111111111111111111111112';
			}
			updateTradeDisplay();
		});
	}
	
	if (quickBuyAmount) {
		quickBuyAmount.addEventListener('input', (e) => {
			const amount = e.target.value;
			// Auto-set trade amount
			if (document.getElementById('tradeAmount')) {
				document.getElementById('tradeAmount').value = amount;
			}
			updateTradeDisplay();
		});
	}
	
	// Initial display update
	updateTradeDisplay();
	
	console.log('✅ Solana Pro Trading Suite initialized');
	console.log('💡 Enter a token address to start DEX monitoring');
});
