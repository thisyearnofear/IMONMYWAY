# IMONMYWAY - AI-Powered Punctuality Protocol

> **The first punctuality protocol where AI learns from your actual blockchain performance, not what you claim you can do.**

A revolutionary DeFi protocol that combines **on-chain AI analysis**, **social proof**, and **financial accountability** to create intelligent punctuality commitments. Built for the Somnia DeFi Mini Hackathon.

## 🧠 **Key Innovation: Trustless AI Learning**

Unlike traditional apps that rely on self-reported data, our AI analyzes your **actual on-chain commitment history** to provide personalized suggestions. Can't fake your track record when it's on the blockchain!

## ✨ **Core Features**

### 🎯 **AI-Powered Intelligence**
- **On-Chain Learning**: AI analyzes your actual performance from blockchain events
- **Smart Suggestions**: Context-aware deadline and pace recommendations  
- **Social Integration**: Leverage Farcaster/Twitter for viral sharing and peer validation
- **Trustless Data**: No self-reported profiles - only proven blockchain performance

### 💰 **DeFi Mechanics**
- **Staked Commitments**: Put tokens on the line for punctuality
- **Social Betting**: Friends bet on your success for added accountability
- **Dynamic Odds**: AI-calculated betting odds based on historical performance
- **Instant Settlements**: Smart contract automation for fair payouts

### 🌐 **Social & Viral**
- **Auto-Generated Content**: AI creates perfect social media posts
- **Viral Potential Scoring**: Predict and optimize shareability
- **Cross-Platform Integration**: Farcaster, Twitter, and Lens Protocol ready
- **Network Effects**: Leverage existing social graphs instead of building new ones

### 🔧 **Technical Excellence**
- **Real-Time GPS**: Blockchain-verified location proofs
- **Performance Optimized**: Adaptive loading and caching
- **Mobile-First**: PWA with offline capabilities
- **Clean Architecture**: Minimal database, maximum blockchain leverage

## 🏗️ **Architecture**

### **AI Engine**
```typescript
// On-chain data analysis - no database profiles needed
const history = await contractService.getUserPerformanceHistory(address);
const suggestion = AICommitmentEngine.generateSuggestion(address, distance, context);
```

### **Social Integration**
```typescript
// Leverage existing networks instead of building our own
const socialProof = await SocialIntegrationService.analyzeSocialSentiment(address);
const viralContent = AICommitmentEngine.generateSocialMessage(suggestion, destination);
```

### **Smart Contracts**
- **PunctualityCore.sol**: Core commitment and betting logic
- **Event-Driven**: All AI learning happens from contract events
- **Gas Optimized**: Efficient operations on Somnia Network

## 🛠️ **Tech Stack**

- **Blockchain**: Solidity smart contracts on Somnia Network
- **AI Engine**: TypeScript with on-chain data analysis
- **Frontend**: Next.js 14, React 18, TypeScript
- **Social APIs**: Farcaster, Twitter, Lens Protocol integration
- **Real-time**: Socket.IO for live tracking
- **Database**: Minimal PostgreSQL (only for leaderboards/social features)
- **Styling**: Tailwind CSS with premium animations
- **3D Graphics**: Three.js + React Three Fiber

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- pnpm package manager
- Modern browser with WebSocket and Geolocation support
- MetaMask or compatible Web3 wallet

### **Setup**

1. **Clone and Install**
   ```bash
   git clone https://github.com/yourusername/imonmyway
   cd imonmyway
   pnpm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Add your environment variables (see below)
   ```

3. **Database Setup (Optional)**
   ```bash
   # Only needed for leaderboard/social features
   npm run db:deploy
   ```

4. **Start Development**
   ```bash
   pnpm dev
   ```

5. **Experience the AI**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Connect your wallet
   - Create your first AI-assisted commitment!

### Environment Variables

Create `.env.local`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/punctuality_protocol"
SOMNIA_RPC_URL="https://rpc.somnia.network"
PRIVATE_KEY="your_private_key_here"
```

## 🏆 **Hackathon Innovation**

### **🎯 The Problem We Solve**
Traditional punctuality apps rely on **self-reported data** - users can lie about their capabilities. Existing social proof systems require building complex peer review infrastructure.

### **💡 Our Solution**
1. **Trustless AI Learning**: Analyze actual blockchain performance, not claims
2. **Social Network Leverage**: Use Farcaster/Twitter instead of building social features
3. **Financial Accountability**: Stake real money on AI-generated commitments
4. **Viral Mechanics**: Auto-generated social content with viral potential scoring

### **🧠 Technical Innovation**
```typescript
// Traditional approach: Trust user input
const userProfile = await database.getUserProfile(userId); // ❌ Can be faked

// Our approach: Analyze blockchain truth
const history = await contractService.getUserPerformanceHistory(address); // ✅ Trustless
const aiSuggestion = AICommitmentEngine.generateSuggestion(address, distance, context);
```

### **🚀 Why This Wins**
- **Novel**: First AI that learns from blockchain performance data
- **Practical**: Leverages existing social networks (Farcaster/Twitter)
- **Scalable**: Network effects from day one
- **Viral**: Built-in sharing incentives with AI-optimized content

## 📚 **Documentation**

### **Essential Reading**

- **[PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md)**: Project vision, features, tech stack, and compliance achievements
- **[CORE_PRINCIPLES.md](docs/CORE_PRINCIPLES.md)**: Our eight core principles and implementation guidelines  
- **[IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)**: Current progress analysis and plan to transform from prototype to production
- **[TECHNICAL_DOCUMENTATION.md](docs/TECHNICAL_DOCUMENTATION.md)**: System architecture, database design, smart contracts, and deployment guide
- **[CHALLENGE_TEMPLATES.md](docs/CHALLENGE_TEMPLATES.md)**: Documentation for challenge templates and viral campaign features

### Development

Available commands:
```bash
pnpm dev              # Development with hot reload
pnpm build           # Production build
pnpm lint            # ESLint with TypeScript
npm run db:deploy    # Deploy database migrations
npm run db:generate-migration  # Generate new migration
```

### Current Deployment Status

- **Frontend**: Deployed at `https://imonmyway.netlify.app`
- **Backend**: Deployed at `https://imonmywayapi.persidian.com`
- **Database**: PostgreSQL with Prisma ORM
- **WebSocket**: Socket.IO for real-time communication

## 🔧 Configuration

### Production Deployment Requirements

- **Node.js hosting required** (not static hosting)
- **Supports**: Railway, Render, DigitalOcean, AWS EC2, Hetzner
- **HTTPS required** for geolocation API access
- **WebSocket support** needed for real-time features
- **PostgreSQL database** required for production use
- **PM2 recommended** for process management

### Troubleshooting

**Backend Connection Issues**:
```bash
# Check backend status
pm2 status

# Check backend logs  
pm2 logs imonmyway-backend --lines 20

# Test health endpoint
curl https://imonmywayapi.persidian.com/health
```

**Database Issues**:
```bash
# Test database connection
npx prisma db push

# Reset database
npm run db:reset
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following our [Core Principles](docs/CORE_PRINCIPLES.md)
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License

## 🙏 Acknowledgments

- Built with Next.js and React ecosystem
- Maps powered by OpenStreetMap and Leaflet  
- Real-time communication via Socket.IO
- Database management with Prisma and PostgreSQL
- Blockchain integration with ethers.js and Solidity
# Force Netlify rebuild Tue  4 Nov 2025 12:40:41 EAT
