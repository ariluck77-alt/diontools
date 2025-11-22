// Solana Web3.js Connection
const connection = new solanaWeb3.Connection('https://api.mainnet-beta.solana.com');
let walletConnected = false;
let phantomWallet = null;

// Navigation System
document.querySelectorAll('.nav-item').forEach(item => {
	item.addEventListener('click', (e) => {
		e.preventDefault();
		
		// Remove active class from all nav items
		document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
		
		// Add active class to clicked item
		item.classList.add('active');
		
		// Hide all pages
		document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
		
		// Show selected page
		const pageName = item.getAttribute('data-page');
		document.getElementById(`${pageName}-page`).classList.add('active');
	});
});

// Wallet Connection
document.getElementById('connectWallet').addEventListener('click', async () => {
	try {
		if (window.solana && window.solana.isPhantom) {
			const response = await window.solana.connect();
			phantomWallet = response.publicKey;
			walletConnected = true;
			
			document.getElementById('connectWallet').textContent = 
				`${phantomWallet.toString().slice(0, 4)}...${phantomWallet.toString().slice(-4)}`;
			document.getElementById('connectWallet').style.background = '#1a1a1a';
			document.getElementById('connectWallet').style.color = '#00ff88';
			
			console.log('✅ Wallet connected:', phantomWallet.toString());
			showNotification('Wallet connected successfully!', 'success');
		} else {
			alert('🦊 Please install Phantom Wallet!');
			window.open('https://phantom.app/', '_blank');
		}
	} catch (error) {
		console.error('Wallet connection error:', error);
		showNotification('Failed to connect wallet', 'error');
	}
});

// Launch Token Function
document.querySelector('.btn-launch').addEventListener('click', async () => {
	if (!walletConnected) {
		showNotification('Please connect wallet first!', 'error');
		return;
	}
	
	// Get form values
	const tokenName = document.querySelector('input[placeholder="Enter token name..."]').value;
	const tokenSymbol = document.querySelector('input[placeholder="e.g., DION"]').value;
	const description = document.querySelector('textarea').value;
	const initialBuy = document.querySelector('input[placeholder="0.1"]').value;
	const buyAmount = document.querySelector('input[placeholder="0.01"]').value;
	const numWallets = document.querySelector('input[placeholder="10"]').value;
	
	if (!tokenName || !tokenSymbol) {
		showNotification('Please fill in token name and symbol!', 'error');
		return;
	}
	
	showNotification('🚀 Launching token...', 'info');
	
	// Simulate token launch
	setTimeout(() => {
		showNotification('✅ Token launched successfully!', 'success');
		updateHoldersTable(numWallets);
	}, 2000);
});

// Update Holders Table
function updateHoldersTable(numWallets) {
	const tbody = document.getElementById('holdersTableBody');
	tbody.innerHTML = '';
	
	for (let i = 0; i < (numWallets || 9); i++) {
		const randomAddress = generateRandomAddress();
		const randomBalance = (Math.random() * 0.1).toFixed(3);
		
		const row = document.createElement('tr');
		row.innerHTML = `
			<td>${i + 1}</td>
			<td>
				${i === 0 ? '<span class="badge badge-dev">DEV</span>' : ''}
				<span class="address">${randomAddress}</span>
			</td>
			<td>0</td>
			<td>${randomBalance}%</td>
			<td>
				<button class="btn-amount" onclick="quickBuy('${randomAddress}', 0.001)">0.001</button>
				<button class="btn-amount" onclick="quickBuy('${randomAddress}', 0.01)">0.01</button>
				<button class="btn-copy" onclick="copyAddress('${randomAddress}')">📋</button>
				<button class="btn-refresh" onclick="refreshHolder(${i})">🔄</button>
			</td>
		`;
		tbody.appendChild(row);
	}
}

// Generate Random Solana Address
function generateRandomAddress() {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';
	let address = '';
	for (let i = 0; i < 7; i++) {
		address += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return address + '...' + chars.charAt(Math.floor(Math.random() * chars.length)).repeat(8);
}

// Quick Buy Function
function quickBuy(address, amount) {
	if (!walletConnected) {
		showNotification('Please connect wallet first!', 'error');
		return;
	}
	
	showNotification(`🎯 Buying ${amount} SOL for ${address.slice(0, 10)}...`, 'info');
	
	setTimeout(() => {
		showNotification(`✅ Token sniped successfully!`, 'success');
	}, 1500);
}

// Copy Address Function
function copyAddress(address) {
	navigator.clipboard.writeText(address);
	showNotification('Address copied to clipboard!', 'success');
}

// Refresh Holder Function
function refreshHolder(index) {
	showNotification(`🔄 Refreshing holder ${index + 1}...`, 'info');
}

// Notification System
function showNotification(message, type) {
	const notification = document.createElement('div');
	notification.className = `notification ${type}`;
	notification.innerHTML = `
		<span>${getIcon(type)}</span>
		<span>${message}</span>
	`;
	
	Object.assign(notification.style, {
		position: 'fixed',
		top: '20px',
		right: '20px',
		background: type === 'success' ? 'rgba(0, 255, 136, 0.1)' : 
		            type === 'error' ? 'rgba(255, 68, 68, 0.1)' : 
		            'rgba(0, 136, 255, 0.1)',
		border: type === 'success' ? '1px solid rgba(0, 255, 136, 0.3)' : 
		        type === 'error' ? '1px solid rgba(255, 68, 68, 0.3)' : 
		        '1px solid rgba(0, 136, 255, 0.3)',
		color: type === 'success' ? '#00ff88' : 
		       type === 'error' ? '#ff4444' : 
		       '#0088ff',
		padding: '12px 20px',
		borderRadius: '8px',
		fontSize: '13px',
		display: 'flex',
		alignItems: 'center',
		gap: '10px',
		zIndex: '10000',
		animation: 'slideIn 0.3s ease',
		boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
	});
	
	document.body.appendChild(notification);
	
	setTimeout(() => {
		notification.style.animation = 'slideOut 0.3s ease';
		setTimeout(() => notification.remove(), 300);
	}, 3000);
}

function getIcon(type) {
	return type === 'success' ? '✅' : 
	       type === 'error' ? '❌' : 
	       'ℹ️';
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
	@keyframes slideIn {
		from {
			transform: translateX(400px);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}
	
	@keyframes slideOut {
		from {
			transform: translateX(0);
			opacity: 1;
		}
		to {
			transform: translateX(400px);
			opacity: 0;
		}
	}
`;
document.head.appendChild(style);

// Initialize on load
window.addEventListener('load', () => {
	console.log('🚀 RUGTOOL initialized');
	
	// Auto-detect Phantom wallet
	if (window.solana && window.solana.isPhantom) {
		console.log('✅ Phantom wallet detected');
	}
});

// Real-time updates simulation
setInterval(() => {
	// Update market cap
	const marketCapElement = document.querySelector('.stat-value');
	if (marketCapElement && marketCapElement.textContent.includes('$')) {
		const currentValue = parseFloat(marketCapElement.textContent.replace('$', '').replace(',', ''));
		const newValue = currentValue + (Math.random() * 100 - 50);
		if (newValue > 0) {
			marketCapElement.textContent = '$' + newValue.toFixed(2);
		}
	}
	
	// Update bonding curve
	const bondingElements = document.querySelectorAll('.stat-value');
	if (bondingElements[1] && bondingElements[1].textContent.includes('%')) {
		const currentPercent = parseFloat(bondingElements[1].textContent.replace('%', ''));
		const newPercent = Math.min(100, currentPercent + (Math.random() * 2));
		bondingElements[1].textContent = newPercent.toFixed(1) + '%';
	}
}, 5000);

console.log('💚 RUGTOOL App loaded successfully!');
