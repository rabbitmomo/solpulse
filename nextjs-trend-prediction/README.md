# 🎯 Trend Prediction - Solana Anchor Demo

A complete, production-ready Next.js frontend application demonstrating full workflow integration with a Solana Anchor smart contract for decentralized trend prediction and reward distribution.

[![Solana](https://img.shields.io/badge/Solana-00D4AA?style=flat-square&logo=solana&logoColor=white)](https://solana.com)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Anchor](https://img.shields.io/badge/Anchor-3f3f3f?style=flat-square)](https://www.anchor-lang.com)

## 📋 Overview

This is a **fully functional demo** of the Trend Prediction program deployed on Solana Devnet:

- **Program ID**: `D9ZvX3tLKzCEhX6HM4FAdFsJnpqewW6canG5UJAfrAU5`
- **Network**: Solana Devnet
- **Status**: ✅ Live and Functional

The application demonstrates the complete instruction flow:
1. ✨ **Create Trend** - Create prediction markets
2. 🗳️ **Vote** - Community voting on outcomes  
3. 🏁 **Release Result** - Declare winner (creator only)
4. 💰 **Claim Reward** - Distribute rewards to winners

## 🚀 Quick Start

### Prerequisites

- Node.js v18+ and npm v9+
- A Solana wallet (Phantom, Solflare, etc.)
- Free Devnet SOL for transactions

### 1️⃣ Install & Run

```bash
# Navigate to project
cd nextjs-trend-prediction

# Install packages (already done, but optional to refresh)
npm install

# Start development server
npm run dev
```

Open **http://localhost:3000** in your browser ✅

### 2️⃣ Connect Your Wallet

1. Click "Select Wallet" button (top right)
2. Choose your wallet provider
3. Approve the connection

### 3️⃣ Get Test SOL

```bash
# Get free Devnet SOL
solana airdrop 5 <your-wallet-address> --url devnet
```

Or use: https://faucet.solana.com/

### 4️⃣ Start Trading Predictions!

Visit the **Setup Guide** for complete workflow instructions.

## 📱 Features

### Three Main Workflows

#### 🎯 Create Trend
- Set prediction description
- Define price range (current → target)
- Set expiration time
- Automatically generates unique trend address

#### 📊 View & Vote
- Enter trend address to load
- See live voting statistics
- Vote YES or NO with any amount
- Multiple votes supported
- Real-time percentage updates

#### ⚙️ Manage Trend (Creator Only)
- View all voting data
- Choose winning side
- Set reward pool amount
- Release result and finalize outcome

#### 💎 Claim Rewards
- Automatically available after result release
- Proportional reward distribution
- One-time claim per voter

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Next.js Frontend                │
│  (TypeScript + React + Tailwind CSS)    │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                      ▼
   ┌──────────┐        ┌──────────────┐
   │  Anchor  │        │   Solana     │
   │ Program  │───────▶│  Blockchain  │
   │  Client  │        │   (Devnet)   │
   └──────────┘        └──────────────┘
        │
   Components:
   ├─ CreateTrend.tsx
   ├─ Vote.tsx
   ├─ ReleaseResult.tsx
   ├─ ClaimReward.tsx
   └─ TrendViewer.tsx
```

## 📁 Project Structure

```
nextjs-trend-prediction/
├── app/
│   ├── components/
│   │   ├── CreateTrend.tsx       # Create prediction form
│   │   ├── Vote.tsx              # Voting interface
│   │   ├── ReleaseResult.tsx     # Result finalization (creator)
│   │   ├── ClaimReward.tsx       # Reward claiming
│   │   ├── TrendViewer.tsx       # Trend data display
│   │   └── index.ts              # Component exports
│   ├── providers/
│   │   └── WalletContextProvider.tsx  # Wallet setup
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Main demo page
│   └── globals.css               # Global styles
├── lib/
│   ├── program.ts                # Anchor client setup
│   ├── idl.json                  # Program interface
│   └── utils.ts                  # Helper functions
├── public/                       # Static assets
├── .env.local                    # Environment (pre-configured)
├── .env.example                  # Environment template
├── tsconfig.json                 # TypeScript config
├── next.config.ts                # Next.js config
├── package.json                  # Dependencies
├── SETUP_GUIDE.md                # 📖 Detailed setup guide
└── README.md                     # This file
```

## 🔧 Technologies

| Technology | Purpose |
|-----------|---------|
| **Next.js 16** | React framework |
| **TypeScript** | Type safety |
| **@coral-xyz/anchor** | Solana program client |
| **@solana/web3.js** | Blockchain interaction |
| **@solana/wallet-adapter** | Wallet integration |
| **Tailwind CSS** | Styling |

## 📚 Complete Function Flow

### Phase 1: Create Trend
```typescript
createTrend({
  description: "Will BTC reach $100K?",
  currentPrice: 50000,
  targetPrice: 100000,
  targetTime: 1735689600 // Unix timestamp
})
// Returns: Trend PDA address
```

### Phase 2: Vote
```typescript
vote({
  yes_amount: 100,    // Vote for YES with 100 SOL
  no_amount: 0        // No vote for NO
})
// Updates voting tallies
```

### Phase 3: Release Result (Creator)
```typescript
releaseResult({
  winning_side: true,      // YES side wins
  total_reward_pool: 1000  // 1000 SOL for winners
})
// Finalizes outcome
```

### Phase 4: Claim Reward (Winners)
```typescript
claimReward()
// Transfers: (your_votes / total_winning_votes) * pool
```

## 💡 Usage Example

### Step-by-Step Walkthrough

1. **Create a trend**
   - Tab: "✨ Create Trend"
   - Enter: "Bitcoin will reach $100,000"
   - Set: Current: 50,000 → Target: 100,000
   - Time: Use today + 3 months
   - Click: "Create Trend"
   - **Copy the trend address** ✅

2. **Vote on it**
   - Tab: "📈 View & Vote"
   - Paste: Trend address
   - Enter: YES amount: 100
   - Click: "Vote"
   - See: Vote updated! ✅

3. **Release result** (as creator)
   - Tab: "⚙️ Manage Trend"
   - Paste: Trend address
   - Choose: "YES side wins"
   - Set: Reward pool: 500
   - Click: "Release Result"
   - Finalized! ✅

4. **Claim reward** (as YES voter)
   - Tab: "📈 View & Vote"
   - Click: "💰 Claim My Reward"
   - Receive: Your share! ✅

## 🎯 Key Features

✅ **Real-time voting updates**
✅ **Live vote percentage display**
✅ **Proportional reward distribution**
✅ **Creator-only result release**
✅ **Wallet integration**
✅ **Error handling & validation**
✅ **Transaction status feedback**
✅ **Explorer links**

## 🔐 Security

- ✅ Program ID verified on-chain
- ✅ Creator authorization enforced
- ✅ Input validation (prices, descriptions, amounts)
- ✅ No private key handling in frontend
- ✅ All transactions signed by user's wallet
- ✅ Timestamp validation (prevents backdating)

## 🧪 Testing

### Test Network: Solana Devnet

1. **Get Devnet SOL**:
   ```bash
   solana airdrop 5 <wallet> --url devnet
   ```

2. **Create test trend**:
   - Use any description
   - Set target time 24h from now
   - Use reasonable price targets

3. **Vote with small amounts** first:
   - Start with 0.1 SOL
   - Verify voting works
   - Scale up as comfortable

4. **Monitor on explorer**:
   - Devnet: https://explorer.solana.com/?cluster=devnet
   - Search by wallet or transaction

## 🚀 Deployment

### Deploy to Vercel (Recommended)

```bash
# Build locally first
npm run build

# Deploy via Vercel CLI
vercel

# Or push to GitHub and deploy from Vercel dashboard
```

### Deploy to Other Platforms

- **Netlify**: Connected to GitHub
- **Railway**: Docker support available
- **Self-hosted**: `npm run build && npm start`

## 📖 Documentation

- **Setup Guide**: See `SETUP_GUIDE.md` for comprehensive instructions
- **Program IDL**: `lib/idl.json` contains full interface
- **Component Docs**: JSDoc comments in each component

## 🐛 Troubleshooting

### "Wallet not connected"
- Install wallet extension (Phantom recommended)
- Click "Select Wallet"
- Approve connection request

### "Insufficient balance"
- Get free SOL: `solana airdrop 5 <address> --url devnet`
- Or use: https://faucet.solana.com/

### "Transaction failed"
- Check Devnet RPC status
- Verify trend address is correct
- Ensure enough SOL for gas (~0.005 SOL per tx)

### "Account not found"
- Double-check trend address
- Verify it's on Devnet
- Check explorer to confirm creation

## 📚 Learn More

### Solana & Anchor
- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Developer Docs](https://docs.solana.com/)
- [Solana Cookbook](https://solanacookbook.com/)

### Next.js & React
- [Next.js Docs](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Wallet Integration
- [Wallet Adapter Docs](https://github.com/solana-labs/wallet-adapter)
- [Phantom Docs](https://docs.phantom.app/)

## 💬 Support

- 📧 Check `SETUP_GUIDE.md` for detailed FAQs
- 🔍 Search [Solana Stack Exchange](https://solana.stackexchange.com/)
- 💬 Ask on [Solana Discord](https://discord.com/invite/solana)

## 📄 License

This demo is provided as-is for educational purposes.

---

## 🎓 Key Learnings

This demo teaches:

1. **Solana Program Integration**: How to call smart contracts from web3 frontend
2. **Anchor Framework**: Using Anchor for type-safe blockchain interactions
3. **Wallet Integration**: Managing user wallets and signing transactions
4. **PDA Derivation**: Creating deterministic program-derived addresses
5. **State Management**: Handling on-chain state in React
6. **Error Handling**: Managing blockchain-specific errors
7. **UX Best Practices**: Building user-friendly blockchain apps

---

**Ready to predict trends? Let's go! 🚀📈**

