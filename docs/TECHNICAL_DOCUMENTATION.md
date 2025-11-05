# IMONMYWAY Technical Documentation

## 🏗️ **System Architecture**

### **Clean & Focused Design**
Following **AGGRESSIVE CONSOLIDATION** principles - minimal database, maximum blockchain leverage:

```
┌─────────────────────────────────────┐
│        Social Integration           │
│    (Farcaster/Twitter APIs)        │  ← Leverage existing networks
├─────────────────────────────────────┤
│         AI Engine                  │
│   (On-chain Performance Analysis)   │  ← Trustless learning
├─────────────────────────────────────┤
│       Smart Contracts              │
│      (Somnia Network)              │  ← Single source of truth
├─────────────────────────────────────┤
│        Frontend                    │
│   (Next.js 14 + Real-time GPS)    │  ← Mobile-optimized PWA
└─────────────────────────────────────┘
```

### **Key Innovation: Trustless AI Learning**
```typescript
// ❌ Traditional: Trust user input
const userProfile = await database.getUserProfile(userId);

// ✅ Our approach: Analyze blockchain truth
const history = await contractService.getUserPerformanceHistory(address);
const aiSuggestion = AICommitmentEngine.generateSuggestion(address, distance, context);
```

## 🧠 **AI Engine Architecture**

### **Core Components**

#### **AICommitmentEngine** (`src/lib/ai-commitment-engine.ts`)
```typescript
class AICommitmentEngine {
  // Analyzes actual blockchain performance
  static async generateSuggestion(
    userAddress: string,
    distance: number,
    context: 'work' | 'social' | 'urgent'
  ): Promise<AICommitmentSuggestion>

  // Generates viral social content
  static generateSocialMessage(suggestion, destination, context): string
}
```

#### **SocialIntegrationService** (`src/lib/social-integration.ts`)
```typescript
class SocialIntegrationService {
  // Cross-platform sharing
  static async shareCommitmentCreation(commitment, platforms)
  
  // Social sentiment analysis
  static async analyzeSocialSentiment(walletAddress): Promise<SocialReputation>
  
  // Viral potential calculation
  static async getViralPotential(walletAddress): Promise<number>
}
```

## 🗄️ **Database Architecture (Minimal)**

### **AGGRESSIVE CONSOLIDATION Applied**
- **Removed**: Complex profile models (CulturalTimeProfile, RunningProfile, PeerReview)
- **Kept**: Essential social features only

### **Simplified Schema**
```sql
-- Core user management
users {
  id: String (Primary Key)
  walletAddress: String (Unique)
  reputationScore: Float (0-100)
  createdAt: DateTime
}

-- Minimal commitment tracking (for leaderboards)
commitments {
  id: String (Primary Key)
  userId: String (Foreign Key)
  stakeAmount: String
  deadline: DateTime
  successful: Boolean?
  createdAt: DateTime
}

-- Social betting features  
bets {
  id: String (Primary Key)
  commitmentId: String (Foreign Key)
  bettor: String
  amount: String
  bettingFor: Boolean
  createdAt: DateTime
}
```

## 📜 **Smart Contract Architecture**

### **PunctualityCore.sol** (`contracts/core/PunctualityCore.sol`)
```solidity
contract PunctualityCore {
    // Core commitment structure
    struct ETACommitment {
        address user;
        uint256 stakeAmount;
        uint256 arrivalDeadline;
        LocationData startLocation;
        LocationData targetLocation;
        uint256 estimatedDistance;
        uint256 estimatedPace;
        bool fulfilled;
        bool successful;
        uint256 actualArrivalTime;
        uint256 totalBetsFor;
        uint256 totalBetsAgainst;
    }

    // AI learns from these events
    event CommitmentCreated(bytes32 indexed commitmentId, address indexed user, ...);
    event CommitmentFulfilled(bytes32 indexed commitmentId, bool successful, ...);
}
```

### **Event-Driven AI Learning**
```typescript
// AI analyzes these blockchain events
const createdEvents = await contract.queryFilter(contract.filters.CommitmentCreated(null, userAddress));
const fulfilledEvents = await contract.queryFilter(contract.filters.CommitmentFulfilled(null, userAddress));

// Build performance history from trustless on-chain data
const history = this.combineEvents(createdEvents, fulfilledEvents);
```

## 🚀 **Deployment & Configuration**

### **Environment Setup**
```env
# Blockchain
SOMNIA_RPC_URL="https://rpc.somnia.network"
PRIVATE_KEY="your_private_key_here"

# Database (minimal usage)
DATABASE_URL="postgresql://username:password@localhost:5432/punctuality_protocol"

# Social APIs (future integration)
FARCASTER_API_KEY="your_farcaster_key"
TWITTER_API_KEY="your_twitter_key"
```

### **Build Commands**
```bash
pnpm install              # Install dependencies
pnpm build               # Production build
pnpm dev                 # Development server
npm run db:deploy        # Apply database migrations (minimal)
```

### **Smart Contract Deployment**
```bash
# Prerequisites: Node.js 18+, pnpm, wallet with STT tokens
pnpm compile             # Compile contracts
pnpm deploy --network somnia_testnet  # Deploy to Somnia
```

## 📊 **Performance & Optimization**

### **AGGRESSIVE CONSOLIDATION Results**
- **Removed**: 2,400+ lines of complex profile management code
- **Simplified**: Database from 10+ tables to 3 essential ones  
- **Enhanced**: AI now uses trustless blockchain data instead of user claims
- **Bundle Size**: Reduced shared JS by ~1KB (102KB vs 103KB)
- **Build Time**: Faster compilation with cleaner architecture

### **Mobile Optimization**
- **PWA Ready**: Service worker, offline capabilities
- **Touch Optimized**: Gesture-based interactions
- **Performance**: Adaptive loading, resource optimization
- **Real-time**: WebSocket for live GPS tracking

### **Caching Strategy**
```typescript
// Smart caching for blockchain queries
const cachedHistory = await cacheService.get(`performance_${address}`);
if (!cachedHistory) {
  const history = await contractService.getUserPerformanceHistory(address);
  await cacheService.set(`performance_${address}`, history, 300); // 5min cache
}
```

## 🔧 **Development Workflow**

### **Core Principles Applied**
- **ENHANCEMENT FIRST**: Enhance blockchain data, don't recreate it
- **PREVENT BLOAT**: Minimal database, leverage existing social networks
- **DRY**: Single source of truth (blockchain events)
- **CLEAN**: Clear separation of concerns
- **PERFORMANT**: Optimized for mobile and real-time use

### **Testing Strategy**
```bash
pnpm test                # Unit tests
pnpm test:integration    # Integration tests
pnpm test:e2e           # End-to-end tests
```

### **Monitoring & Analytics**
- Real-time performance metrics
- AI suggestion accuracy tracking
- Social engagement analytics
- Blockchain event monitoring
    
    const addresses = getContractAddresses('somnia_testnet');
    this.contracts = {
      punctuality: new ethers.Contract(
        addresses.PunctualityCore,
        PUNCTUALITY_CORE_ABI,
        this.signer
      )
    };
  }

  async createJourney(data: JourneyData) {
    return await this.contracts.punctuality.createJourney(data);
  }

  async placeBet(journeyId: string, amount: number, betType: number) {
    return await this.contracts.punctuality.placeBet(journeyId, amount, betType);
  }
}
```

## Real-Time Architecture

### Socket.IO Implementation
```typescript
// server.js
const io = require('socket.io')(server, {
  cors: { origin: process.env.FRONTEND_URL, methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
  socket.on('join-journey', (journeyId) => {
    socket.join(`journey-${journeyId}`);
  });
  
  socket.on('location-update', (data) => {
    socket.to(`journey-${data.journeyId}`).emit('location-update', data);
  });
  
  socket.on('bet-placed', (betData) => {
    io.emit('bet-placed', betData);
  });
});

// src/lib/socket.ts
class RealtimeService {
  private socket: Socket;

  constructor() {
    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!);
  }

  joinJourney(journeyId: string) {
    this.socket.emit('join-journey', journeyId);
  }

  onLocationUpdate(callback: (data: any) => void) {
    this.socket.on('location-update', callback);
  }

  updateLocation(locationData: any) {
    this.socket.emit('location-update', locationData);
  }
}
```

## Performance Optimization

### 3D Rendering Optimization
```typescript
// src/components/three/OptimizedBackground.tsx
import { useDevicePerformance } from '@/hooks/useDevicePerformance';

export function OptimizedBackground() {
  const { isLowEnd, isMobile } = useDevicePerformance();
  
  const particleCount = isLowEnd ? 500 : isMobile ? 1000 : 2000;
  const renderQuality = isLowEnd ? 'low' : isMobile ? 'medium' : 'high';
  
  return (
    <Canvas
      dpr={isMobile ? 1 : [1, 2]}
      gl={{
        antialias: !isMobile,
        powerPreference: isMobile ? "low-power" : "high-performance"
      }}
    >
      <OptimizedParticles count={particleCount} quality={renderQuality} />
    </Canvas>
  );
}
```

### Caching Strategy
```typescript
// src/lib/cache-service.ts
interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private cache = new Map<string, CacheItem>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl = this.DEFAULT_TTL) {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
```

## Mobile Optimization

### Touch Gestures & Haptic Feedback
```typescript
// src/hooks/useGestures.ts
export function useGestures() {
  const [gestures, setGestures] = useState({
    swipe: null as string | null,
    pinch: 0,
    longPress: false
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    // Track touch start for gesture recognition
  }, []);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart);
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, [handleTouchStart]);

  return gestures;
}

// src/lib/haptics.ts
export class HapticFeedback {
  static light() { if ('vibrate' in navigator) navigator.vibrate(10); }
  static medium() { if ('vibrate' in navigator) navigator.vibrate(50); }
  static heavy() { if ('vibrate' in navigator) navigator.vibrate([100, 30, 100]); }
}
```

## Security Implementation

### Wallet Integration Security
```typescript
// src/hooks/useWallet.ts
export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      if (!window.ethereum) throw new Error('MetaMask not found');
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });
      
      if (chainId !== SOMNIA_CHAIN_ID) {
        await switchToSomnia();
      }
      
      setAddress(accounts[0]);
    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  return { address, isConnecting, connect };
}
```

## Environment Configuration

### Development & Production
```bash
# .env.local (Development)
DATABASE_URL="postgresql://username:password@localhost:5432/punctuality_dev"
REDIS_URL="redis://localhost:6379"
SOMNIA_RPC_URL="https://rpc.somnia.network"
PRIVATE_KEY="your_private_key_here"
SOCKET_URL="http://localhost:3001"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"

# .env.production (Production)
DATABASE_URL="postgresql://prod_user:prod_pass@prod-db:5432/punctuality_prod"
REDIS_URL="redis://prod-redis:6379"
SOMNIA_RPC_URL="https://rpc.somnia.network"
SOCKET_URL="https://imonmywayapi.persidian.com"
NEXT_PUBLIC_SOCKET_URL="https://imonmywayapi.persidian.com"
```

## Deployment Requirements

### Hosting Requirements
- **Node.js hosting required** (not static hosting)
- **Supports**: Railway, Render, DigitalOcean, AWS EC2, Hetzner
- **HTTPS required** for geolocation API access
- **WebSocket support** needed for real-time features
- **PostgreSQL database** required for production use
- **PM2 recommended** for process management

### Database Setup
```bash
# macOS
brew install postgresql && brew services start postgresql

# Ubuntu
sudo apt install postgresql postgresql-contrib && sudo systemctl start postgresql

# Create database
createdb punctuality_protocol
```

This technical documentation provides the foundation for building, deploying, and maintaining the IMONMYWAY platform while ensuring scalability and performance across all deployment environments.