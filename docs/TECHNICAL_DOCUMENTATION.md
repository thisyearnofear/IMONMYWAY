# IMONMYWAY Technical Documentation

## System Architecture

### Agent-Native Design
Built on Somnia's Agentic L1 — autonomous agents are first-class actors, not wrappers around a dApp.

```
┌─────────────────────────────────────────────────────────────────┐
│                      SOMNIA ON-CHAIN                            │
│                                                                  │
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│  │PunctualityCore │◄─┤ PunctualityAgent │◄─┤ AgentRegistry   │ │
│  │(staking/settle)│  │(IAgentRequester  │  │(discovery/nego) │ │
│  │                │  │ Handler)         │  │                 │ │
│  └────────────────┘  └───────┬──────────┘  └─────────────────┘ │
│                              │                                   │
│         ┌────────────────────┼────────────────────┐             │
│         ▼                    ▼                    ▼             │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────────┐  │
│  │LLM Inference │  │JSON API Agent │  │On-Chain Reactivity  │  │
│  │Agent (reason)│  │(traffic/data) │  │(BlockTick, events)  │  │
│  └──────────────┘  └───────────────┘  └─────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Data Streams (GPS state publishing)          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OFF-CHAIN / FRONTEND                          │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │Agent Dashboard   │  │Off-Chain         │  │Venice AI      │ │
│  │(spectator UI)    │  │Reactivity SDK    │  │(supplemental  │ │
│  │Next.js 14        │  │(WebSocket stream)│  │ reasoning)    │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │       PostgreSQL + Prisma (agent state cache)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Innovation: Autonomous Agent Orchestration
```typescript
// Agents reason autonomously using on-chain LLM inference
const pacePayload = abi.encodeWithSelector(
  ILLMAgent.inferNumber.selector,
  pacePrompt,
  systemPrompt,
  minPace, maxPace,
  true // chain-of-thought
);

// Somnia validators execute independently, reach consensus
const requestId = platform.createRequest{value: deposit}(
  llmAgentId, address(this), this.handleResponse.selector, payload
);

// Callback delivers consensus-verified result
function handleResponse(uint256 requestId, Response[] memory responses,
    ResponseStatus status, Request memory details) external {
    int256 pace = abi.decode(responses[0].result, (int256));
    // Agent acts autonomously — no human needed
}
```

## AI Engine Architecture

### On-Chain Agent Reasoning (Primary)

The autonomous agent uses Somnia's LLM inference agent for all critical decisions. These calls are deterministic (fixed temperature) and consensus-verified across validator nodes.

```solidity
// In PunctualityAgent.sol — autonomous pace decision
function _decidepace(address principal, uint256 distance, string calldata context)
    internal returns (uint256 requestId)
{
    string memory prompt = string(abi.encodePacked(
        "Principal reputation: ", _uint2str(reputation), "/10000. ",
        "Distance: ", _uint2str(distance), "m. Context: ", context, ". ",
        "Recommend pace in seconds per km."
    ));

    bytes memory payload = abi.encodeWithSelector(
        ILLMAgent.inferNumber.selector,
        prompt,
        "You are a punctuality optimization agent. Be precise and conservative.",
        int256(30),   // min sec/km
        int256(300),  // max sec/km
        true          // chain-of-thought
    );

    uint256 deposit = platform.getRequestDeposit() + (0.07 ether * 3);
    return platform.createRequest{value: deposit}(
        llmAgentId, address(this), this.handleResponse.selector, payload
    );
}
```

### Off-Chain AI (Supplemental)

The existing TypeScript AI services provide richer reasoning for the frontend dashboard. They do not drive autonomous decisions.

#### AIService (`src/lib/ai-service.ts`)
- Stake recommendations (off-chain supplement to agent decisions)
- Reputation predictions (dashboard analytics)
- Betting odds calculation (spectator display)
- Contextual insights (user-facing explanations)

#### AICommitmentEngine (`src/lib/ai-commitment-engine.ts`)
- Historical performance analysis from on-chain data
- Rule-based fallback when Venice AI unavailable
- Social message generation (supplement to agent-generated posts)

#### Venice AI Routes (`src/app/api/ai/`)
- Enhanced pace recommendations with richer context
- Reputation trend analysis
- Dashboard enrichment — not autonomous decision-making

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

## Smart Contract Architecture

### Contract Hierarchy

```
contracts/
  core/
    PunctualityCore.sol          # Commitment staking, betting, settlement
  agents/
    PunctualityAgent.sol         # Agent orchestration (IAgentRequesterHandler)
    AgentRegistry.sol            # Agent discovery and counterparty matching
  interfaces/
    IPunctualityProtocol.sol     # Core protocol interface
  lib/
    Math.sol                     # Math utilities
```

### PunctualityCore (`contracts/core/PunctualityCore.sol`)
The settlement layer — handles commitment lifecycle, staking, betting, and payout. **Unchanged** from original design; agents call its existing functions.

```solidity
contract PunctualityCore {
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

    function createCommitment(...) external payable returns (bytes32);
    function placeBet(bytes32 commitmentId, bool bettingFor) external payable;
    function fulfillCommitment(bytes32 commitmentId, LocationData memory arrivalLocation) external;
    function getUserReputation(address user) external view returns (uint256);

    event CommitmentCreated(bytes32 indexed commitmentId, address indexed user, ...);
    event CommitmentFulfilled(bytes32 indexed commitmentId, bool successful, ...);
    event BetPlaced(bytes32 indexed commitmentId, address indexed bettor, ...);
}
```

### PunctualityAgent (`contracts/agents/PunctualityAgent.sol`)
The agent orchestration layer — implements Somnia's `IAgentRequesterHandler` to receive agent responses and act autonomously.

Key responsibilities:
- Invokes LLM inference agent for pace/deadline/settlement decisions
- Invokes JSON API agent for traffic/weather context
- Subscribes to on-chain reactivity (BlockTick for deadline monitoring)
- Publishes state to Data Streams
- Manages agent authorization and configuration per principal

### AgentRegistry (`contracts/agents/AgentRegistry.sol`)
On-chain registry for agent discovery — agents list their active commitments, counterparty agents find them.

```solidity
contract AgentRegistry {
    function listAgent(bytes32 commitmentId, address principal, uint256 deadline) external;
    function findCounterpartyAgent(address targetPrincipal) external view returns (AgentListing memory);

    event AgentListed(bytes32 indexed commitmentId, address indexed principal, address agentContract);
    event AgentMatched(bytes32 indexed commitmentA, bytes32 indexed commitmentB);
}
```

### Somnia Integration Points

```solidity
// Platform contract addresses
address constant SOMNIA_TESTNET_PLATFORM = 0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776;
address constant SOMNIA_MAINNET_PLATFORM = 0x5E5205CF39E766118C01636bED000A54D93163E6;

// Reactivity precompile
address constant REACTIVITY_PRECOMPILE = 0x0100;

// Agent call pattern
bytes memory payload = abi.encodeWithSelector(ILLMAgent.inferNumber.selector, prompt, system, min, max, true);
uint256 deposit = platform.getRequestDeposit() + (costPerAgent * subcommitteeSize);
platform.createRequest{value: deposit}(agentId, address(this), this.handleResponse.selector, payload);
```

## 🚀 **Deployment & Configuration**

### Environment Setup
```env
# Blockchain
SOMNIA_RPC_URL="https://api.infra.testnet.somnia.network"
SOMNIA_WS_URL="wss://api.infra.testnet.somnia.network"
SOMNIA_CHAIN_ID=50312
PRIVATE_KEY="your_private_key_here"

# Somnia Agent Platform
SOMNIA_PLATFORM_ADDRESS="0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776"
LLM_AGENT_ID="your_registered_llm_agent_id"
JSON_API_AGENT_ID="your_registered_json_api_agent_id"
PARSE_WEBSITE_AGENT_ID="12875401142070969085"

# Database (agent state cache)
DATABASE_URL="postgresql://username:password@localhost:5432/punctuality_protocol"

# Off-Chain AI (supplemental)
VENICE_API_KEY="your_venice_key"

# Social APIs (future integration)
FARCASTER_API_KEY="your_farcaster_key"
TWITTER_API_KEY="your_twitter_key"
```

### Build Commands
```bash
pnpm install              # Install dependencies
pnpm build               # Production build
pnpm dev                 # Development server
npm run db:deploy        # Apply database migrations
```

### Smart Contract Deployment
```bash
# Compile all contracts
npx hardhat compile

# Deploy to Somnia testnet (chain 50312)
npx hardhat run scripts/deploy.ts --network somnia_testnet

# Verify contracts on explorer
npx hardhat verify --network somnia_testnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

# Register agent IDs via Somnia portal
# https://agents.testnet.somnia.network
```

### Somnia Reactivity Setup
```bash
# Install reactivity contracts
npm install @somnia-chain/reactivity-contracts

# Install off-chain reactivity SDK
npm install @somnia-chain/reactivity

# Fund wallet for reactivity subscriptions (32 STT minimum balance)
# Subscribe via contract constructor — see PunctualityAgent.sol
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