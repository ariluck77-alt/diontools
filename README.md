# 🚀 DIONTOOLS - Advanced Solana Trading Platform

**Live Site:** https://ariluck77-alt.github.io/diontools/

**Domain:** WWW.DIONTOOLS.COM

---

## 🎯 Overview

DIONTOOLS is an ultra-advanced, professional-grade Solana trading platform with complete automation suite. Inspired by RugSol AI, it features multi-wallet management, automated trading bots, real-time monitoring, and MEV protection.

---

## ✨ Core Features

### 💼 Multi-Wallet Management
- **1-99 Wallets**: Create and manage up to 99 trading wallets simultaneously
- **Master Wallet**: Central control for SOL distribution and collection
- **Batch Operations**: Execute trades across all selected wallets instantly
- **Phantom Integration**: Seamless connection with Phantom wallet

### 📊 Real-Time Market Data
- **DexScreener Integration**: Live price, volume, and liquidity data
- **Jupiter Aggregator V6**: Best price discovery across all DEXs
- **Interactive Charts**: Chart.js powered price visualization
- **Multi-Token Monitoring**: Track multiple tokens simultaneously

---

## 🤖 Advanced Bot Systems

### 🎯 1. Token Sniping Bot
**Auto-buy new tokens as they launch on Raydium/Pump.fun**

**Features:**
- ✅ Raydium new pool monitoring
- ✅ Pump.fun new token scanning
- ✅ Configurable filters:
  - Min liquidity requirement ($)
  - Min holders requirement
  - Max buy tax (%)
- ✅ Auto-sell at profit target (%)
- ✅ Stop-loss protection (%)
- ✅ Real-time activity log
- ✅ Snipe counter tracker

**How to Use:**
1. Select snipe mode (Raydium/Pump.fun/Both)
2. Enter snipe amount in SOL
3. Set minimum liquidity and holders
4. Configure max buy tax
5. Enable auto-sell with profit target
6. Click START SNIPING

---

### 👥 2. Copy Trading Bot
**Mirror trades from successful wallets automatically**

**Features:**
- ✅ Monitor any Solana wallet address
- ✅ Analyze all transactions in real-time
- ✅ Copy buys only / sells only options
- ✅ Configurable trade amount
- ✅ Custom slippage settings
- ✅ Delay execution (0-60 seconds)
- ✅ Real-time copy log
- ✅ Trade counter

**How to Use:**
1. Enter target wallet address
2. Set copy amount per trade
3. Configure slippage tolerance
4. Choose buy/sell only options
5. Set delay if needed
6. Click START COPY TRADING

---

### 🔔 3. Price Alerts & Auto-Sell
**Set price targets and automate sell/buy actions**

**Features:**
- ✅ High/Low price alerts for any token
- ✅ Browser notifications (with permission)
- ✅ Auto-sell when HIGH target reached
- ✅ Auto-buy when LOW target reached
- ✅ Multiple alerts per token
- ✅ 5-second price monitoring
- ✅ Alert history tracker

**How to Use:**
1. Enter token address to monitor
2. Set high alert price ($)
3. Set low alert price ($)
4. Enable auto-sell/auto-buy options
5. Enable browser notifications
6. Click ADD ALERT

---

### 📊 4. Volume Spike Detection
**Detect and auto-trade on volume explosions**

**Features:**
- ✅ Real-time 24h volume monitoring
- ✅ Configurable spike threshold (50-1000%)
- ✅ Auto-buy on spike detection
- ✅ Browser notifications
- ✅ Custom check intervals (5-60 sec)
- ✅ Volume change tracking
- ✅ Spike counter

**How to Use:**
1. Enter token address to monitor
2. Set spike threshold percentage
3. Configure check interval
4. Enable auto-buy on spike
5. Enable alert notifications
6. Click START MONITORING

---

### ⚙️ 5. Auto-Trading Rules Engine
**Create custom trading rules with conditions**

**Features:**
- ✅ Multiple rule types:
  - Price Above/Below
  - Price Change %
  - Volume Above
  - Specific Time
- ✅ Buy/Sell actions
- ✅ Custom amount per rule
- ✅ One-time or repeatable execution
- ✅ Rule history and status
- ✅ 5-second condition checks
- ✅ Automatic rule execution

**How to Use:**
1. Enter rule name
2. Enter token address
3. Choose action (BUY/SELL)
4. Set trade amount
5. Select condition type
6. Enter condition value
7. Choose one-time or repeatable
8. Click ADD RULE

**Example Rules:**
- "Buy dip at -10%" → Buy when price drops 10%
- "Sell at $0.01" → Sell when price reaches $0.01
- "Buy volume spike" → Buy when volume exceeds threshold
- "Sell at 9:30 AM" → Sell at specific time

---

### 🔍 6. New Token Scanner
**Discover and snipe new tokens instantly**

**Features:**
- ✅ Real-time token discovery
- ✅ Raydium & Pump.fun scanning
- ✅ Configurable filters:
  - Minimum liquidity
  - Minimum holders
- ✅ Custom scan intervals (5-60 sec)
- ✅ Auto-snipe qualified tokens
- ✅ Detailed token cards:
  - Price & 24h change
  - Liquidity & volume
  - Buys/sells ratio
  - DEX information
- ✅ Quick-snipe button per token
- ✅ Token counter

**How to Use:**
1. Select scanner source (Raydium/Pump.fun/Both)
2. Set minimum liquidity filter
3. Set minimum holders filter
4. Configure scan interval
5. Enable auto-snipe (optional)
6. Click START SCANNER
7. Click ⚡ SNIPE on any discovered token

---

### 🛡️ 7. Jito MEV Protection
**Protect trades from MEV bots and front-running**

**Features:**
- ✅ Jito bundle integration
- ✅ 5 global Jito endpoints
- ✅ Automatic failover to standard submission
- ✅ One-click enable/disable
- ✅ Works with all trade functions

**How to Use:**
1. Check "MEV Protection (Jito Bundle)" in Trade Settings
2. All trades will be wrapped in MEV-protected bundles
3. Automatic endpoint selection
4. Fallback to standard if Jito unavailable

**Jito Endpoints:**
- https://mainnet.block-engine.jito.wtf
- https://amsterdam.mainnet.block-engine.jito.wtf
- https://frankfurt.mainnet.block-engine.jito.wtf
- https://ny.mainnet.block-engine.jito.wtf
- https://tokyo.mainnet.block-engine.jito.wtf

---

## 🎨 Premium Red-Black Theme

- Ultra-modern dark design
- Red glowing accents and borders
- Gradient overlays
- Smooth animations
- Compact layout for maximum information density
- Professional trading terminal aesthetic

---

## 🔧 Technical Stack

- **Frontend**: Pure HTML5, CSS3, JavaScript ES6+
- **Blockchain**: Solana Web3.js v1.95.2
- **DEX Integration**: Jupiter Aggregator V6
- **Market Data**: DexScreener API
- **Charts**: Chart.js v4.4.0
- **MEV Protection**: Jito Bundle API
- **Wallet**: Phantom Wallet Integration
- **Deployment**: GitHub Pages
- **Version Control**: Git/GitHub

---

## 🚀 Quick Start Guide

### 1. Connect Wallet
- Click "CONNECT PHANTOM WALLET"
- Approve connection in Phantom
- Your wallet appears as Master Wallet

### 2. Create Trading Wallets
- Set number of wallets (1-99)
- Click "CREATE WALLETS"
- Wait for wallet generation
- Fund wallets via "DISTRIBUTE SOL"

### 3. Configure Trading
- Enter token address
- Set trade amount
- Configure slippage
- Enable MEV Protection
- Select wallets to trade with

### 4. Activate Bots
- **Token Sniping**: Set filters → START SNIPING
- **Copy Trading**: Enter target wallet → START
- **Price Alerts**: Set targets → ADD ALERT
- **Volume Monitor**: Set threshold → START
- **Rules Engine**: Create rules → ADD RULE
- **Token Scanner**: Configure filters → START

### 5. Execute Trades
- Click "EXECUTE ALL TRADES"
- Monitor real-time logs
- Check transaction statuses
- Track profits/losses

---

## 📊 Trading Strategies

### Strategy 1: Snipe & Flip
1. Enable Token Sniping Bot
2. Set min liquidity: $10,000+
3. Set min holders: 50+
4. Enable auto-sell at 100% profit
5. Let bot find and trade new tokens

### Strategy 2: Copy Whale
1. Find successful Solana wallet
2. Enable Copy Trading Bot
3. Set copy amount (e.g., 0.1 SOL)
4. Enable "Copy buys only"
5. Set 5-second delay to avoid front-running

### Strategy 3: Volume Scalp
1. Find trending token
2. Enable Volume Spike Detection
3. Set threshold: 200% spike
4. Enable auto-buy
5. Set price alert for 50% profit target

### Strategy 4: Rule-Based DCA
1. Create multiple buy rules
2. "Buy at $0.001"
3. "Buy at $0.0005"
4. "Buy at $0.0001"
5. Accumulate on dips automatically

### Strategy 5: Scanner Snipe
1. Enable New Token Scanner
2. Set high liquidity filter ($20k+)
3. Set high holder filter (100+)
4. Enable auto-snipe
5. Let scanner find gems automatically

---

## ⚠️ Risk Warnings

- **High Risk**: Crypto trading involves substantial risk of loss
- **DYOR**: Always research tokens before trading
- **Start Small**: Test with small amounts first
- **Scam Tokens**: Many new tokens are scams/rugs
- **MEV Risk**: Use Jito MEV Protection for larger trades
- **Slippage**: High slippage can result in bad fills
- **Bot Filters**: Filters don't guarantee safe tokens
- **No Financial Advice**: This tool is for educational purposes

---

## 🔐 Security

- ✅ No private keys stored
- ✅ Client-side wallet generation
- ✅ Phantom wallet integration
- ✅ MEV protection available
- ✅ All code open-source on GitHub
- ✅ No backend servers
- ✅ Direct blockchain interaction

---

## 📞 Support & Links

- **Live Site**: https://ariluck77-alt.github.io/diontools/
- **Domain**: WWW.DIONTOOLS.COM
- **GitHub**: https://github.com/ariluck77-alt/diontools
- **Built**: November 2025

---

## 🎯 Feature Comparison

| Feature | DIONTOOLS | RugSol AI |
|---------|-----------|-----------|
| Token Sniping | ✅ | ✅ |
| Copy Trading | ✅ | ✅ |
| Price Alerts | ✅ | ✅ |
| Volume Detection | ✅ | ✅ |
| MEV Protection | ✅ | ✅ |
| Rules Engine | ✅ | ✅ |
| Token Scanner | ✅ | ✅ |
| Multi-Wallet (99) | ✅ | ❌ |
| Free & Open Source | ✅ | ❌ |
| GitHub Pages Hosted | ✅ | ❌ |
| No Registration | ✅ | ❌ |
| Premium Theme | ✅ Red/Black | - |

---

## 🛠️ Development

### Local Setup
```bash
# Clone repository
git clone https://github.com/ariluck77-alt/diontools.git

# Navigate to directory
cd diontools

# Open in browser
# Simply open index.html in your browser
```

### File Structure
```
diontools/
├── index.html              # Main application
├── app.js                  # Trading logic & bots
├── style.css               # Base styles
├── compact.css             # Layout optimization
├── red-black-theme.css     # Premium theme
├── robots.txt              # SEO configuration
├── sitemap.xml             # Site map
└── README.md               # This file
```

---

## 📈 Roadmap

### Completed ✅
- Multi-wallet system (1-99 wallets)
- Master wallet distribution
- Jupiter V6 integration
- DexScreener API integration
- Token Sniping Bot
- Copy Trading Bot
- Price Alerts System
- Volume Spike Detection
- Auto-Trading Rules Engine
- New Token Scanner
- Jito MEV Protection
- Red-Black Premium Theme
- GitHub Pages Deployment
- Google Search Console SEO

### Future Enhancements 🔮
- Telegram notifications
- Discord bot integration
- Portfolio analytics dashboard
- Advanced charting tools
- Historical trade logs
- Profit/loss calculator
- Tax report generator
- Mobile responsive design
- Multi-chain support (Ethereum, BSC)
- Custom RPC endpoint configuration

---

## 📜 License

Open Source - Free to use, modify, and distribute.

**Built with ❤️ for the Solana community**

---

## ⚡ Quick Command Reference

### Bot Controls
- **Token Sniping**: `START SNIPING` / `STOP SNIPING`
- **Copy Trading**: `START COPY TRADING` / `STOP COPY TRADING`
- **Price Alerts**: `ADD ALERT` / `CLEAR ALL`
- **Volume Monitor**: `START MONITORING` / `STOP`
- **Rules Engine**: `ADD RULE` / `CLEAR ALL`
- **Token Scanner**: `START SCANNER` / `STOP`

### Wallet Operations
- **Create Wallets**: Set count → `CREATE WALLETS`
- **Distribute SOL**: Enter amount → `DISTRIBUTE SOL`
- **Collect SOL**: `COLLECT ALL SOL`
- **Select All**: `SELECT ALL` checkbox
- **Export Wallets**: `EXPORT WALLETS`

### Trading Operations
- **Execute Trades**: Configure → `EXECUTE ALL TRADES`
- **Set Slippage**: 0.1% - 50%
- **MEV Protection**: Toggle checkbox
- **Priority Fee**: Enable/disable

---

## 💎 Pro Tips

1. **Always test with small amounts first**
2. **Use MEV Protection for large trades**
3. **Set realistic profit targets in sniper**
4. **Monitor gas fees during high activity**
5. **Use multiple bots simultaneously**
6. **Create defensive rules (stop-losses)**
7. **Copy trade from proven wallets**
8. **Filter scanner results aggressively**
9. **Check token contract before sniping**
10. **Keep master wallet funded for gas**

---

## 🌟 Star History

If you find DIONTOOLS useful, please star the repository on GitHub!

⭐ https://github.com/ariluck77-alt/diontools

---

**DIONTOOLS - Trade Smarter, Not Harder** 🚀💎

*Last Updated: November 22, 2025*
