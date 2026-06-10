# IMONMYWAY

**No server. No keeper. No cron. Just the chain.**

An autonomous agent framework where Somnia Reactivity subscriptions wake the contract — no off-chain infrastructure needed. Punctuality commitments are the first proof of concept, but the architectural pattern generalizes to any time-bound autonomous contract: liquidations, automated market makers, bounty escrows, subscription renewals.

The chain is the runtime. Built for the [Somnia Agentothon](https://somnia.network).

## Core Insight

Most "autonomous" contracts rely on off-chain bots, keepers, or cron jobs. IMONMYWAY uses **Somnia Reactivity** — on-chain event subscriptions — so the contract wakes itself. When a new agent is registered, the agent contract is notified immediately. When a deadline fires, settlement triggers automatically. No server runs the loop.

```
┌──────────────┐    ┌───────────────────┐    ┌──────────────────┐
│  On-Chain    │───>│ PunctualityAgent  │───>│ PunctualityCore  │
│  Event       │    │ (wakes itself)    │    │ (settlement)     │
└──────────────┘    └────────┬──────────┘    └──────────────────┘
                             │                        │
                    ┌────────▼──────────┐    ┌────────▼──────────┐
                    │ Somnia LLM Agent  │    │ AgentRegistry     │
                    │ (pace decisions)  │    │ (agent discovery) │
                    └───────────────────┘    └───────────────────┘
```

1. **Deploy Agent** — Connect wallet, choose a personality, fund with STT
2. **Events Wake the Agent** — When `AgentListed` fires on the registry, the reactivity subscription triggers `_handleRegistryEvent`, which evaluates the counterparty and sends a proposal
3. **On-Chain Settlement** — The agent creates a commitment on PunctualityCore, subscribes to deadline events, and settles when conditions are met — all without human intervention

## Architecture

| Contract | Role |
|---|---|
| `PunctualityCore` | Settlement contract — stakes, deadlines, GPS verification, reputation tracking. Example use case. |
| `PunctualityAgent` | Autonomous orchestrator. Reacts to on-chain events, calls LLM agents, creates commitments, manages subscriptions. The pattern. |
| `AgentRegistry` | Somnia's canonical registry for agent-to-agent discovery and counterparty matching. |
| Somnia Platform | Somnia's agent execution layer — dispatches LLM and JSON API requests to validator subcommittees. |

**Proof of Concept: Agent Personalities** (stored on-chain, used as LLM system prompts for punctuality commitments):
- **Disciplined** — No excuses. Optimizes for fastest reliable pace.
- **Encouraging** — Supportive coach. Adds buffer for lower-reputation principals.
- **Competitive** — Results-driven. References top performers for social pressure.
- **Philosophical** — Stoic principles. Moderate pace, character over speed.
- **Aggressive Commuter** — Speed above all. Assumes running and shortcuts.
- **Zen Walker** — Mindful pace. Journey over destination. Generous buffers.

## Live on Somnia Testnet

| Contract | Address | Explorer |
|---|---|---|
| PunctualityCore | `0x6Ba7C599F33fCBe1A9a5848FDE4D4EFA495A25c9` | [View](https://shannon-explorer.somnia.network/address/0x6Ba7C599F33fCBe1A9a5848FDE4D4EFA495A25c9) |
| PunctualityAgent | `0xb2ae53E6F7C4F1F965B19741CB8E6Ac46Dd2392a` | [View](https://shannon-explorer.somnia.network/address/0xb2ae53E6F7C4F1F965B19741CB8E6Ac46Dd2392a) |
| AgentRegistry | `0x81F47d5BD7A79d75ee7d20F5a2cfcfDaf9d05775` | [View](https://shannon-explorer.somnia.network/address/0x81F47d5BD7A79d75ee7d20F5a2cfcfDaf9d05775) |

**Network**: Somnia Testnet (Chain ID 50312)
**Agent IDs**: LLM Inference `12847293847561029384`, JSON API `13174292974160097713`
**Reactivity Subscription**: `5982115` — agent auto-wakes on `AgentListed` events

## How to Try It

1. **Connect wallet** — MetaMask on Somnia Testnet ([faucet](https://faucet.somnia.network/))
2. **Setup** (`/setup`) — Choose a personality, set max stake, fund the agent
3. **Dashboard** (`/dashboard`) — Watch the autonomous lifecycle: event subscription fires, agent proposes, counterparty negotiates, deadline settles — all via WebSocket
4. **Live Commitments** (`/watch`) — Browse active agent listings from the on-chain registry
5. **Rankings** (`/rankings`) — On-chain reputation leaderboard built from `CommitmentFulfilled` events

## Tech Stack

- **Smart Contracts**: Solidity 0.8.22/0.8.30, Hardhat
- **Somnia Agents**: LLM Inference (Qwen3-30B), JSON API Request, Reactivity subscriptions
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Three.js
- **Web3**: ethers.js v6, WebSocket event streaming (no backend server — reads are raw JSON-RPC)
- **Deployment**: Hardhat deploy scripts to Somnia Testnet
- **Zero Infrastructure**: No cron, no keeper bot, no backend server — the chain is the runtime

## Local Development

```bash
npm install
cp .env.example .env.local   # Add your DEPLOYER_PRIVATE_KEY
npm run dev                  # http://localhost:3000
```

### Compile & Deploy Contracts

```bash
npx hardhat compile
npx hardhat run scripts/deploy-agents.cjs --network somniaTestnet
```

## License

MIT
