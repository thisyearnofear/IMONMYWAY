# Architecture Overview

## System Design

```
Frontend (Next.js + React)
├── UI Components (Modular, Reusable)
├── State Management (Zustand Stores)
├── Hooks (Contract Interactions)
└── Real-time (Socket.IO)

Smart Contracts (Somnia Network)
├── PunctualityCore.sol (Main Logic)
├── LocationVerifier.sol (Proof System)
└── ReputationOracle.sol (Scoring)

Backend Services
├── Socket.IO Server (Real-time Updates)
└── Location Tracking (GPS Integration)
```

## Core Components

- **Wallet Integration**: MetaMask + Somnia network
- **Real-time Tracking**: GPS + WebSocket updates
- **Betting System**: Stake management + social betting
- **Reputation**: On-chain reliability scoring

## Data Flow

1. User creates commitment → Smart contract
2. Location updates → Socket.IO → Real-time UI
3. Betting actions → Contract interactions
4. Reputation updates → On-chain scoring

## Smart Contract Deployment

### Prerequisites

- Node.js 18+, pnpm, wallet with STT tokens
- Private key (secure storage required)

### Deployment Steps

1. Set up environment variables (.env.local)
2. Install dependencies: `pnpm install`
3. Compile contracts: `pnpm compile`
4. Deploy to Somnia Testnet: `pnpm deploy --network somnia_testnet`
5. Update contract addresses in `src/contracts/addresses.ts`

### Mainnet Deployment

- Use mainnet wallet private key
- Run: `pnpm deploy --network somnia`
- Update mainnet addresses

## Database Setup

### PostgreSQL Installation

```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Database Configuration

1. Create user and database:

```sql
CREATE USER punctuality_user WITH PASSWORD 'punctuality_password';
CREATE DATABASE punctuality_db OWNER punctuality_user;
GRANT ALL PRIVILEGES ON DATABASE punctuality_db TO punctuality_user;
```

2. Update environment variables:

```env
DATABASE_URL="postgresql://punctuality_user:punctuality_password@localhost:5432/punctuality_db"
```

3. Run migrations: `npx prisma migrate dev`

### Docker Alternative

```bash
docker run -d --name punctuality-postgres \
  -e POSTGRES_USER=punctuality_user \
  -e POSTGRES_PASSWORD=punctuality_password \
  -e POSTGRES_DB=punctuality_db \
  -p 5432:5432 postgres:15
```

## Implementation Status

### Phase 1 Complete: Smart Contract Foundation

- ✅ PunctualityCore.sol deployed
- ✅ Wallet integration (MetaMask + Somnia)
- ✅ Basic betting mechanics
- ✅ Real-time location tracking

### Current Architecture

```
src/
├── lib/contracts.ts          # Single contract integration
├── contracts/addresses.ts    # Network configuration
├── hooks/useBetting.ts       # Contract interactions
└── hooks/useWallet.ts        # Somnia network integration
```

## Performance Optimizations

### Unified Experience Engine

- Adaptive animations based on device capabilities
- Intelligent caching with TTL
- Performance monitoring dashboard
- Bundle optimization and lazy loading

### Database Optimization

- Query caching and batch operations
- Connection pooling simulation
- Performance monitoring and slow query detection

### Network Resilience

- Offline-first architecture
- Action queue with priority handling
- Background sync when connection restored

## Security Considerations

- Private keys never committed to version control
- Secure environment variable management
- Contract verification on blockchain explorers
- Firewall configuration for production
- Automated backups and monitoring

## Production Deployment

### Infrastructure Requirements

- PostgreSQL database with proper security
- Secure private key management
- Monitoring and alerting setup
- CDN for global distribution
- Load balancing for scalability

### Environment Setup

- Production database with connection pooling
- Secure API endpoints
- SSL/TLS certificates
- Backup and recovery procedures
- Performance monitoring tools

## Troubleshooting

### Common Issues

- **PostgreSQL connection**: Ensure service is running
- **Contract deployment**: Verify wallet balance and network connection
- **Build failures**: Check Node.js version and dependencies
- **Network issues**: Confirm Somnia RPC endpoint availability

### Performance Monitoring

- Use Performance Dashboard (Ctrl+Shift+P) for real-time metrics
- Monitor Core Web Vitals
- Track error rates and recovery success
- Analyze network performance patterns
