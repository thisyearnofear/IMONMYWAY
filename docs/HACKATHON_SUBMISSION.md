# IMONMYWAY — Somnia Agentothon Submission

## Project Summary

**IMONMYWAY** is an agent-native punctuality protocol where autonomous on-chain agents make, enforce, and settle punctuality commitments between people — no human intervention, no trust required. Built on Somnia's Agentic L1, it demonstrates true agent autonomy: agents reason with LLM inference, discover counterparties via an on-chain registry, react to on-chain events, and settle stakes through smart contracts.

## How It Works

```
User A authorizes agent          User B authorizes agent
         │                                │
         ▼                                ▼
  Agent A creates commitment      Agent B discovers Agent A
  (LLM decides pace/deadline)     (via AgentRegistry)
         │                                │
         ▼                                ▼
  Agent A monitors progress       Agent B monitors Agent A
  (Reactivity: BlockTick)         (Data Streams: GPS)
         │                                │
         ▼                                ▼
  Agent A settles autonomously    Agent B settles bets
  (GPS proof → PunctualityCore)   (LLM verdict → payout)
         │                                │
         ▼                                ▼
  Agent A posts social update     Agent B posts social update
  (LLM generates personality      (LLM generates personality
   text, posted autonomously)      text, posted autonomously)
```

## Somnia Primitives Used

### Somnia Agents (Decentralized Compute Containers)

Our contracts invoke Somnia agents for autonomous reasoning and external data:

| Agent Type | Usage | Cost (per validator) |
|---|---|---|
| **LLM Inference** (`inferNumber`, `inferString`) | Pace/deadline decisions, settlement verdicts, social post generation | 0.07 STT |
| **JSON API** (`fetchUint`, `fetchString`) | Real-time traffic data, weather conditions for ETA adjustment | 0.03 STT |
| **LLM Parse Website** (`ExtractString`) | Reputation signal extraction from public profiles | 0.10 STT |

Agent calls go through Somnia's platform contract (testnet: `0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776`) using `IAgentRequester.createRequest()` with ABI-encoded payloads. Responses delivered via `IAgentRequesterHandler.handleResponse()` callback.

### On-Chain Reactivity

Our `PunctualityAgent` contract subscribes to on-chain events and triggers autonomous actions:

- **`BlockTick`** — periodic deadline monitoring for all active commitments (no off-chain cron needed)
- **`CommitmentCreated`** — triggers agent to begin monitoring a new commitment
- **`CommitmentFulfilled`** — triggers autonomous settlement
- **`AgentListed`** — triggers counterparty agent to evaluate and negotiate

Built using `@somnia-chain/reactivity-contracts` and the `SomniaEventHandler` pattern at precompile `0x0100`.

### Data Streams

GPS location updates published to Somnia Data Streams for high-frequency state that counterparty agents can read without expensive contract storage writes:

```typescript
// Schema: LocationUpdate(address principal, int256 lat, int256 lng, uint256 timestamp, uint8 status)
await sdk.streams.set([{ id: dataId, schemaId, data: encodedLocation }]);
```

### Off-Chain Reactivity SDK

Frontend streams real-time agent activity from on-chain events via WebSocket:

```typescript
const handle = await instance.watch({
  eventContractSources: [PUNCTUALITY_AGENT_ADDRESS],
  topicOverrides: [agentDecisionEventSignature],
  push_changes_only: true,
  onData: (payload) => updateAgentDashboard(payload.result),
});
```

## Technical Architecture

### Smart Contracts

| Contract | Role | Somnia Integration |
|---|---|---|
| `PunctualityCore.sol` | Commitment staking, betting, settlement | Unchanged core logic — agents call its existing functions |
| `PunctualityAgent.sol` | Agent orchestration, autonomous decisions | Implements `IAgentRequesterHandler`, invokes LLM/JSON agents |
| `AgentRegistry.sol` | Agent discovery, counterparty matching | On-chain registry with reactivity subscriptions |

### Agent Decision Flow

1. **Pace Decision** — LLM `inferNumber` agent analyzes reputation history → returns optimal seconds/km
2. **Context Fetch** — JSON API `fetchUint` agent pulls traffic delay from maps API → adjusts deadline
3. **Settlement Verdict** — LLM `inferString` agent evaluates GPS proof + deadline → returns "on_time" / "late"
4. **Social Post** — LLM `inferString` agent generates personality-driven update text → emitted as event

### Consensus & Trust

All agent decisions go through Somnia's validator consensus (default: 3 validators, majority agreement). LLM inference uses deterministic models (fixed temperature/seed) so validators produce identical outputs. This means:
- Agent decisions are **verifiable** — anyone can check the reasoning
- Agent decisions are **trustless** — no single party controls the AI
- Agent decisions are **auditable** — execution receipts available via Somnia receipts API

## Innovation: Agent-to-Agent Composability

The novel element is **two agents negotiating autonomously**:

1. Agent A lists commitment in `AgentRegistry`
2. Agent B discovers Agent A via `findCounterpartyAgent()` (triggered by reactivity `AgentListed` event)
3. Agent B invokes LLM agent to evaluate: "Should my principal accept this commitment? Counterparty reputation = 8200/10000"
4. Agent B calls `acceptProposal()` on Agent A
5. Both agents independently monitor, reason, and settle — never requiring human clicks

This demonstrates **agent composability** — a core Somnia judging criterion — where neither agent operates in isolation.

## Judging Criteria Alignment

### Functionality
- Full commitment lifecycle deployed and running on Somnia testnet (chain 50312)
- Agent creates, monitors, and settles commitments without human intervention
- Error handling for agent failures, timeouts, and consensus failures
- Frontend dashboard shows real-time agent activity

### Agent-First Design
- Agents are the primary actors, not wrappers around a dApp
- `PunctualityAgent` implements `IAgentRequesterHandler` — native Somnia agent pattern
- LLM inference drives autonomous decisions (not hardcoded rules)
- Reactivity subscriptions trigger agent actions (not off-chain polling)
- Data Streams enable agent-to-agent state sharing

### Innovation & Technical Creativity
- Agent-to-agent punctuality negotiation is a novel use of Somnia composability
- LLM inference for real-world commitment terms (not toy examples)
- On-chain reactivity for deadline monitoring replaces traditional cron/oracle patterns
- Data Streams for high-frequency GPS state (avoids expensive contract storage)

### Autonomous Performance
- Zero human interaction after initial agent authorization
- Agents run independently via reactivity subscriptions and scheduled checks
- Settlement happens autonomously on arrival or deadline expiry
- System maintains stability: handles timeouts, refunds unused gas, manages agent budgets

## Demo Highlights

1. **Agent Setup** (30s): User authorizes agent, sets max stake and personality — one transaction
2. **Autonomous Creation** (30s): Agent invokes LLM to decide pace, creates commitment — no clicks
3. **Agent-to-Agent** (60s): Two agents discover each other, negotiate terms via LLM reasoning
4. **Live Monitoring** (60s): Dashboard shows agent decisions, GPS tracking, social posts in real-time
5. **Autonomous Settlement** (30s): Agent settles on arrival, posts results, updates reputation
6. **Architecture** (30s): Somnia primitives used, agent flow diagram, gas cost breakdown

## Links

- **Live Demo**: https://imonmyway.netlify.app
- **GitHub**: [Repository]
- **Smart Contracts**: [Somnia Testnet Explorer]
- **Agent Portal**: https://agents.testnet.somnia.network
- **Documentation**: See `docs/` directory

## Team

Built for the Somnia Agentothon — demonstrating that autonomous agents can solve real coordination problems, not just automate toy workflows.
