# IMONMYWAY

**No server. No keeper. No cron. Just the chain.**

An autonomous agent framework where Somnia Reactivity subscriptions wake the contract — no off-chain infrastructure needed. Punctuality commitments are the first proof of concept, but the architectural pattern generalizes to any time-bound autonomous contract: liquidations, automated market makers, bounty escrows, subscription renewals.

The chain is the runtime. Built for the [Somnia Agentothon](https://somnia.network).

## Why This Matters

Smart contracts can't fetch APIs or run AI. For a decade the fix was **oracles** — bolt a centralized service onto a trustless contract. IMONMYWAY uses **Somnia Agents** instead: validator-verified, consensus-checked LLM inference and API calls, all on-chain. The contract calls the agent like any other contract, gets the result back via callback, and acts on it — no oracle, no keeper, no cron.

## Reliability Architecture: The Escalation Ladder

```
Layer 1  On-chain Reactivity (Schedule subscription)
         Contract wakes itself at deadline. Zero infrastructure.
         → Unreliable on prototype testnet; designed for mainnet stability.

Layer 2  Permissionless settleCommitment()
         Anyone can settle any past-deadline commitment. Gas ≈ $0.001.
         → No authorization, no reward needed. Opportunistic keepers.

Layer 3  Off-chain Poller (optional, for demo reliability)
         Free-tier server polls every 30s, settles anything past deadline.
         → scripts/settlement-poller.cjs — deploy in 5 minutes.
```

The chain is the runtime. Layer 1 alone suffices on mainnet. Layers 2 + 3 are defence-in-depth for the Agentothon demo period.

## Proving the Autonomy Loop

The agent was deployed on Somnia Testnet and executed its full lifecycle autonomously:

1. **Deploy** — Agent registered on-chain
2. **Subscribe** — Agent subscribes to reactivity events
3. **Authorize** — Deployer authorized to trigger commitments
4. **Initiate** — Agent calls Somnia's LLM agent (Qwen3-30B) for a pace decision
5. **Callback** — LLM responds on-chain with pace=200s/km → `AgentCreatedCommitment` emitted

[5 explorer transactions proving the loop](explorer-urls-demo-video.txt)

No server touched any of these. No cron job fired. The chain ran the entire loop.

## Architecture

| Contract | Role |
|---|---|
| `PunctualityCore` | Settlement contract — stakes, deadlines, GPS verification, reputation tracking. Example use case. |
| `PunctualityAgent` | Autonomous orchestrator. Calls LLM agents, creates commitments, manages self-settlement. **The reusable pattern.** |
| `AgentRegistry` | Somnia's canonical registry for agent discovery and counterparty matching. |
| Somnia Platform | Agent execution layer — dispatches LLM and JSON API requests to validator subcommittees. |

**Agent Personalities** (on-chain system prompts for LLM pace decisions):
- **Disciplined** / **Encouraging** / **Competitive** / **Philosophical** / **Aggressive Commuter** / **Zen Walker**

## Live on Somnia Testnet

| Contract | Address | Explorer |
|---|---|---|
| PunctualityCore | `0x6Ba7C599F33fCBe1A9a5848FDE4D4EFA495A25c9` | [View](https://shannon-explorer.somnia.network/address/0x6Ba7C599F33fCBe1A9a5848FDE4D4EFA495A25c9) |
| PunctualityAgent | `0x24D16d61De02c29706c51C7a473410a88BF44663` | [View](https://shannon-explorer.somnia.network/address/0x24D16d61De02c29706c51C7a473410a88BF44663) |
| AgentRegistry | `0x81F47d5BD7A79d75ee7d20F5a2cfcfDaf9d05775` | [View](https://shannon-explorer.somnia.network/address/0x81F47d5BD7A79d75ee7d20F5a2cfcfDaf9d05775) |

**Network**: Somnia Testnet (Chain ID 50312)
**Agent IDs**: LLM Inference `12847293847561029384`, JSON API `13174292974160097713`

## How to Try It

1. **Spectator mode** (`/dashboard`) — Watch live on-chain agent activity. No wallet needed.
2. **Connect wallet** — MetaMask on Somnia Testnet ([faucet](https://faucet.somnia.network/))
3. **Setup** (`/setup`) — Choose a personality, set max stake, fund the agent
4. **Watch settleCommitment** — If deadline passes without on-chain reactivity, anyone can call `settleCommitment(id)` to trigger settlement. Permissionless, gas ≈ $0.001.

### Run the Off-Chain Poller (optional, for demo reliability)

```bash
cp .env.example .env.local   # Add PRIVATE_KEY + AGENT address
node scripts/settlement-poller.cjs
```

Runs on any free-tier server (Render, Railway, fly.io). Polls every 30s, settles anything past deadline.

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
