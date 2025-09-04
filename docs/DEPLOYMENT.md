# Deployment & Roadmap

## Contract Deployment Guide

### Prerequisites

- MetaMask with Somnia Testnet configured
- STT tokens from [Somnia Faucet](https://faucet.somnia.network)
- Private key in `.env.local`

### Deployment Steps

#### 1. Deploy via Remix IDE

1. Open [Remix IDE](https://remix.ethereum.org)
2. Create new file: `PunctualityCore.sol`
3. Copy contract from `contracts/core/PunctualityCore.sol`
4. Compile with Solidity ^0.8.22
5. Connect MetaMask to Somnia Testnet
6. Deploy with no constructor parameters
7. Copy deployed contract address

#### 2. Update Contract Addresses

```typescript
// Update src/contracts/addresses.ts
export const SOMNIA_TESTNET_ADDRESSES: ContractAddresses = {
  PunctualityCore: "0x...", // Paste deployed address here
  // ... other contracts
};
```

#### 3. Switch to Real Contract Calls

```typescript
// Update src/lib/contracts.ts
// Replace simulation with real ethers.js calls
```

### Verification

- Verify contract on Somnia Explorer
- Test with small stake amounts
- Confirm gas estimates are accurate

### Network Details

- **Chain ID**: 50311 (Testnet), 50312 (Mainnet)
- **RPC**: https://testnet.somnia.network
- **Explorer**: https://testnet.somniaexplorer.com
- **Faucet**: https://faucet.somnia.network

## Next Steps

### Current Status

✅ **Phase 1 Complete**: Smart contract foundation + wallet integration
⏳ **Phase 2 Ready**: Core betting mechanics implementation

### Immediate Priorities (Phase 2.1)

#### 1. Deploy Smart Contracts to Somnia Testnet

```bash
# Using Remix IDE:
1. Open contracts/core/PunctualityCore.sol in Remix
2. Compile with Solidity ^0.8.22
3. Connect MetaMask to Somnia Testnet
4. Deploy with constructor parameters
5. Update src/contracts/addresses.ts with deployed address
```

#### 2. Implement Real Contract Interactions

**Priority Files to Update:**

- `src/hooks/useBetting.ts` - Replace simulated calls with actual contract calls
- `src/contracts/abis/` - Add contract ABIs after deployment
- `src/lib/contracts.ts` - Create contract instance helpers

#### 3. Enhance Watch Page with Betting

**Target:** `src/app/watch/[id]/page.tsx`

- Add BetCard component for viewing active commitments
- Implement betting interface for spectators
- Show real-time bet updates

### Technical Implementation Plan

#### Phase 2.1: Contract Deployment (Week 2, Days 1-2)

```typescript
// Example contract interaction pattern:
const contract = new ethers.Contract(address, abi, signer)
const tx = await contract.createCommitment(...)
await tx.wait()
```

#### Phase 2.2: Social Betting (Week 2, Days 3-5)

- Enhance watch page with betting interface
- Real-time bet notifications via Socket.IO
- Bet history and outcome tracking

#### Phase 2.3: Integration Testing (Week 2, Days 6-7)

- End-to-end testing of staking flow
- Multi-user betting scenarios
- Mobile optimization verification

### Ready Components

**Already Built & Ready:**

- ✅ StakeInput - Stake amount selection
- ✅ BetCard - Betting interface display
- ✅ useBetting - Contract interaction hook (needs real implementation)
- ✅ Enhanced share page with staking flow
- ✅ Wallet integration with Somnia network

**Next to Build:**

- 🔄 Contract deployment scripts
- 🔄 Real contract interactions
- 🔄 Enhanced watch page
- 🔄 Bet outcome resolution

### Success Metrics for Phase 2

- [ ] Smart contracts deployed and verified on Somnia Testnet
- [ ] Real staking transactions working
- [ ] Social betting functional between users
- [ ] Real-time bet updates via WebSocket
- [ ] Mobile-optimized betting interface

## Development Roadmap

### Vision

Transform Runner ETA into a decentralized betting protocol where users stake tokens on punctuality commitments and fitness goals, creating accountability through financial incentives and social betting.

### Core Principles Adherence

- ✅ **ENHANCEMENT FIRST**: Build on existing location tracking, ETA calculation, and real-time infrastructure
- ✅ **AGGRESSIVE CONSOLIDATION**: Move server-side logic to smart contracts, eliminate redundancy
- ✅ **PREVENT BLOAT**: Reuse Socket.IO, maps, UI components, and state management
- ✅ **DRY**: Single source of truth for ETA calculations in smart contracts
- ✅ **CLEAN**: Clear separation: UI ↔ Store ↔ Contract ↔ Oracle
- ✅ **MODULAR**: Composable betting contracts that inherit from core logic
- ✅ **PERFORMANT**: Leverage existing real-time infrastructure and caching
- ✅ **ORGANIZED**: Domain-driven contract structure with predictable file organization

### Phase 1: ENHANCE EXISTING CORE (Week 1-2)

_Foundation: Smart Contracts + Wallet Integration_

**Smart Contract Foundation:**

- Deploy PunctualityCore.sol to Somnia Testnet
- Migrate distance/ETA calculations from client to smart contract
- Create location verification and proof-of-arrival system
- Implement basic staking mechanism for punctuality commitments

**Wallet Integration:**

- Enhance useLocationStore with wallet state management
- Create useWallet hook for MetaMask connection
- Add wallet connection to existing Navigation component
- Integrate wallet state with existing session management

### Phase 2: BETTING MECHANICS (Week 2-3)

_Core Feature: Punctuality Betting_

**Immediate Punctuality Bets:**

- Enhance existing sharing session creation with staking options
- Add betting UI to existing map interface
- Implement real-time bet updates via existing Socket.IO
- Create bet resolution system with location verification

**Social Betting Features:**

- Enhance watch functionality with betting options
- Add friend invitation system to existing sharing
- Implement bet notifications via existing toast system
- Create bet history and outcome tracking

### Phase 3: REPUTATION & PROGRESSIVE GOALS (Week 3-4)

_Advanced Features: Long-term Challenges_

**Reputation System:**

- Create reputation scoring based on historical performance
- Enhance existing user state with reputation tracking
- Implement dynamic odds calculation
- Add reputation display to existing UI components

**Progressive Fitness Goals:**

- Enhance existing plan creation with milestone staking
- Create progressive goal contracts with time-locked stakes
- Implement milestone tracking and partial payouts
- Add goal progress visualization to existing UI

### Technical Architecture

**Smart Contracts (Somnia Network):**

```
contracts/
├── core/
│   ├── PunctualityCore.sol      # Enhanced ETA logic + base betting
│   └── LocationVerifier.sol     # Proof-of-location verification
├── betting/
│   ├── ImmediateBets.sol        # Quick punctuality bets
│   └── ProgressiveGoals.sol     # Long-term fitness challenges
├── reputation/
│   └── ReputationOracle.sol     # User reliability scoring
└── interfaces/
    └── IPunctualityProtocol.sol # Contract interfaces
```

**Enhanced Frontend Structure:**

```
src/
├── stores/
│   ├── locationStore.ts         # ENHANCED: +wallet +stakes
│   ├── bettingStore.ts          # NEW: Betting state management
│   └── reputationStore.ts       # NEW: User reputation
├── contracts/
│   ├── addresses.ts             # Contract addresses by network
│   ├── abis/                    # Contract ABIs
│   └── types.ts                 # Generated contract types
├── hooks/
│   ├── useWallet.ts            # NEW: Wallet connection
│   ├── useBetting.ts           # NEW: Betting operations
│   └── useLocationProof.ts     # ENHANCED: +proof generation
└── components/
    ├── betting/                 # NEW: Betting UI components
    │   ├── StakeInput.tsx
    │   ├── BetCard.tsx
    │   └── BetHistory.tsx
    └── reputation/              # NEW: Reputation displays
        ├── ReputationBadge.tsx
        └── ReputationChart.tsx
```

### Implementation Timeline

**Week 1: Smart Contract Foundation**

- Day 1-2: Create and deploy PunctualityCore.sol
- Day 3-4: Implement wallet integration
- Day 5-7: Basic staking mechanism and testing

**Week 2: Core Betting**

- Day 1-3: Immediate punctuality betting contracts
- Day 4-5: Enhance sharing UI with betting options
- Day 6-7: Social betting features

**Week 3: Advanced Features**

- Day 1-3: Reputation system implementation
- Day 4-5: Progressive goals contracts
- Day 6-7: UI polish and integration testing

**Week 4: Launch Preparation**

- Day 1-3: Performance optimization and bug fixes
- Day 4-5: Mainnet deployment preparation
- Day 6-7: Documentation and demo preparation

### Success Metrics

**Technical Milestones:**

- Smart contracts deployed and verified on Somnia Testnet
- Wallet integration with existing authentication flow
- Real-time betting with location verification
- Social betting features functional
- Reputation-based odds calculation

**User Experience Goals:**

- Seamless transition from existing app to betting features
- Mobile-optimized betting interface
- Clear bet status and outcome notifications
- Intuitive stake amount selection
- Transparent reputation scoring display

### Post-Hackathon Roadmap

**Phase 4: Community Features**

- Group challenges and team betting
- Leaderboards and achievements
- Integration with fitness trackers
- Sponsored challenges from brands

**Phase 5: Advanced DeFi**

- Liquidity pools for bet matching
- Yield farming for consistent performers
- NFT achievements and collectibles
- Cross-chain bridge for broader adoption
