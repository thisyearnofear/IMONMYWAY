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

## Core Principles Implementation

- **ENHANCEMENT FIRST**: Built on existing location tracking
- **DRY**: Single ETA calculation in smart contract
- **CLEAN**: Clear UI ↔ Store ↔ Contract separation
- **MODULAR**: Composable betting components
- **PERFORMANT**: Hardware-accelerated animations

## Data Flow

1. User creates commitment → Smart contract
2. Location updates → Socket.IO → Real-time UI
3. Betting actions → Contract interactions
4. Reputation updates → On-chain scoring

## Implementation Status

### Phase 1 Complete: Smart Contract Foundation & Wallet Integration

**Smart Contracts Created:**

- PunctualityCore.sol - Core betting logic with ETA calculations
- IPunctualityProtocol.sol - Interface definitions
- Contract addresses configuration

**Enhanced Frontend Infrastructure:**

- useWallet hook - MetaMask integration with Somnia Testnet support
- Enhanced locationStore - Added Web3 state management
- bettingStore - New store for betting operations
- useBetting hook - Contract interaction interface

**UI Components:**

- Enhanced Navigation - Wallet connection with network switching
- StakeInput component - Stake amount selection
- BetCard component - Display and interact with active bets

**Key Features:**

1. Wallet Connection: MetaMask integration with automatic Somnia Testnet detection
2. Network Management: Automatic network switching
3. State Management: Enhanced stores with Web3 integration
4. Betting Infrastructure: Foundation for creating and managing bets

### Real Blockchain Integration

**Contract Address**: 0x41f2fA6E60A34c26BD2C467d21EcB0a2f9087B03
**Network**: Somnia Mainnet (Chain ID: 50312)
**Status**: LIVE and Ready

**Enhanced Components:**

- ENHANCEMENT FIRST: Built on existing location tracking infrastructure
- DRY: Single contract ABI and network configuration
- CLEAN: Clear separation between contract layer, hooks, and UI
- MODULAR: Composable contract interactions

**Key Integrations:**

- createCommitment() → Actual smart contract deployment
- placeBet() → Real token transactions
- fulfillCommitment() → Blockchain-verified outcomes
- getUserReputation() → On-chain reputation scoring

## Code Cleanup & Consolidation

**AGGRESSIVE CONSOLIDATION:**

- Removed duplicate contract files, unused scripts
- Single source of truth for all contract interactions

**PREVENT BLOAT:**

- Streamlined file structure
- Consolidated network configurations
- Removed hardhat dependencies

**ORGANIZED Structure:**

```
src/
├── lib/contracts.ts          # Single contract integration
├── contracts/addresses.ts    # Network configuration
├── hooks/useBetting.ts       # Enhanced with real calls
└── hooks/useWallet.ts        # Somnia network integration
```

## Key Components

- **Wallet Integration**: MetaMask + Somnia network
- **Real-time Tracking**: GPS + WebSocket updates
- **Betting System**: Stake management + social betting
- **Reputation**: On-chain reliability scoring

## Ready for Live Testing

**Real Functionality Available:**

1. Staked Commitments: Real token staking on Somnia
2. Social Betting: Actual blockchain bets between users
3. Reputation System: On-chain reliability scoring
4. Automatic Payouts: Smart contract-verified outcomes

**User Flow:**

1. Connect MetaMask → Somnia Network
2. Create commitment → Real blockchain transaction
3. Share link → Others place real bets
4. Arrive on time → Automatic smart contract payout

**Integration Summary:**

- Build Status: ✅ Successful
- Contract Integration: ✅ Real blockchain calls
- Network Configuration: ✅ Somnia Mainnet ready
- Code Quality: ✅ Follows all core principles
- User Experience: ✅ Seamless Web3 integration
