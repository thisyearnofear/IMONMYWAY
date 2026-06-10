# IMONMYWAY

**No server. No keeper. No cron. Just the chain.**

[![Watch the Demo](https://img.shields.io/badge/Watch-Demo-gold?style=for-the-badge)]()
[![Live Dashboard](https://img.shields.io/badge/Live-Dashboard-violet?style=for-the-badge)](https://imonmyway.netlify.app/dashboard)
[![Explorer](https://img.shields.io/badge/Explorer-5%20Txns-blue?style=for-the-badge)](explorer-urls-demo-video.txt)

An autonomous agent framework where Somnia Reactivity subscriptions wake the contract — no off-chain infrastructure needed. Punctuality commitments are the first proof of concept, but the architectural pattern generalizes to any time-bound autonomous contract: liquidations, automated market makers, bounty escrows, subscription renewals.

The chain is the runtime. Built for the [Somnia Agentothon](https://somnia.network).

---

## 📺 Demo Video (2 min)

**[▶ Watch on YouTube]()** — Walkthrough of the proven on-chain autonomy loop.

The video shows 5 real explorer transactions proving the agent:
1. **Deploy** — Contract deployed, 0 infrastructure needed
2. **Subscribe** — Reactivity subscription activated
3. **Authorize** — Deployer authorized
4. **Initiate** — Agent calls Somnia's LLM agent (Qwen3-30B)
5. **Callback** — LLM responds on-chain → `AgentCreatedCommitment` emitted

No server, no cron, no keeper touched any of these transactions.

---

## Why This Matters

Smart contracts can't fetch APIs or run AI. For a decade the fix was **oracles** — bolt a centralized service onto a trustless contract. IMONMYWAY uses **Somnia Agents** instead: validator-verified, consensus-checked LLM inference and API calls, all on-chain. The contract calls the agent like any other contract, gets the result back via callback, and acts on it — no oracle, no keeper, no cron.

---

## Reliability Architecture: The Escalation Ladder

```
Layer 1  On-chain Reactivity (Schedule subscription)
         Contract wakes itself at deadline. Zero infrastructure.
         → Unreliable on prototype testnet; designed for mainnet stability.

Layer 2  Permissionless settleCommitment()
         Anyone can settle any past-deadline commitment. Gas ≈ $0.001.
         → No authorization, no reward needed. Opportunistic keepers.

Layer 3  Auto-retry + Off-chain Poller
         Contract retries LLM calls up to 3x on Failure/TimedOut.
         Poller (scripts/settlement-poller.cjs) for free-tier servers.
```

The chain is the runtime. Layer 1 alone suffices on mainnet. Layers 2 + 3 are defence-in-depth.

---

## Proven On-Chain (Somnia Testnet)

| # | Step | Explorer Link |
|---|---|---|
| 1 | **Deploy** | [View](https://shannon-explorer.somnia.network/tx/0xca0303d7a34803aa2c62eb137471f382b2f088ed00635c1ce94e42727b99002c) |
| 2 | **Subscribe** | [View](https://shannon-explorer.somnia.network/tx/0xde2d9b8c579384aad8aa028731144c1e20204b8c7902975859749d6cf2a7109a) |
| 3 | **Authorize** | [View](https://shannon-explorer.somnia.network/tx/0x404cd3e228376fd2c81606a7278a5070cf6a0fe7cb269ed23f7f4f61b497353b) |
| 4 | **Initiate Commitment** | [View](https://shannon-explorer.somnia.network/tx/0x17e4d2e3f9c568413366f7b1bfcff3880bc6001fe7d87a74e3b89ec445e0a1fe) |
| 5 | **LLM Callback** | [View](https://shannon-explorer.somnia.network/tx/0xdd15a03d3a42161a6c5a0d2e15f3e75311c95ae0e5e5385e904b719331f27f79) |

Agent contract: [`0x24D16d61...`](https://shannon-explorer.somnia.network/address/0x24D16d61De02c29706c51C7a473410a88BF44663)

---

## Architecture

| Contract | Role |
|---|---|
| `PunctualityCore` | Settlement contract — stakes, deadlines, GPS verification, reputation tracking. Example use case. |
| `PunctualityAgent` | Autonomous orchestrator. Calls LLM agents, creates commitments, manages self-settlement. **The reusable pattern.** |
| `AgentRegistry` | Somnia's canonical registry for agent discovery and counterparty matching. |
| Somnia Platform | Agent execution layer — dispatches LLM and JSON API requests to validator subcommittees. |

**Agent Personalities** (on-chain system prompts for LLM pace decisions):
- **Disciplined** / **Encouraging** / **Competitive** / **Philosophical** / **Aggressive Commuter** / **Zen Walker**

---

## Live on Somnia Testnet

| Contract | Address | Explorer |
|---|---|---|
| PunctualityCore | `0x6Ba7C599F33fCBe1A9a5848FDE4D4EFA495A25c9` | [View](https://shannon-explorer.somnia.network/address/0x6Ba7C599F33fCBe1A9a5848FDE4D4EFA495A25c9) |
| PunctualityAgent | `0x24D16d61De02c29706c51C7a473410a88BF44663` | [View](https://shannon-explorer.somnia.network/address/0x24D16d61De02c29706c51C7a473410a88BF44663) |
| AgentRegistry | `0x81F47d5BD7A79d75ee7d20F5a2cfcfDaf9d05775` | [View](https://shannon-explorer.somnia.network/address/0x81F47d5BD7A79d75ee7d20F5a2cfcfDaf9d05775) |

**Network**: Somnia Testnet (Chain ID 50312)
**Agent IDs**: LLM Inference `12847293847561029384`, JSON API `13174292974160097713`

---

## How to Try It

1. **Spectator mode** — [`/dashboard`](https://imonmyway.netlify.app/dashboard) — watch live on-chain agent activity. No wallet needed.
2. **Connect wallet** — MetaMask on Somnia Testnet ([faucet](https://faucet.somnia.network/))
3. **Setup** — [`/setup`](https://imonmyway.netlify.app/setup) — choose a personality, set max stake, fund the agent
4. **Watch settleCommitment** — If deadline passes without on-chain reactivity, anyone can call `settleCommitment(id)` to trigger settlement. Permissionless, gas ≈ $0.001.

### Run the Off-Chain Poller (optional, for demo reliability)

```bash
cp .env.example .env.local   # Add PRIVATE_KEY + AGENT address
node scripts/settlement-poller.cjs
```

Runs on any free-tier server (Render, Railway, fly.io). Polls every 30s, settles anything past deadline.

---

## Tech Stack

- **Smart Contracts**: Solidity 0.8.22/0.8.30, Hardhat
- **Somnia Agents**: LLM Inference (Qwen3-30B), JSON API Request, Reactivity subscriptions
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Three.js
- **Web3**: ethers.js v6, WebSocket event streaming (no backend server)
- **Deployment**: Hardhat deploy scripts → Somnia Testnet
- **Zero Infrastructure**: No cron, no keeper bot, no backend server — the chain is the runtime

---

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

---

## License

MIT
