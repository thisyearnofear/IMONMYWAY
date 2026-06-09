# IMONMYWAY — Agent-Native Pivot: Implementation Plan

## The Thesis

IMONMYWAY deploys autonomous on-chain agents that make, monitor, enforce, and settle punctuality commitments between people — no human intervention after setup, no trust required. Agents talk to each other on Somnia, reason using LLM inference, and settle stakes autonomously via the existing `PunctualityCore` contract.

## How This Maps to Somnia Agentothon Criteria

| Judging Criterion | How IMONMYWAY Demonstrates It |
|---|---|
| **Functionality** | Working prototype: agent creates commitment, monitors GPS, settles stake autonomously |
| **Agent-First Design** | Agents invoke each other via `IAgentRequester`, use LLM inference for decisions, react to on-chain events |
| **Innovation & Technical Creativity** | Agent-to-agent punctuality negotiation using Somnia reactivity + LLM agents + data streams |
| **Autonomous Performance** | Full commitment lifecycle runs without human clicks: create → monitor → negotiate → settle |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SOMNIA ON-CHAIN                             │
│                                                                     │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────┐  │
│  │ PunctualityCore  │◄──►│  AgentRegistry   │◄──►│ Data Streams │  │
│  │ (staking/settle) │    │ (discovery/nego) │    │ (GPS/state)  │  │
│  └────────┬─────────┘    └────────┬─────────┘    └──────────────┘  │
│           │                       │                                  │
│  ┌────────▼───────────────────────▼──────────────────────────────┐  │
│  │              Somnia Reactivity Layer                           │  │
│  │  (on-chain subscriptions → _onEvent callbacks)                │  │
│  └────────┬──────────────────────┬──────────────────────────────┘  │
│           │                       │                                  │
│  ┌────────▼─────────┐   ┌────────▼────────────────────────────┐   │
│  │  LLM Inference   │   │  JSON API Agent                     │   │
│  │  Agent (reason)  │   │  (fetch traffic/weather/context)    │   │
│  └──────────────────┘   └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     OFF-CHAIN / FRONTEND                            │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Agent Dashboard  │  │  Off-Chain       │  │  Venice AI       │  │
│  │  (spectator UI)  │  │  Reactivity SDK  │  │  (rich reasoning │  │
│  │  Next.js 14      │  │  (WebSocket      │  │   supplement)    │  │
│  │                  │  │   event stream)  │  │                  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Somnia Primitives We Use

### 1. Somnia Agents (Decentralized Compute Containers)

Somnia agents are sandboxed compute containers invoked asynchronously from smart contracts. Validators execute them independently, reach consensus on the result, and deliver it via a callback to our contract.

**Base agents we use:**

| Agent | Agent ID (testnet) | Purpose in IMONMYWAY |
|---|---|---|
| LLM Inference | Registered via portal | Agent reasoning: should I accept this deadline? Is the other party trustworthy? Generate social update text. |
| JSON API Request | `12345678901234567890` (register via portal) | Fetch external context: traffic data, weather, distance calculations for route ETA |
| LLM Parse Website | `12875401142070969085` | Parse public commitment pages, social profiles for reputation signals |

**Platform contracts:**
- Testnet (chain 50312): `0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776`
- Mainnet (chain 5031): `0x5E5205CF39E766118C01636bED000A54D93163E6`

**Cost structure per agent call:**
- JSON API fetch: 0.03 STT per validator
- LLM inference: 0.07 STT per validator
- Parse website: 0.10 STT per validator
- Default subcommittee: 3 validators
- Formula: `deposit = platformFloor + (perAgentCost × subcommitteeSize)`

### 2. On-Chain Reactivity

Reactivity lets our contract automatically respond to on-chain events without off-chain watchers. We subscribe to event signatures and get `_onEvent` callbacks.

**Key subscriptions:**
- `CommitmentCreated` → trigger agent to begin monitoring
- `CommitmentFulfilled` → trigger settlement agent
- `BetPlaced` → trigger odds recalculation agent
- `BlockTick` → periodic deadline checks for active commitments
- `Schedule(timestamp)` → deadline expiry triggers

**Precompile address:** `0x0100`

**Package:** `@somnia-chain/reactivity-contracts`

### 3. Off-Chain Reactivity (WebSocket SDK)

For the frontend spectator dashboard, we use the Somnia reactivity SDK to stream real-time updates from on-chain events.

**Package:** `@somnia-chain/reactivity`

### 4. Data Streams

For publishing GPS location updates and agent state as structured on-chain data that other agents can read.

**Use case:** Agent A publishes location updates to a data stream. Agent B subscribes to that stream to monitor Agent A's principal's progress toward the destination.

---

## Component Mapping: What Exists → What It Becomes

### Smart Contracts

| Existing | Agent-Native Role | Change Required |
|---|---|---|
| `PunctualityCore.sol` | Settlement layer (unchanged core logic) | Add `IAgentRequester` integration: agent-triggered `createCommitment`, `placeBet`, `fulfillCommitment` |
| `IPunctualityProtocol.sol` | Interface for agent callers | Add agent-specific function signatures and events |
| (new) | `AgentRegistry.sol` | On-chain registry where agents publish their commitment IDs for counterparty discovery |
| (new) | `PunctualityAgent.sol` | Implements `IAgentRequesterHandler` — receives agent responses, acts on LLM decisions |

### AI / Reasoning Layer

| Existing | Agent-Native Role | Change Required |
|---|---|---|
| `src/lib/ai-service.ts` | Agent decision engine (repurposed) | Extract reasoning logic into Solidity LLM agent payloads; keep TypeScript version for off-chain supplement |
| `src/lib/ai-commitment-engine.ts` | Agent planning module | Port `generateSuggestion` logic to on-chain LLM inference agent calls |
| `src/app/api/ai/route.ts` | Off-chain AI supplement | Keep as fallback / richer reasoning when on-chain LLM is too constrained |
| `src/app/api/ai/reputation/route.ts` | Reputation analysis | Port to on-chain JSON API agent (fetch reputation from registry) |
| `src/lib/venice-client.ts` | Venice AI client | Keep for off-chain enhancement, not primary agent path |

### Real-Time / Data Layer

| Existing | Agent-Native Role | Change Required |
|---|---|---|
| `src/lib/realtime-service.ts` | Agent event bus | Add Somnia reactivity subscriptions alongside Socket.IO |
| `src/lib/socket.ts` | Off-chain WebSocket | Keep for frontend; add Somnia off-chain reactivity SDK for on-chain events |
| `prisma/schema.prisma` | Agent memory/state cache | Add `AgentSession` model for tracking active agent instances |
| `src/lib/db-service.ts` | Agent state persistence | Add agent CRUD methods |

### UI Layer

| Existing | Agent-Native Role | Change Required |
|---|---|---|
| `src/app/watch/[id]/page.tsx` | Agent activity spectator view | Enhance: show agent decisions, agent-to-agent messages, autonomous actions |
| `src/components/tracking/InteractiveJourneyTracker.tsx` | Agent sensor visualization | Enhance: show what the agent sees (GPS, ETA, risk assessment) |
| `src/components/tracking/LiveLocationTracker.tsx` | Agent location feed | Keep — agent reads from same data |
| `src/components/dashboard/ProgressDashboard.tsx` | Agent status dashboard | Enhance: show agent reasoning, confidence, next planned action |
| `src/components/ai/SmartBettingInterface.tsx` | Agent betting decisions view | Enhance: show why agent bet, AI reasoning chain |
| `src/components/social/SocialBettingFeed.tsx` | Agent social output | Enhance: show agent-generated social posts |
| `src/app/create/page.tsx` | Agent setup wizard | Simplify: user configures agent parameters, agent handles the rest |

### What Consolidates

Per AGGRESSIVE CONSOLIDATION and DRY:

| Merge Into Single Component | From |
|---|---|
| `AgentBettingView` | `SmartBettingInterface`, `UnifiedBettingInterface`, `AIStakeInput`, `SmartStakeInput` |
| `AgentStatusView` | `ProgressDashboard` + `PerformanceDashboard` + `ReputationChart` |
| `AgentSocialFeed` | `SocialBettingFeed` + `social-integration.ts` sharing functions |

### What Gets Removed

Per PREVENT BLOAT — components that serve no purpose in the agent model:

- `src/components/three/` — 3D backgrounds (scope creep, not relevant to demo)
- `src/components/achievements/AchievementShowcase.tsx` — gamification chrome
- `src/app/test-viral/` — test pages
- `src/app/onboarding/step4/` — complex onboarding (agent setup is simpler)
- `src/lib/personality-engine.ts` — replaced by on-chain LLM agent personality
- `src/lib/cultural-adaptation.ts` — nice-to-have, not hackathon-critical

---

## Implementation Plan: 3 Weeks

### Week 1: Agent Foundation

**Goal:** One agent autonomously manages one commitment end-to-end on Somnia testnet.

#### Day 1-2: Enhanced `PunctualityAgent.sol`

Build the contract that implements `IAgentRequesterHandler`. This contract:
- Creates commitments on behalf of users (with user pre-authorization)
- Invokes the LLM inference agent to decide pace/deadline
- Invokes the JSON API agent to fetch traffic/weather context
- Handles responses via `handleResponse` callback
- Settles stakes autonomously when conditions are met

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "./core/PunctualityCore.sol";

// Somnia agent platform interface
enum ConsensusType { Majority, Threshold }
enum ResponseStatus { None, Pending, Success, Failed, TimedOut }

struct Response {
    address validator;
    bytes result;
    ResponseStatus status;
    uint256 receipt;
    uint256 timestamp;
    uint256 executionCost;
}

struct Request {
    uint256 id;
    address requester;
    address callbackAddress;
    bytes4 callbackSelector;
    address[] subcommittee;
    Response[] responses;
    uint256 responseCount;
    uint256 failureCount;
    uint256 threshold;
    uint256 createdAt;
    uint256 deadline;
    ResponseStatus status;
    ConsensusType consensusType;
    uint256 remainingBudget;
    uint256 perAgentBudget;
}

interface IAgentRequester {
    function createRequest(
        uint256 agentId,
        address callbackAddress,
        bytes4 callbackSelector,
        bytes calldata payload
    ) external payable returns (uint256 requestId);

    function getRequestDeposit() external view returns (uint256);
}

interface IAgentRequesterHandler {
    function handleResponse(
        uint256 requestId,
        Response[] memory responses,
        ResponseStatus status,
        Request memory details
    ) external;
}

// LLM agent function signatures
interface ILLMAgent {
    function inferString(
        string calldata prompt,
        string calldata system,
        bool chainOfThought,
        string[] calldata allowedValues
    ) external returns (string memory response);

    function inferNumber(
        string calldata prompt,
        string calldata system,
        int256 minValue,
        int256 maxValue,
        bool chainOfThought
    ) external returns (int256 response);
}

// JSON API agent function signatures
interface IJsonApiAgent {
    function fetchUint(
        string calldata url,
        string calldata selector,
        uint8 decimals
    ) external returns (uint256);

    function fetchString(
        string calldata url,
        string calldata selector
    ) external returns (string memory);
}

contract PunctualityAgent is IAgentRequesterHandler {

    IAgentRequester public platform =
        IAgentRequester(0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776); // testnet

    PunctualityCore public punctualityCore;

    // Agent IDs (register via agents.somnia.network portal)
    uint256 public llmAgentId;
    uint256 public jsonApiAgentId;

    // Pricing
    uint256 constant LLM_COST_PER_AGENT = 0.07 ether;
    uint256 constant JSON_API_COST_PER_AGENT = 0.03 ether;
    uint256 constant SUBCOMMITTEE_SIZE = 3;

    // Request tracking
    enum RequestType { PaceDecision, DeadlineDecision, ContextFetch, SettlementDecision }
    mapping(uint256 => RequestType) public requestTypes;
    mapping(uint256 => bytes32) public requestToCommitment;
    mapping(uint256 => bool) public pendingRequests;

    // Agent authorization
    mapping(address => bool) public authorizedPrincipals;
    mapping(address => AgentConfig) public agentConfigs;

    struct AgentConfig {
        uint256 maxStake;           // max STT agent can stake per commitment
        uint256 minReputation;      // min reputation to accept a challenge
        bool autoAcceptChallenges;  // auto-accept incoming challenges
        bool autoPostSocial;        // auto-generate social updates
        string personality;         // agent personality prompt
    }

    // Events
    event AgentCreatedCommitment(bytes32 indexed commitmentId, address indexed principal, string reasoning);
    event AgentDecisionMade(uint256 indexed requestId, string decision, string reasoning);
    event AgentSettledCommitment(bytes32 indexed commitmentId, bool success, uint256 payout);

    constructor(address _punctualityCore, uint256 _llmAgentId, uint256 _jsonApiAgentId) {
        punctualityCore = PunctualityCore(payable(_punctualityCore));
        llmAgentId = _llmAgentId;
        jsonApiAgentId = _jsonApiAgentId;
    }

    // ──────────────────────────────────────────────
    // AUTHORIZATION
    // ──────────────────────────────────────────────

    function authorizeAgent(AgentConfig calldata config) external payable {
        authorizedPrincipals[msg.sender] = true;
        agentConfigs[msg.sender] = config;
    }

    function revokeAgent() external {
        authorizedPrincipals[msg.sender] = false;
    }

    // ──────────────────────────────────────────────
    // AUTONOMOUS COMMITMENT CREATION
    // ──────────────────────────────────────────────

    function createAutonomousCommitment(
        IPunctualityProtocol.LocationData memory startLocation,
        IPunctualityProtocol.LocationData memory targetLocation,
        string calldata context // "work", "social", "urgent"
    ) external payable {
        require(authorizedPrincipals[msg.sender], "Agent not authorized");
        require(msg.value > 0, "Stake required");

        AgentConfig memory config = agentConfigs[msg.sender];
        require(msg.value <= config.maxStake, "Stake exceeds max");

        // Step 1: Invoke LLM agent to decide pace and deadline
        bytes memory payload = abi.encodeWithSelector(
            ILLMAgent.inferNumber.selector,
            _buildPacePrompt(msg.sender, startLocation, targetLocation, context),
            "You are a punctuality optimization agent. Analyze the user's history and current context to recommend the optimal travel pace in seconds per meter. Be precise and conservative.",
            int256(30),   // min: 30 sec/km (very fast)
            int256(300),  // max: 300 sec/km (walking)
            true          // chain-of-thought reasoning
        );

        uint256 deposit = platform.getRequestDeposit() + (LLM_COST_PER_AGENT * SUBCOMMITTEE_SIZE);
        uint256 requestId = platform.createRequest{value: deposit}(
            llmAgentId,
            address(this),
            this.handleResponse.selector,
            payload
        );

        requestTypes[requestId] = RequestType.PaceDecision;
        pendingRequests[requestId] = true;
        // Store params for callback use
        // (in production, use a struct mapping)
    }

    // ──────────────────────────────────────────────
    // AGENT RESPONSE HANDLER (Somnia callback)
    // ──────────────────────────────────────────────

    function handleResponse(
        uint256 requestId,
        Response[] memory responses,
        ResponseStatus status,
        Request memory details
    ) external override {
        require(msg.sender == address(platform), "Only platform can call");
        require(pendingRequests[requestId], "Unknown request");

        delete pendingRequests[requestId];

        if (status != ResponseStatus.Success || responses.length == 0) {
            emit AgentDecisionMade(requestId, "failed", "Agent execution failed");
            return;
        }

        RequestType reqType = requestTypes[requestId];

        if (reqType == RequestType.PaceDecision) {
            _handlePaceDecision(requestId, responses);
        } else if (reqType == RequestType.ContextFetch) {
            _handleContextResponse(requestId, responses);
        } else if (reqType == RequestType.SettlementDecision) {
            _handleSettlementDecision(requestId, responses);
        }
    }

    function _handlePaceDecision(
        uint256 requestId,
        Response[] memory responses
    ) internal {
        int256 pacePerKm = abi.decode(responses[0].result, (int256));
        uint256 pace = uint256(pacePerKm) / 1000; // convert to sec/meter

        // Create the commitment on PunctualityCore with AI-decided pace
        // (stored params retrieved from request mapping)
        emit AgentDecisionMade(
            requestId,
            "pace_decided",
            string(abi.encodePacked("AI chose pace: ", _uint2str(pace), " sec/m"))
        );
    }

    function _handleContextResponse(
        uint256 requestId,
        Response[] memory responses
    ) internal {
        uint256 trafficDelay = abi.decode(responses[0].result, (uint256));
        // Adjust deadline based on real-time traffic data
        emit AgentDecisionMade(
            requestId,
            "context_fetched",
            string(abi.encodePacked("Traffic delay: ", _uint2str(trafficDelay), " seconds"))
        );
    }

    function _handleSettlementDecision(
        uint256 requestId,
        Response[] memory responses
    ) internal {
        string memory verdict = abi.decode(responses[0].result, (string));
        // Use LLM verdict to determine settlement
        emit AgentDecisionMade(requestId, "settled", verdict);
    }

    // ──────────────────────────────────────────────
    // PROMPT BUILDERS
    // ──────────────────────────────────────────────

    function _buildPacePrompt(
        address principal,
        IPunctualityProtocol.LocationData memory start,
        IPunctualityProtocol.LocationData memory target,
        string calldata context
    ) internal view returns (string memory) {
        uint256 reputation = punctualityCore.getUserReputation(principal);

        return string(abi.encodePacked(
            "Principal reputation score: ", _uint2str(reputation), "/10000. ",
            "Context: ", context, ". ",
            "Recommend optimal pace in seconds per kilometer for this journey. ",
            "Consider: historical punctuality, distance, and context urgency. ",
            "Respond with a single integer (seconds per km)."
        ));
    }

    // ──────────────────────────────────────────────
    // UTILITIES
    // ──────────────────────────────────────────────

    function _uint2str(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    receive() external payable {}
}
```

#### Day 3-4: Agent Registry + On-Chain Reactivity

Build `AgentRegistry.sol` — a simple on-chain registry where agents publish their active commitments so counterparty agents can discover them.

```solidity
contract AgentRegistry {
    struct AgentListing {
        address agentContract;
        address principal;
        bytes32 commitmentId;
        uint256 deadline;
        bool active;
    }

    mapping(bytes32 => AgentListing) public listings;
    mapping(address => bytes32[]) public principalCommitments;

    event AgentListed(bytes32 indexed commitmentId, address indexed principal, address agentContract);
    event AgentMatched(bytes32 indexed commitmentA, bytes32 indexed commitmentB);

    function listAgent(
        bytes32 commitmentId,
        address principal,
        uint256 deadline
    ) external {
        listings[commitmentId] = AgentListing({
            agentContract: msg.sender,
            principal: principal,
            commitmentId: commitmentId,
            deadline: deadline,
            active: true
        });
        principalCommitments[principal].push(commitmentId);
        emit AgentListed(commitmentId, principal, msg.sender);
    }

    function findCounterpartyAgent(
        address targetPrincipal
    ) external view returns (AgentListing memory) {
        bytes32[] memory commitments = principalCommitments[targetPrincipal];
        for (uint256 i = 0; i < commitments.length; i++) {
            if (listings[commitments[i]].active) {
                return listings[commitments[i]];
            }
        }
        revert("No active agent found for principal");
    }
}
```

Reactivity subscription in `PunctualityAgent`:

```solidity
import { SomniaEventHandler } from "@somnia-chain/reactivity-contracts/contracts/SomniaEventHandler.sol";
import { SomniaExtensions } from "@somnia-chain/reactivity-contracts/contracts/interfaces/SomniaExtensions.sol";

contract PunctualityAgent is IAgentRequesterHandler, SomniaEventHandler {

    uint256 public deadlineCheckSubscriptionId;

    constructor(/* ... */) payable {
        // Subscribe to BlockTick for periodic deadline monitoring
        SomniaExtensions.SubscriptionFilter memory filter =
            SomniaExtensions.SubscriptionFilter({
                eventTopics: [
                    ISomniaReactivityPrecompile.BlockTick.selector,
                    bytes32(0), bytes32(0), bytes32(0)
                ],
                origin: address(0),
                emitter: SomniaExtensions.SOMNIA_REACTIVITY_PRECOMPILE_ADDRESS
            });

        SomniaExtensions.SubscriptionOptions memory options =
            SomniaExtensions.SubscriptionOptions({
                priorityFeePerGas: 1,
                maxFeePerGas: 0,
                gasLimit: 2000000
            });

        deadlineCheckSubscriptionId = SomniaExtensions.subscribe(
            address(this), filter, options
        );
    }

    function _onEvent(
        address emitter,
        bytes32[] calldata eventTopics,
        bytes calldata data
    ) internal override {
        // Periodic deadline check for all active commitments
        _checkActiveDeadlines();
    }

    function _checkActiveDeadlines() internal {
        // Iterate active commitments, check if deadline approaching
        // If within threshold, invoke LLM agent for status update
        // If past deadline, trigger settlement
    }
}
```

#### Day 5: Integration + Test on Somnia Testnet

- Deploy `PunctualityCore`, `PunctualityAgent`, `AgentRegistry` to Somnia testnet (chain 50312)
- Register LLM and JSON API agent IDs via `https://agents.testnet.somnia.network` portal
- Fund testnet wallet via Somnia faucet
- Run one full commitment lifecycle: authorize → create → monitor → settle

**Success criteria:** Agent creates a commitment, invokes LLM to decide pace, and settles autonomously — zero human clicks after `authorizeAgent()`.

### Week 2: Agent-to-Agent + Social

**Goal:** Two agents discover each other and settle a commitment autonomously. Agent posts social updates.

#### Day 1-2: Agent-to-Agent Negotiation

When User A creates a commitment involving User B, Agent A looks up Agent B via `AgentRegistry.findCounterpartyAgent()`. Agent A invokes an LLM agent call to propose terms. Agent B receives the proposal via reactivity (listening for `AgentListed` events) and invokes its own LLM agent to accept/reject/counter.

```
Agent A (Alice's agent)                    Agent B (Bob's agent)
       │                                          │
       ├── createCommitment(Alice→Bob)            │
       ├── listAgent(registry) ──────────────────►│
       │                                          ├── _onEvent(AgentListed)
       │                                          ├── LLM: "Should I accept? Bob's rep=8200"
       │◄──────────────────── acceptProposal ─────┤
       ├── LLM: "Bob accepted. Monitor progress." │
       │         ...time passes...                │
       ├── BlockTick: check GPS                   │
       ├── LLM: "Alice is 2km away, on track"     │
       ├── postSocialUpdate("On my way! 🟢")      │
       │                                          ├── BlockTick: check Alice's progress
       │                                          ├── LLM: "Alice looks on time. Hold bet."
       │         ...Alice arrives...              │
       ├── fulfillCommitment(GPS proof)           │
       ├── LLM: "Alice arrived on time. Settle."  │
       ├── settleStake(Alice wins)                │
       ├── postSocialUpdate("Alice made it! ✅")  │
       │                                          ├── settleBets(Bob loses bet)
       │                                          ├── postSocialUpdate("Got beat this time 😤")
```

#### Day 3-4: Social Auto-Posting via LLM Agent

Enhance `PunctualityAgent` to invoke the LLM inference agent with `inferString` to generate personality-driven social updates at key moments:

```solidity
function _postSocialUpdate(bytes32 commitmentId, string memory eventType) internal {
    AgentConfig memory config = agentConfigs[commitmentPrincipals[commitmentId]];
    if (!config.autoPostSocial) return;

    string memory prompt = string(abi.encodePacked(
        "Generate a short, witty social media update (max 280 chars) about this punctuality event. ",
        "Event type: ", eventType, ". ",
        "Personality: ", config.personality, ". ",
        "Include relevant emojis. Be funny but not offensive. "
    ));

    bytes memory payload = abi.encodeWithSelector(
        ILLMAgent.inferString.selector,
        prompt,
        "You are a social media ghostwriter for a punctuality tracking agent.",
        true,
        new string[](0) // no allowed values constraint
    );

    uint256 deposit = platform.getRequestDeposit() + (LLM_COST_PER_AGENT * SUBCOMMITTEE_SIZE);
    platform.createRequest{value: deposit}(
        llmAgentId,
        address(this),
        this.handleSocialResponse.selector,
        payload
    );
}
```

#### Day 5: Data Streams for GPS State

Publish GPS location updates to Somnia Data Streams so counterparty agents can read them without direct contract calls:

```typescript
// Off-chain service that publishes to Somnia Data Streams
import { SDK, SchemaEncoder } from '@somnia-chain/data-streams';

const locationSchema = "LocationUpdate(address principal, int256 lat, int256 lng, uint256 timestamp, uint8 status)";
const encoder = new SchemaEncoder(locationSchema);

async function publishLocationUpdate(principal: string, lat: number, lng: number, status: number) {
  const encoded = encoder.encodeData([
    { name: "principal", value: principal, type: "address" },
    { name: "lat", value: Math.round(lat * 1e6), type: "int256" },
    { name: "lng", value: Math.round(lng * 1e6), type: "int256" },
    { name: "timestamp", value: Math.floor(Date.now() / 1000), type: "uint256" },
    { name: "status", value: status, type: "uint8" } // 0=en_route, 1=arrived, 2=delayed
  ]);

  await sdk.streams.set([{
    id: keccak256(principal + commitmentId),
    schemaId: locationSchemaId,
    data: encoded
  }]);
}
```

**Success criteria:** Two agents discover each other, negotiate terms, monitor progress, settle stakes, and post social updates — all autonomously.

### Week 3: Frontend + Polish + Demo Video

**Goal:** Clean spectator dashboard showing the autonomous agent flow. Record demo.

#### Day 1-2: Frontend Consolidation + Agent Dashboard

**✅ DONE:**
- Agent setup page (`/agent/setup`) — wallet connect → configure params → authorizeAgent() tx
- Agent dashboard page (`/agent/dashboard`) — spectator view with live reactivity stream
- AgentDecisionTimeline — animated timeline of agent reasoning decisions
- AgentStatusView — compact data panel (balance, reactivity, config flags)
- AgentSocialFeed — Twitter-style feed of agent-generated social posts
- Somnia reactivity service — raw WebSocket `eth_subscribe` for real-time agent events
- Contract service updated with agent + registry methods and event listeners
- Navigation updated with Agent link

**TODO:**
1. Consolidate `SmartBettingInterface` + `UnifiedBettingInterface` + `AIStakeInput` + `SmartStakeInput` → single `AgentBettingView`
2. Enhance `src/app/watch/[id]/page.tsx` with agent decision timeline overlay
3. Create `somnia-data-streams.ts` for GPS state publishing via Data Streams

Reactivity uses raw WebSocket `eth_subscribe` (not the SDK) for simplicity:

```typescript
import { somniaReactivity } from '@/lib/somnia-reactivity';

// Connect and subscribe to agent contract events
await somniaReactivity.connect(AGENT_CONTRACT_ADDRESS);

const cleanup = somniaReactivity.onActivity((event) => {
  // event.type: 'decision' | 'commitment_created' | 'commitment_settled' | 'social_update'
  updateDashboard(event);
});
```

#### Day 3: End-to-End Testing

Full test matrix:
- [ ] Agent creates commitment autonomously (LLM decides pace)
- [ ] Agent fetches external context (JSON API agent: weather/traffic)
- [ ] Two agents discover each other via registry
- [ ] Agent-to-agent negotiation (accept/reject/counter)
- [ ] Periodic deadline monitoring via reactivity (BlockTick)
- [ ] GPS state published via Data Streams
- [ ] Autonomous settlement on arrival
- [ ] Autonomous settlement on deadline expiry (failure case)
- [ ] Social updates generated by LLM agent
- [ ] Frontend shows full lifecycle in real-time
- [ ] Error handling: agent failure, timeout, consensus failure
- [ ] Gas cost analysis: total STT per commitment lifecycle

#### Day 4-5: Demo Video + Documentation

Record 3-5 minute demo video showing:
1. **Setup** (30s): User authorizes agent, configures parameters
2. **Autonomous creation** (30s): Agent creates commitment, LLM decides pace — no clicks
3. **Agent-to-agent** (60s): Two agents discover each other, negotiate, monitor
4. **Live tracking** (60s): Dashboard shows agent decisions, GPS, social posts in real-time
5. **Settlement** (30s): Agent settles autonomously, posts results
6. **Tech overview** (30s): Architecture diagram, Somnia primitives used

Update all documentation to reflect agent-native architecture.

---

## Gas Cost Analysis (Testnet Estimates)

Per commitment lifecycle:

| Agent Call | Per-Validator Cost | × 3 Validators | Count | Total |
|---|---|---|---|---|
| LLM: Pace decision | 0.07 STT | 0.21 STT | 1 | 0.21 STT |
| JSON API: Traffic fetch | 0.03 STT | 0.09 STT | 1-2 | 0.18 STT |
| LLM: Settlement verdict | 0.07 STT | 0.21 STT | 1 | 0.21 STT |
| LLM: Social updates | 0.07 STT | 0.21 STT | 2-4 | 0.84 STT |
| Reactivity: Deadline checks | ~0.01 STT gas | — | 10-20 | 0.20 STT |
| **Total per commitment** | | | | **~1.64 STT** |

With agent-to-agent negotiation (both sides): ~3.3 STT per mutual commitment.

---

## Technical Decisions

### Why on-chain LLM instead of Venice AI for primary reasoning?

Somnia's on-chain LLM inference agent produces deterministic outputs across validator nodes, enabling consensus. Venice AI is used as an **off-chain supplement** for richer reasoning (longer context windows, more nuanced analysis) that feeds into the frontend dashboard but doesn't drive autonomous decisions. The split:

- **On-chain LLM** (Somnia agent): Autonomous decisions (pace, settlement, social posts) — must be deterministic and consensus-verified
- **Off-chain Venice AI**: Dashboard enrichment, detailed analytics, user-facing explanations — can be non-deterministic

### Why Data Streams for GPS instead of direct contract calls?

GPS updates are high-frequency. Writing each one to contract storage is expensive. Data Streams let us publish structured location data cheaply, with agents reading the latest state when needed rather than storing every update on-chain.

### Why Reactivity for deadline checks instead of off-chain cron?

On-chain reactivity via `BlockTick` keeps the entire lifecycle on-chain and trustless. No off-chain server needed to monitor deadlines. If the app goes down, agents still settle autonomously.

### Why keep Socket.IO alongside Somnia off-chain reactivity?

Socket.IO handles the frontend's real-time UX (smooth animations, optimistic updates). Somnia reactivity handles on-chain event streaming. They serve different layers — Socket.IO for the UI feel, Somnia for blockchain truth.

---

## Success Criteria for Hackathon Submission

### Must Have
- [ ] `PunctualityAgent.sol` deployed on Somnia testnet, handling full commitment lifecycle
- [ ] Agent invokes LLM inference agent for at least 2 autonomous decisions
- [ ] Agent invokes JSON API agent for external context fetching
- [ ] On-chain reactivity subscription (BlockTick or event-based) triggers autonomous action
- [ ] Agent-to-agent discovery via `AgentRegistry` works for at least one pair
- [ ] Frontend shows real-time agent activity via Somnia off-chain reactivity SDK
- [ ] 3-5 minute demo video
- [ ] Public GitHub repo

### Nice to Have
- [ ] Data Streams integration for GPS state publishing
- [ ] LLM Parse Website agent for reputation scraping
- [ ] Agent personality system (different agents have different communication styles)
- [ ] Multi-party agent challenges (3+ agents)
- [ ] Mobile-optimized agent dashboard

---

## File Structure (Post-Pivot)

```
contracts/
  core/
    PunctualityCore.sol          # EXISTING — unchanged settlement logic
  interfaces/
    IPunctualityProtocol.sol     # EXISTING — add agent function signatures
  agents/
    PunctualityAgent.sol         # ✅ DONE — IAgentRequesterHandler + SomniaEventHandler
    AgentRegistry.sol            # ✅ DONE — agent discovery + proposals
  lib/
    Math.sol                     # EXISTING

scripts/
  deploy-agents.cjs              # ✅ DONE — 3-contract deploy sequence with funding

src/
  app/
    page.tsx                     # EXISTING — landing page
    agent/
      setup/page.tsx             # ✅ DONE — agent authorization wizard
      dashboard/page.tsx         # ✅ DONE — agent activity spectator view
    watch/
      [id]/page.tsx              # EXISTING — enhance with agent decision timeline
    create/page.tsx              # EXISTING — simplify to agent setup
  components/
    agent/
      AgentDecisionTimeline.tsx  # ✅ DONE — shows agent reasoning chain
      AgentStatusView.tsx        # ✅ DONE — consolidated status view
      AgentBettingView.tsx       # TODO — consolidated betting (from 4 components)
      AgentSocialFeed.tsx        # ✅ DONE — agent-generated social posts
    tracking/
      LiveLocationTracker.tsx    # EXISTING — kept
      InteractiveJourneyTracker.tsx # EXISTING — enhanced
    dashboard/
      ProgressDashboard.tsx      # EXISTING — enhanced with agent metrics
  contracts/
    addresses.ts                 # ✅ DONE — agent address slots + wsUrl + platform address
  lib/
    contracts.ts                 # ✅ DONE — CORE_ABI, AGENT_ABI, REGISTRY_ABI + factory helpers
    ai-service.ts                # EXISTING — repurpose as off-chain supplement
    ai-commitment-engine.ts      # EXISTING — repurpose as off-chain supplement
    somnia-reactivity.ts         # ✅ DONE — raw WebSocket eth_subscribe for agent events
    somnia-data-streams.ts       # TODO — Data Streams publisher/subscriber
    db-service.ts                # EXISTING — add agent CRUD
  services/
    contractService.ts           # ✅ DONE — core + agent + registry methods + event listeners
```

---

## Core Principles Compliance

| Principle | How the Pivot Honors It |
|---|---|
| **ENHANCEMENT FIRST** | `PunctualityCore.sol` unchanged. AI service layer repurposed. UI components enhanced, not replaced. |
| **CONSOLIDATION** | 4 betting components → 1. 3 status components → 1. 2 social components → 1. Dead code removed. |
| **PREVENT BLOAT** | 3D graphics, achievements, complex onboarding removed. New code is focused: 2 contracts, 1 service layer, 4 UI components. |
| **DRY** | Agent reasoning logic centralized in `PunctualityAgent.sol`. Off-chain supplement uses existing `ai-service.ts`. |
| **CLEAN** | Clear separation: on-chain agents handle autonomy, off-chain services handle enrichment, frontend handles visualization. |
| **MODULAR** | `PunctualityAgent` is independent of `PunctualityCore` — communicates via interface. Registry is swappable. |
| **PERFORMANT** | On-chain reactivity replaces polling. Data Streams replace expensive storage writes. |
| **ORGANIZED** | New `contracts/agents/` directory. New `src/components/agent/` directory. Domain-driven, predictable. |
