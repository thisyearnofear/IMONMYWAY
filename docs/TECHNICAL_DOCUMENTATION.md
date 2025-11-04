# IMONMYWAY Technical Documentation

## System Architecture

```
Frontend (Next.js 14 + React 18)
├── UI Components (Modular, Reusable)
├── State Management (Zustand Stores)
├── Hooks (Contract Interactions)
└── Real-time (Socket.IO)

Smart Contracts (Somnia Network)
├── PunctualityCore.sol (Main Logic)
├── LocationVerifier.sol (Proof System)
└── ReputationOracle.sol (Scoring)

Backend Services
├── PostgreSQL Database (Primary Storage)
├── Socket.IO Server (Real-time Updates)
└── Location Tracking Service (GPS Integration)
```

## Database Architecture

### PostgreSQL with Prisma ORM

**Schema Overview**:
```sql
users {
  id: String (Primary Key)
  walletAddress: String (Unique)
  email: String?
  reputationScore: Float (0-100)
  createdAt: DateTime
  updatedAt: DateTime
}

journeys {
  id: String (Primary Key)
  userId: String (Foreign Key)
  startLat: Float
  startLng: Float
  endLat: Float
  endLng: Float
  stakeAmount: Float
  status: JourneyStatus
  createdAt: DateTime
  completedAt: DateTime?
}

bets {
  id: String (Primary Key)
  journeyId: String (Foreign Key)
  bettorAddress: String
  amount: Float
  betType: BetType (FOR/AGAINST)
  status: BetStatus
  createdAt: DateTime
  resolvedAt: DateTime?
}
```

**Configuration & Commands**:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/punctuality_protocol"
```

```bash
npm run db:deploy           # Apply migrations
npm run db:generate-migration  # Generate new migration
npm run db:reset           # Reset database
```

## Smart Contract Architecture

### Contract Deployment on Somnia

**Prerequisites**: Node.js 18+, pnpm, wallet with STT tokens, private key in .env.local

**Deployment Steps**:
1. Set environment: `PRIVATE_KEY`, `SOMNIA_RPC_URL`
2. Install: `pnpm install`
3. Compile: `pnpm compile`
4. Deploy: `pnpm deploy --network somnia_testnet`
5. Update addresses in `src/contracts/addresses.ts`

### Contract Configuration & Interaction
```typescript
// src/contracts/addresses.ts
export const CONTRACT_ADDRESSES = {
  somnia_mainnet: {
    PunctualityCore: "0x...",
    LocationVerifier: "0x...",
    ReputationOracle: "0x..."
  },
  somnia_testnet: {
    PunctualityCore: "0x...",
    LocationVerifier: "0x...",
    ReputationOracle: "0x..."
  }
};

// src/lib/contracts.ts
export class ContractService {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private contracts: Record<string, ethers.Contract>;

  async initialize() {
    this.provider = new ethers.JsonRpcProvider(process.env.SOMNIA_RPC_URL);
    this.signer = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);
    
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