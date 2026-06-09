# IMONMYWAY Project Overview

## Vision & Purpose

IMONMYWAY is the first **agent-native punctuality protocol** — autonomous on-chain agents that make, monitor, enforce, and settle punctuality commitments on behalf of their principals, using Somnia's Agentic L1 infrastructure. No human intervention after setup. No trust required. Agents reason using LLM inference, discover each other via an on-chain registry, and settle stakes autonomously.

## Core Innovation: Autonomous Punctuality Agents

### The Problem
- People are late because they choose to be, not because they lack information
- Existing commitment apps (Beeminder, StickK) require constant human engagement
- Blockchain commitment contracts exist but still need humans to click buttons
- No system lets autonomous agents negotiate punctuality terms on your behalf

### Our Solution
Users deploy a personal on-chain agent that:
1. **Creates commitments autonomously** — LLM agent decides optimal pace and deadline based on on-chain reputation history and real-time context
2. **Discovers counterparty agents** — on-chain registry enables agent-to-agent discovery and negotiation
3. **Monitors progress** — Somnia reactivity (BlockTick subscriptions) triggers periodic GPS/deadline checks without off-chain watchers
4. **Negotiates terms** — agent-to-agent LLM inference for accepting, rejecting, or countering proposals
5. **Settles stakes** — autonomous fulfillment and payout via `PunctualityCore` smart contract
6. **Posts social updates** — LLM agent generates personality-driven social posts at key moments

```
┌─────────────────────────────────────────────────────────┐
│                    SOMNIA ON-CHAIN                       │
│                                                          │
│  PunctualityCore ◄──► PunctualityAgent ◄──► AgentRegistry│
│  (staking/settle)     (IAgentRequester     (discovery)   │
│                        Handler)                          │
│        ▲                     │              │            │
│        │              ┌──────▼──────┐       │            │
│        │              │ LLM Inference│       │            │
│        │              │ Agent        │       │            │
│        │              │ (reasoning)  │       │            │
│        │              └─────────────┘       │            │
│        │              ┌──────────────┐       │            │
│        │              │ JSON API     │       │            │
│  ┌─────┴──────┐      │ Agent        │  ┌────┴───────┐   │
│  │ Reactivity │      │ (traffic/    │  │ Data       │   │
│  │ (BlockTick,│      │  weather)    │  │ Streams    │   │
│  │  events)   │      └──────────────┘  │ (GPS state)│   │
│  └────────────┘                         └────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Key Differentiators
1. **Agent-Native**: Built on Somnia's `IAgentRequester` / `IAgentRequesterHandler` pattern — agents are first-class actors, not wrappers around a dApp
2. **Agent-to-Agent Composability**: Two people's agents literally negotiate punctuality terms on-chain
3. **On-Chain Reasoning**: LLM inference agent produces deterministic, consensus-verified decisions
4. **Reactivity-Driven**: No off-chain cron jobs — `BlockTick` subscriptions and event filters trigger autonomous actions
5. **External Context**: JSON API agent fetches real-time traffic/weather to inform deadline decisions

## Somnia Primitives Used

| Primitive | Usage |
|---|---|
| **Somnia Agents** (LLM Inference) | Pace decisions, settlement verdicts, social post generation |
| **Somnia Agents** (JSON API) | Traffic data, weather context for ETA adjustment |
| **Somnia Agents** (LLM Parse Website) | Reputation signal extraction from public profiles |
| **On-Chain Reactivity** | `BlockTick` subscriptions for deadline monitoring, event subscriptions for commitment lifecycle |
| **Off-Chain Reactivity SDK** | Real-time frontend event streaming from on-chain agent activity |
| **Data Streams** | GPS location publishing for high-frequency state updates |
| **Platform Contract** | Testnet: `0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776` |

## Technology Stack

```
Smart Contracts: Solidity ^0.8.22 (Hardhat)
Agent Integration: Somnia IAgentRequester/Handler, @somnia-chain/reactivity-contracts
Frontend: Next.js 14 + React 18 + TypeScript
State Management: Zustand stores
Styling: Tailwind CSS + Framer Motion
Real-time: Somnia Off-Chain Reactivity SDK + Socket.IO
Database: PostgreSQL + Prisma ORM (agent state cache)
Blockchain: Somnia Testnet (chain 50312) + Ethers.js/viem
Off-Chain AI: Venice AI (supplemental reasoning, dashboard enrichment)
Performance: Adaptive loading + smart caching
```

## User Experience Flow

### Agent Setup (one-time, ~60 seconds)
1. Connect wallet to Somnia testnet
2. Authorize agent with parameters: max stake, min reputation, auto-accept preferences, personality
3. Fund agent with STT for gas + agent call costs
4. Done — agent operates autonomously from this point

### Autonomous Commitment Lifecycle (zero human interaction)
1. **Agent detects need** — user tells agent about upcoming meeting (or agent reads calendar)
2. **Agent reasons** — LLM inference agent analyzes reputation + context → recommends pace/deadline
3. **Agent fetches context** — JSON API agent pulls traffic/weather data for route
4. **Agent creates commitment** — calls `PunctualityCore.createCommitment()` with AI-decided parameters
5. **Agent lists in registry** — counterparty agent can discover and negotiate
6. **Agent monitors** — reactivity BlockTick subscription triggers periodic status checks
7. **Agent posts updates** — LLM generates social posts at milestones (en route, halfway, arrived)
8. **Agent settles** — on arrival: calls `fulfillCommitment()` with GPS proof. On expiry: triggers settlement
9. **Agent reports** — posts outcome, updates reputation, ready for next commitment

### Spectator Dashboard
- Real-time agent decision timeline with LLM reasoning chains
- Live GPS visualization with agent status annotations
- Agent-to-agent message feed
- Betting activity (agent-placed bets with reasoning)
- Agent-generated social posts

## Architecture Principles

Following our **Core Principles** (see `CORE_PRINCIPLES.md`):

- **ENHANCEMENT FIRST**: `PunctualityCore.sol` unchanged — agent layer sits on top
- **CONSOLIDATION**: UI components consolidated (4 betting → 1, 3 status → 1, 2 social → 1)
- **PREVENT BLOAT**: Removed 3D graphics, achievements, complex onboarding — focused on agent demo
- **DRY**: Agent reasoning centralized in `PunctualityAgent.sol`; off-chain AI supplements
- **CLEAN**: On-chain agents handle autonomy, off-chain services handle enrichment, frontend handles visualization
- **MODULAR**: `PunctualityAgent` communicates with `PunctualityCore` via interface — swappable
- **PERFORMANT**: On-chain reactivity replaces polling; Data Streams replace expensive storage writes
- **ORGANIZED**: Domain-driven structure — `contracts/agents/`, `src/components/agent/`

## Hackathon Submission: Somnia Agentothon

See `AGENT_PIVOT_PLAN.md` for detailed implementation plan, week-by-week breakdown, code examples, and success criteria.

### Judging Criteria Alignment

| Criterion | Demonstration |
|---|---|
| **Functionality** | Full autonomous commitment lifecycle on Somnia testnet |
| **Agent-First Design** | Agents use `IAgentRequester` for LLM/API calls, `IAgentRequesterHandler` for callbacks, reactivity for autonomous triggers |
| **Innovation** | Agent-to-agent punctuality negotiation — novel use of composability |
| **Autonomous Performance** | Zero human interaction after agent setup — agents run independently |
