# 🎯 SolPulse - On-Chain Sentiment Aggregator for Meme Coins

A decentralized prediction platform on **Solana Devnet** where users create meme coin predictions, vote on outcomes, and use AI-powered sentiment analysis to assess community confidence.

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                     │
│  Create Predictions |  Vote |  View Results    │
└────────────────────┬────────────────────────────────────┘
                     │
                ┌────▼─────┐
                │  Anchor  │
                │ Programs │
                └────┬─────┘
                     │
        ┌────────────▼────────────┐
        │  Solana Blockchain     │
        │  (Devnet)              │
        └────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js v18+ and npm v9+
- Solana wallet (Phantom/Solflare)
- Git

### 2. Clone & Install

```bash
# Clone repository
git clone <repo-url>
cd solpulse

# Install frontend dependencies
cd nextjs-trend-prediction
npm install
```

### 3. Configure Environment

Create `.env.local` in `nextjs-trend-prediction/`:

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=D9ZvX3tLKzCEhX6HM4FAdFsJnpqewW6canG5UJAfrAU5
NEXT_PUBLIC_GOOGLE_API_KEY=your_google_api_key
NEXT_PUBLIC_GOOGLE_CX=your_google_cse_id
AWS_BEARER_TOKEN_BEDROCK=your_bedrock_token
```

### 4. Get Devnet SOL

```bash
solana airdrop 5 <your-wallet-address> --url devnet
```

Or use: https://faucet.solana.com/

### 5. Run Development Server

```bash
cd nextjs-trend-prediction
npm run dev
```

Open **http://localhost:3000** in your browser ✅

---

## Features

### Create Predictions
- Set prediction title & description
- Define expiration time
- 🪙 Specify token address

### Vote & Explore
- Vote YES/NO on predictions
- See live voting percentages
- View Confidence Index (YES votes %)

### AI Analysis (Bedrock + Google Search)
- Search forums for discussions
- Get Bedrock AI sentiment analysis
- Assessment: Sentiment, Justification, Likelihood, Risk

### Confidence Index
```
Confidence Index = YES votes / Total votes × 100

Examples:
- 1 YES, 3 NO  → 25% (weak consensus for YES)
- 2 YES, 2 NO  → 50% (split opinion)
- 3 YES, 1 NO  → 75% (strong consensus for YES)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Bootstrap 5 |
| **Blockchain** | Solana, Anchor Framework, Web3.js |
| **AI** | AWS Bedrock (sentiment analysis) |
| **Search** | Google Custom Search API |

---

## 🔗 Smart Contract (Anchor)

Located in: `contract_trend_prediction/programs/trend_prediction/`

### Key Instructions

```rust
// Create a new prediction
createProposal(
  title: String,
  description: String,
  tokenAddress: PublicKey,
  expirationTime: i64
)

// Vote on a prediction
voteOnProposal(
  voteDirection: VoteDirection // { yes: {} } or { no: {} }
)

// Release result (creator only)
releaseResult(
  winningSide: bool,
  totalRewardPool: u64
)

// Claim reward (winners only)
claimReward()
```

### Key Accounts

```rust
#[account]
pub struct ProposalAccount {
  pub author: Pubkey,
  pub title: String,
  pub description: String,
  pub tokenAddress: Pubkey,
  pub createdAt: i64,
  pub expirationTime: i64,
  pub yesVotes: u64,
  pub noVotes: u64,
  pub uniqueVoters: u64,
  pub voters: Vec<VoterRecord>,
  pub closed: bool,
  pub outcome: Option<ProposalOutcome>,
}
```

---

## 📁 Project Structure

```
solpulse/
├── nextjs-trend-prediction/      # Frontend (Next.js)
│   ├── app/
│   │   ├── components/           # React components
│   │   │   ├── CreateTrend.tsx
│   │   │   ├── Vote.tsx
│   │   │   ├── TrendViewer.tsx
│   │   │   ├── BedrockChat.tsx
│   │   │   └── GoogleSearch.tsx
│   │   ├── api/                  # API routes
│   │   │   ├── bedrock/route.ts
│   │   │   └── search/route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Main page
│   │   └── globals.css
│   ├── lib/
│   │   ├── program.ts            # Anchor client
│   │   └── idl.json              # Program interface
│   ├── package.json
│   └── .env.local
│
└── contract_trend_prediction/    # Rust/Anchor (Smart Contract)
    ├── programs/trend_prediction/src/
    │   ├── lib.rs                # Program entry
    │   ├── instructions/         # Instructions
    │   ├── state/                # Account structs
    │   ├── error.rs              # Error types
    │   └── constants.rs
    ├── Anchor.toml
    └── Cargo.toml
```

---

## 🎮 Usage Example

### 1. Create a Prediction
- Tab: "✨ Create Prediction"
- Enter: "Will BONK reach 10X by Dec 2025?"
- Click: "Create Trend"
- ✅ Prediction created on-chain

### 2. Vote
- Tab: "🗳️ Vote & Explore"
- Enter: Prediction ID
- Click: "Vote YES" or "Vote NO"
- ✅ Your vote locked

### 3. Check Results
- See: Voting percentages
- See: Confidence Index
- Click: "Generate Insight" for AI analysis
- ✅ Bedrock analyzes community sentiment

---

## 📊 API Routes

### `/api/bedrock` (POST)
Calls AWS Bedrock for sentiment analysis.

**Request:**
```json
{
  "userMessage": "Analyze this: BTC will pump 3x by EOY"
}
```

**Response:**
```json
{
  "result": {
    "output": {
      "message": {
        "content": [
          { "text": "- Sentiment: Bullish\n- Justification: Yes..." }
        ]
      }
    }
  }
}
```

### `/api/search` (POST)
Searches forums for meme coin discussions.

**Request:**
```json
{
  "query": "BONK 10x prediction"
}
```

**Response:**
```json
{
  "results": [
    {
      "title": "BONK pumping hard!",
      "link": "https://reddit.com/...",
      "snippet": "BONK is mooning...",
      "domain": "reddit.com"
    }
  ]
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Wallet not connecting | Install Phantom, refresh page, click "Select Wallet" |
| "Insufficient balance" | Get SOL: `solana airdrop 5 <address> --url devnet` |
| "Transaction simulation failed" | Refresh page, check wallet network is Devnet |
| "Prediction not found" | Verify prediction ID, wait a few seconds, refresh |
| Confidence Index stuck at old value | Hard refresh: `Ctrl+Shift+R` |

---

## Program ID

```
D9ZvX3tLKzCEhX6HM4FAdFsJnpqewW6canG5UJAfrAU5
```

Network: **Solana Devnet**

---

## 📄 License

Educational project. Use at your own risk.

---

**Ready to predict meme coin trends? 🚀📈**
