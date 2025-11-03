# IMONMYWAY - Punctuality Protocol

> **Put your money where your mouth is.** Stake tokens on your punctuality and let others bet on your success.

A decentralized betting protocol that combines real-time location tracking with financial accountability, built for the Somnia DeFi Mini Hackathon.

## ✨ Features

- **🔗 Staked Commitments**: Put tokens on the line for punctuality
- **🎲 Social Betting**: Friends bet on your success for added accountability  
- **📍 GPS Verification**: Blockchain-verified proof of arrival
- **⭐ Reputation System**: Reliability scoring affects betting odds
- **📱 Real-time Tracking**: Live location updates via WebSocket
- **🎨 Enhanced UX**: Delightful animations, haptic feedback, achievement celebrations
- **🤖 Smart Recommendations**: AI-powered stake suggestions based on context
- **⚡ Performance Adaptive**: Smooth experience across all devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Node.js with Socket.IO for real-time communication
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS with glass morphism effects
- **State**: Zustand with persistence and DevTools
- **Blockchain**: Solidity smart contracts on Somnia Network
- **3D Graphics**: Three.js + React Three Fiber

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm package manager
- PostgreSQL 13+
- Modern browser with WebSocket and Geolocation support

### Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Set up database**
   ```bash
   # Create PostgreSQL database and run migrations
   npm run db:deploy
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

4. **Open browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create `.env.local`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/punctuality_protocol"
SOMNIA_RPC_URL="https://rpc.somnia.network"
PRIVATE_KEY="your_private_key_here"
```

## 📚 Documentation

### Essential Reading

- **[PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md)**: Project vision, features, tech stack, and compliance achievements
- **[CORE_PRINCIPLES.md](docs/CORE_PRINCIPLES.md)**: Our eight core principles and implementation guidelines  
- **[IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)**: Current progress analysis and plan to transform from prototype to production
- **[TECHNICAL_DOCUMENTATION.md](docs/TECHNICAL_DOCUMENTATION.md)**: System architecture, database design, smart contracts, and deployment guide

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
- **Backend**: Deployed at `http://157.180.36.156`
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
curl http://157.180.36.156/health
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
