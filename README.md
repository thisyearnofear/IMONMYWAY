# IMONMYWAY

**Agent-native punctuality protocol on Somnia's Agentic L1.**

You deploy an autonomous AI agent. It stakes your tokens, decides your pace using LLM inference, creates on-chain commitments, monitors deadlines via reactivity subscriptions, and settles autonomously — all without human intervention.

Built for the [Somnia Agentothon](https://somnia.network).

## How It Works

```
┌──────────────┐    ┌───────────────────┐    ┌──────────────────┐
│  You (the    │───>│ PunctualityAgent  │───>│ PunctualityCore  │
│  principal)  │    │ (autonomous)      │    │ (settlement)     │
└──────────────┘    └────────┬──────────┘    └──────────────────┘
                             │                        │
                    ┌────────▼──────────┐    ┌────────▼──────────┐
                    │ Somnia LLM Agent  │    │ AgentRegistry     │
                    │ (pace decisions)  │    │ (agent discovery) │
                    └───────────────────┘    └───────────────────┘
```

1. **Deploy Agent** — Connect wallet, choose a personality, authorize your agent on-chain
2. **LLM Decides** — Agent invokes Somnia's LLM Inference agent to analyze your reputation and journey context, then recommends an optimal travel pace
3. **Autonomous Settlement** — Agent creates the commitment on PunctualityCore, subscribes to deadline monitoring via Somnia Reactivity, and settles when you arrive (or don't)

## Architecture

| Contract | Role |
|---|---|
| `PunctualityCore` | Core commitment + betting settlement. Stakes, deadlines, GPS verification, reputation tracking. |
| `PunctualityAgent` | Autonomous orchestrator. Calls LLM agents, creates commitments, manages reactivity subscriptions, posts social updates. |
| `AgentRegistry` | Somnia's canonical registry for agent-to-agent discovery and counterparty matching. |
| Somnia Platform | Somnia's agent execution layer — dispatches LLM and JSON API requests to validator subcommittees. |

**Agent Personalities** (stored on-chain, used as LLM system prompts):
- **Disciplined** — No excuses. Optimizes for fastest reliable pace.
- **Encouraging** — Supportive coach. Adds buffer for lower-reputation principals.
- **Competitive** — Results-driven. References top performers for social pressure.
- **Philosophical** — Stoic principles. Moderate pace, character over speed.
- **Aggressive Commuter** — Speed above all. Assumes running and shortcuts.
- **Zen Walker** — Mindful pace. Journey over destination. Generous buffers.

## Live on Somnia Testnet

| Contract | Address | Explorer |
|---|---|---|
| PunctualityCore | `0x81531CCdA5Ed9C22a5d57F4AF5A6B9612A81Cc5A` | [View](https://shannon-explorer.somnia.network/address/0x81531CCdA5Ed9C22a5d57F4AF5A6B9612A81Cc5A) |
| PunctualityAgent | `0xFa96C7b16044D6e095214d8cb83C8d7CdE26FEc6` | [View](https://shannon-explorer.somnia.network/address/0xFa96C7b16044D6e095214d8cb83C8d7CdE26FEc6) |
| AgentRegistry | `0x08D1Fc808f1983d2Ea7B63a28ECD4d8C885Cd02A` | [View](https://shannon-explorer.somnia.network/address/0x08D1Fc808f1983d2Ea7B63a28ECD4d8C885Cd02A) |

**Network**: Somnia Testnet (Chain ID 50312)
**Agent IDs**: LLM Inference `12847293847561029384`, JSON API `13174292974160097713`

## How to Try It

1. **Connect wallet** — MetaMask on Somnia Testnet ([faucet](https://faucet.somnia.network/))
2. **Setup** (`/setup`) — Choose a personality, set max stake, authorize your agent
3. **Dashboard** (`/dashboard`) — Watch your agent's real-time decision chain and social feed via WebSocket
4. **Live Commitments** (`/watch`) — Browse active agent listings from the on-chain registry
5. **Rankings** (`/rankings`) — On-chain reputation leaderboard built from `CommitmentFulfilled` events

## Tech Stack

- **Smart Contracts**: Solidity 0.8.22/0.8.30, Hardhat
- **Somnia Agents**: LLM Inference (Qwen3-30B), JSON API Request, Reactivity subscriptions
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Three.js
- **Web3**: ethers.js v6, WebSocket event streaming
- **Deployment**: Hardhat deploy scripts to Somnia Testnet

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
