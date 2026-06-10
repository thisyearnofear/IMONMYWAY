// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {SomniaEventHandler} from "@somnia-chain/reactivity-contracts/contracts/SomniaEventHandler.sol";
import {SomniaExtensions} from "@somnia-chain/reactivity-contracts/contracts/interfaces/SomniaExtensions.sol";
import {ISomniaReactivityPrecompile} from "@somnia-chain/reactivity-contracts/contracts/interfaces/ISomniaReactivityPrecompile.sol";
import {IPunctualityProtocol} from "../interfaces/IPunctualityProtocol.sol";
import {AgentRegistry} from "./AgentRegistry.sol";

// ──────────────────────────────────────────────────────────────
// Somnia Agent Platform Interfaces
// Defined inline per Somnia docs (agents.somnia.network portal)
// ──────────────────────────────────────────────────────────────

enum ConsensusType { Majority, Threshold }

enum ResponseStatus {
    None,
    Pending,
    Success,
    Failed,
    TimedOut
}

struct Response {
    address validator;
    bytes result;
    ResponseStatus status;
    uint256 receipt;
    uint256 timestamp;
    uint256 executionCost;
}

struct AgentRequest {
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
    event RequestCreated(uint256 indexed requestId, uint256 indexed agentId, uint256 perAgentBudget, bytes payload, address[] subcommittee);
    event RequestFinalized(uint256 indexed requestId, ResponseStatus status);

    function createRequest(
        uint256 agentId,
        address callbackAddress,
        bytes4 callbackSelector,
        bytes calldata payload
    ) external payable returns (uint256 requestId);

    function createAdvancedRequest(
        uint256 agentId,
        address callbackAddress,
        bytes4 callbackSelector,
        bytes calldata payload,
        uint256 subcommitteeSize,
        uint256 threshold,
        ConsensusType consensusType,
        uint256 timeout
    ) external payable returns (uint256 requestId);

    function getRequest(uint256 requestId) external view returns (AgentRequest memory);
    function hasRequest(uint256 requestId) external view returns (bool);
    function getRequestDeposit() external view returns (uint256);
    function getAdvancedRequestDeposit(uint256 subcommitteeSize) external view returns (uint256);
}

interface IAgentRequesterHandler {
    function handleResponse(
        uint256 requestId,
        Response[] memory responses,
        ResponseStatus status,
        AgentRequest memory details
    ) external;
}

// Somnia base agent function signatures
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

    function inferChat(
        string[] calldata roles,
        string[] calldata messages,
        bool chainOfThought
    ) external returns (string memory response);
}

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

    function fetchBool(
        string calldata url,
        string calldata selector
    ) external returns (bool);
}

// ──────────────────────────────────────────────────────────────
// PunctualityAgent Contract
// ──────────────────────────────────────────────────────────────

/**
 * @title PunctualityAgent
 * @dev Autonomous agent that manages punctuality commitments on behalf of principals.
 *
 *      Implements IAgentRequesterHandler for Somnia agent callbacks.
 *      Inherits SomniaEventHandler for on-chain reactivity subscriptions.
 *
 *      Lifecycle:
 *      1. Principal authorizes agent with config (max stake, personality, etc.)
 *      2. Agent creates commitment on PunctualityCore (LLM decides pace/deadline)
 *      3. Agent lists in AgentRegistry for counterparty discovery
 *      4. Reactivity subscription monitors deadlines (BlockTick)
 *      5. Agent settles autonomously on arrival or expiry
 *      6. Agent posts social updates via LLM inference
 */
contract PunctualityAgent is IAgentRequesterHandler, SomniaEventHandler {

    // ──────────────────────────────────────────────
    // CONSTANTS & STATE
    // ──────────────────────────────────────────────

    IAgentRequester public platform;
    IPunctualityProtocol public punctualityCore;
    AgentRegistry public registry;
    address public immutable owner;

    // Somnia testnet platform: 0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776
    // Somnia mainnet platform: 0x5E5205CF39E766118C01636bED000A54D93163E6

    // Agent IDs (registered via agents.somnia.network portal)
    uint256 public llmAgentId;
    uint256 public jsonApiAgentId;

    // Per-agent pricing (see docs.somnia.network/agents/invoking-agents/gas-fees)
    uint256 constant LLM_COST_PER_AGENT = 0.07 ether;
    uint256 constant JSON_API_COST_PER_AGENT = 0.03 ether;
    uint256 constant SUBCOMMITTEE_SIZE = 3;

    // Request tracking
    enum RequestType {
        PaceDecision,
        DeadlineDecision,
        ContextFetch,
        SettlementDecision,
        SocialUpdate
    }

    struct PendingRequest {
        RequestType requestType;
        bytes32 commitmentId;
        address principal;
        bool exists;
    }

    struct AgentConfig {
        uint256 maxStake;
        uint256 minReputation;
        bool autoAcceptProposals;
        bool autoPostSocial;
        string personality;
    }

    struct CommitmentState {
        address principal;
        bytes32 commitmentId;
        uint256 deadline;
        uint256 stakeAmount;
        IPunctualityProtocol.LocationData startLocation;
        IPunctualityProtocol.LocationData targetLocation;
        string context;
        uint256 decidedPace;
        bool settled;
    }

    // requestId => pending request metadata
    mapping(uint256 => PendingRequest) public pendingRequests;

    // principal => authorization status
    mapping(address => bool) public authorizedPrincipals;

    // principal => agent configuration
    mapping(address => AgentConfig) public agentConfigs;

    // commitmentId => commitment state managed by agent
    mapping(bytes32 => CommitmentState) public commitmentStates;

    // commitmentId => reactivity subscription ID for deadline monitoring
    mapping(bytes32 => uint256) public deadlineSubscriptions;

    // Track active commitment count per principal
    mapping(address => uint256) public activeCommitmentCount;

    // Index of authorized principals for iteration
    address[] private _authorizedPrincipalsList;

    // ──────────────────────────────────────────────
    // EVENTS
    // ──────────────────────────────────────────────

    event AgentAuthorized(address indexed principal, uint256 maxStake, string personality);
    event AgentRevoked(address indexed principal);
    event AgentRequestSent(uint256 indexed requestId, RequestType requestType, bytes32 indexed commitmentId);
    event AgentDecisionMade(uint256 indexed requestId, RequestType requestType, bytes32 indexed commitmentId, string decision);
    event AgentCreatedCommitment(bytes32 indexed commitmentId, address indexed principal, uint256 pace, string reasoning);
    event AgentSettledCommitment(bytes32 indexed commitmentId, bool success, string reasoning);
    event AgentSocialUpdate(bytes32 indexed commitmentId, string eventType, string message);
    event AgentDeadlineCheck(bytes32 indexed commitmentId, uint256 timeRemaining);
    event AgentProposalHandled(bytes32 indexed commitmentId, address proposerAgent, bool accepted);

    // ──────────────────────────────────────────────
    // CONSTRUCTOR
    // ──────────────────────────────────────────────

    constructor(
        address _platform,
        address _punctualityCore,
        address _registry,
        uint256 _llmAgentId,
        uint256 _jsonApiAgentId
    ) payable {
        owner = msg.sender;
        platform = IAgentRequester(_platform);
        punctualityCore = IPunctualityProtocol(_punctualityCore);
        registry = AgentRegistry(_registry);
        llmAgentId = _llmAgentId;
        jsonApiAgentId = _jsonApiAgentId;
    }

    // ──────────────────────────────────────────────
    // AUTHORIZATION
    // ──────────────────────────────────────────────

    function authorizeAgent(AgentConfig calldata config) external payable {
        require(!authorizedPrincipals[msg.sender], "Already authorized");
        require(config.maxStake > 0, "Max stake must be positive");

        authorizedPrincipals[msg.sender] = true;
        agentConfigs[msg.sender] = config;
        _authorizedPrincipalsList.push(msg.sender);

        emit AgentAuthorized(msg.sender, config.maxStake, config.personality);
    }

    function revokeAgent() external {
        require(authorizedPrincipals[msg.sender], "Not authorized");
        require(activeCommitmentCount[msg.sender] == 0, "Active commitments exist");

        authorizedPrincipals[msg.sender] = false;
        _removeFromAuthorizedList(msg.sender);
        emit AgentRevoked(msg.sender);
    }

    function updateConfig(AgentConfig calldata config) external {
        require(authorizedPrincipals[msg.sender], "Not authorized");
        agentConfigs[msg.sender] = config;
    }

    // ──────────────────────────────────────────────
    // AUTONOMOUS COMMITMENT CREATION
    // ──────────────────────────────────────────────

    /**
     * @dev Initiate autonomous commitment creation.
     *      Step 1: Invoke LLM agent to decide optimal pace.
     *      Step 2 (in callback): Create commitment on PunctualityCore with decided pace.
     */
    function initiateCommitment(
        IPunctualityProtocol.LocationData calldata startLocation,
        IPunctualityProtocol.LocationData calldata targetLocation,
        string calldata context
    ) external payable {
        require(authorizedPrincipals[msg.sender], "Agent not authorized");
        require(msg.value > 0, "Stake required");

        AgentConfig memory config = agentConfigs[msg.sender];
        require(msg.value <= config.maxStake, "Stake exceeds configured maximum");

        // Calculate distance for the prompt
        uint256 distance = punctualityCore.calculateDistance(
            startLocation.latitude, startLocation.longitude,
            targetLocation.latitude, targetLocation.longitude
        );

        // Get principal's reputation for the prompt
        uint256 reputation = punctualityCore.getUserReputation(msg.sender);

        // Build LLM prompt for pace decision
        string memory prompt = _buildPacePrompt(
            msg.sender, reputation, distance, context
        );

        // Invoke LLM inference agent
        bytes memory payload = abi.encodeWithSelector(
            ILLMAgent.inferNumber.selector,
            prompt,
            "You are a punctuality optimization agent. Analyze the principal's reputation and journey context to recommend the optimal travel pace in seconds per kilometer. Be precise and evidence-based. Return only an integer.",
            int256(30),    // min: 30 sec/km (running)
            int256(600),   // max: 600 sec/km (slow walk)
            true           // chain-of-thought reasoning
        );

        uint256 deposit = platform.getRequestDeposit() + (LLM_COST_PER_AGENT * SUBCOMMITTEE_SIZE);
        uint256 requestId = platform.createRequest{value: deposit}(
            llmAgentId,
            address(this),
            this.handleResponse.selector,
            payload
        );

        // Store pending request — commitmentId will be set after creation
        // For now, use a temporary ID derived from the request
        bytes32 tempId = keccak256(abi.encodePacked(msg.sender, block.timestamp, requestId));
        pendingRequests[requestId] = PendingRequest({
            requestType: RequestType.PaceDecision,
            commitmentId: tempId,
            principal: msg.sender,
            exists: true
        });

        // Stash params for the callback
        _stashCommitmentParams(tempId, msg.sender, startLocation, targetLocation, context, msg.value);

        emit AgentRequestSent(requestId, RequestType.PaceDecision, tempId);
    }

    // ──────────────────────────────────────────────
    // SOMNIA AGENT RESPONSE HANDLER
    // ──────────────────────────────────────────────

    function handleResponse(
        uint256 requestId,
        Response[] memory responses,
        ResponseStatus status,
        AgentRequest memory /* details */
    ) external override {
        require(msg.sender == address(platform), "Only platform can call");

        PendingRequest memory pending = pendingRequests[requestId];
        require(pending.exists, "Unknown request");

        delete pendingRequests[requestId];

        if (status != ResponseStatus.Success || responses.length == 0) {
            emit AgentDecisionMade(requestId, pending.requestType, pending.commitmentId, "FAILED: agent execution unsuccessful");
            return;
        }

        if (pending.requestType == RequestType.PaceDecision) {
            _handlePaceDecision(requestId, responses, pending);
        } else if (pending.requestType == RequestType.ContextFetch) {
            _handleContextFetch(requestId, responses, pending);
        } else if (pending.requestType == RequestType.SettlementDecision) {
            _handleSettlementDecision(requestId, responses, pending);
        } else if (pending.requestType == RequestType.SocialUpdate) {
            _handleSocialUpdate(requestId, responses, pending);
        }
    }

    // ──────────────────────────────────────────────
    // RESPONSE HANDLERS
    // ──────────────────────────────────────────────

    function _handlePaceDecision(
        uint256 /* requestId */,
        Response[] memory responses,
        PendingRequest memory pending
    ) internal {
        int256 pacePerKm = abi.decode(responses[0].result, (int256));
        require(pacePerKm > 0, "Invalid LLM pace: negative or zero");
        uint256 pace = uint256(pacePerKm); // seconds per km

        // Retrieve stashed params
        StashedParams memory params = _getStashedParams(pending.commitmentId);

        // Calculate deadline: distance(km) * pace(sec/km) + buffer
        uint256 distanceKm = _getStashedDistanceKm(pending.commitmentId);
        uint256 baseTimeSec = distanceKm * pace;
        uint256 bufferSec = _contextBuffer(params.context);
        uint256 deadline = block.timestamp + baseTimeSec + bufferSec;

        // Create commitment on PunctualityCore
        bytes32 commitmentId = punctualityCore.createCommitment{value: params.stakeAmount}(
            params.startLocation,
            params.targetLocation,
            deadline,
            pace / 1000 // convert sec/km to sec/meter for the contract
        );

        // Store commitment state
        commitmentStates[commitmentId] = CommitmentState({
            principal: pending.principal,
            commitmentId: commitmentId,
            deadline: deadline,
            stakeAmount: params.stakeAmount,
            startLocation: params.startLocation,
            targetLocation: params.targetLocation,
            context: params.context,
            decidedPace: pace,
            settled: false
        });

        activeCommitmentCount[pending.principal]++;

        // Track commitment ID for deadline monitoring
        _activeCommitmentIds[pending.principal].push(commitmentId);

        // Clean up stashed params (prevent unbounded storage growth)
        delete _stashedParams[pending.commitmentId];

        // List in registry for counterparty discovery
        registry.listAgent(
            commitmentId,
            pending.principal,
            deadline,
            params.stakeAmount,
            params.context
        );

        // Subscribe to deadline monitoring via reactivity
        _subscribeDeadline(commitmentId, deadline);

        // If auto-post social is enabled, generate a creation announcement
        if (agentConfigs[pending.principal].autoPostSocial) {
            _requestSocialUpdate(commitmentId, pending.principal, "commitment_created");
        }

        string memory reasoning = string(abi.encodePacked(
            "LLM chose pace: ", _uint2str(pace), " sec/km, deadline in ",
            _uint2str(baseTimeSec + bufferSec), " seconds"
        ));

        emit AgentCreatedCommitment(commitmentId, pending.principal, pace, reasoning);
    }

    function _handleContextFetch(
        uint256 requestId,
        Response[] memory responses,
        PendingRequest memory pending
    ) internal {
        uint256 trafficDelay = abi.decode(responses[0].result, (uint256));

        emit AgentDecisionMade(
            requestId,
            RequestType.ContextFetch,
            pending.commitmentId,
            string(abi.encodePacked("Traffic delay: ", _uint2str(trafficDelay), " seconds"))
        );

        // Could trigger deadline adjustment here in future iterations
    }

    function _handleSettlementDecision(
        uint256 /* requestId */,
        Response[] memory responses,
        PendingRequest memory pending
    ) internal {
        string memory verdict = abi.decode(responses[0].result, (string));

        CommitmentState storage state = commitmentStates[pending.commitmentId];
        if (state.settled) return;

        state.settled = true;

        bool success = _isOnTime(pending.commitmentId);

        if (success) {
            punctualityCore.fulfillCommitment(
                pending.commitmentId,
                IPunctualityProtocol.LocationData({
                    latitude: state.targetLocation.latitude,
                    longitude: state.targetLocation.longitude,
                    accuracy: 50,
                    timestamp: block.timestamp
                })
            );
        }

        // Unsubscribe from deadline monitoring
        uint256 subId = deadlineSubscriptions[pending.commitmentId];
        if (subId != 0) {
            SomniaExtensions.unsubscribe(subId);
            delete deadlineSubscriptions[pending.commitmentId];
        }

        activeCommitmentCount[state.principal]--;
        _removeActiveCommitment(state.principal, pending.commitmentId);

        // Delist from registry
        registry.delistAgent(pending.commitmentId);

        // Post settlement social update
        if (agentConfigs[state.principal].autoPostSocial) {
            string memory eventType = success ? "arrived_on_time" : "missed_deadline";
            _requestSocialUpdate(pending.commitmentId, state.principal, eventType);
        }

        emit AgentSettledCommitment(pending.commitmentId, success, verdict);
    }

    function _handleSocialUpdate(
        uint256 /* requestId */,
        Response[] memory responses,
        PendingRequest memory pending
    ) internal {
        string memory message = abi.decode(responses[0].result, (string));

        emit AgentSocialUpdate(pending.commitmentId, "agent_generated", message);
    }

    // ──────────────────────────────────────────────
    // ON-CHAIN REACTIVITY (SomniaEventHandler)
    // ──────────────────────────────────────────────

    function _onEvent(
        address emitter,
        bytes32[] calldata eventTopics,
        bytes calldata data
    ) internal override {
        // Check if this is a deadline check (BlockTick) or a registry event
        if (emitter == SomniaExtensions.SOMNIA_REACTIVITY_PRECOMPILE_ADDRESS) {
            // BlockTick or Schedule trigger — check all active deadlines
            _checkAllDeadlines();
        } else if (emitter == address(registry)) {
            // AgentListed event — a counterparty agent was discovered
            // Decode and evaluate the proposal
            _handleRegistryEvent(eventTopics, data);
        }
    }

    /**
     * @dev Subscribe to BlockTick for periodic deadline monitoring
     */
    function _subscribeDeadline(bytes32 commitmentId, uint256 deadline) internal {
        // Schedule a one-time check at the deadline timestamp
        uint256 deadlineMillis = deadline * 1000;

        SomniaExtensions.SubscriptionOptions memory options =
            SomniaExtensions.SubscriptionOptions({
                priorityFeePerGas: 1,
                maxFeePerGas: 0,
                gasLimit: 2_000_000
            });

        uint256 subId = SomniaExtensions.scheduleSubscriptionAtTimestamp(
            address(this),
            deadlineMillis,
            options
        );

        deadlineSubscriptions[commitmentId] = subId;
    }

    // Active commitment IDs tracked for deadline checks
    mapping(address => bytes32[]) private _activeCommitmentIds;

    /**
     * @dev Called by reactivity on BlockTick — check if any commitments need action.
     *      If deadline passed and not settled, trigger settlement.
     */
    function _checkAllDeadlines() internal {
        // Iterate all principals with active commitments
        // In production, use a more gas-efficient index.
        // For now, we track commitment IDs per principal.
        address[] memory principals = _getAuthorizedPrincipals();
        for (uint256 p = 0; p < principals.length; p++) {
            bytes32[] storage ids = _activeCommitmentIds[principals[p]];
            for (uint256 i = 0; i < ids.length; i++) {
                CommitmentState storage state = commitmentStates[ids[i]];
                if (state.settled || state.commitmentId == bytes32(0)) continue;
                if (block.timestamp >= state.deadline) {
                    _triggerSettlement(ids[i]);
                }
            }
        }
    }

    function _triggerSettlement(bytes32 commitmentId) internal {
        CommitmentState storage state = commitmentStates[commitmentId];
        if (state.settled) return;
        state.settled = true;

        bool success = _isOnTime(commitmentId);

        if (success) {
            punctualityCore.fulfillCommitment(
                commitmentId,
                IPunctualityProtocol.LocationData({
                    latitude: state.targetLocation.latitude,
                    longitude: state.targetLocation.longitude,
                    accuracy: 50,
                    timestamp: block.timestamp
                })
            );
        }

        // Unsubscribe from deadline monitoring
        uint256 subId = deadlineSubscriptions[commitmentId];
        if (subId != 0) {
            SomniaExtensions.unsubscribe(subId);
            delete deadlineSubscriptions[commitmentId];
        }

        activeCommitmentCount[state.principal]--;
        _removeActiveCommitment(state.principal, commitmentId);
        registry.delistAgent(commitmentId);

        // Clean up stashed params
        delete _stashedParams[commitmentId];

        if (agentConfigs[state.principal].autoPostSocial) {
            string memory eventType = success ? "arrived_on_time" : "missed_deadline";
            _requestSocialUpdate(commitmentId, state.principal, eventType);
        }

        emit AgentSettledCommitment(commitmentId, success, success ? "On time" : "Deadline passed");
    }

    // Placeholder — now backed by _authorizedPrincipalsList
    function _getAuthorizedPrincipals() internal view returns (address[] memory) {
        return _authorizedPrincipalsList;
    }

    function _removeFromAuthorizedList(address principal) internal {
        for (uint256 i = 0; i < _authorizedPrincipalsList.length; i++) {
            if (_authorizedPrincipalsList[i] == principal) {
                _authorizedPrincipalsList[i] = _authorizedPrincipalsList[_authorizedPrincipalsList.length - 1];
                _authorizedPrincipalsList.pop();
                return;
            }
        }
    }

    /**
     * @dev Handle events from the AgentRegistry (counterparty discovered)
     */
    function _handleRegistryEvent(
        bytes32[] calldata eventTopics,
        bytes calldata data
    ) internal {
        // Decode AgentListed event
        // If auto-accept is enabled and counterparty reputation is acceptable,
        // send a proposal automatically
    }

    // ──────────────────────────────────────────────
    // AGENT-TO-AGENT NEGOTIATION
    // ──────────────────────────────────────────────

    /**
     * @dev Evaluate and respond to an incoming proposal from a counterparty agent
     */
    function evaluateProposal(
        bytes32 ourCommitmentId,
        uint256 proposalIndex
    ) external {
        require(authorizedPrincipals[msg.sender] || msg.sender == address(this),
            "Unauthorized");

        AgentRegistry.Proposal[] memory proposals = registry.getProposals(ourCommitmentId);
        require(proposalIndex < proposals.length, "Invalid proposal index");

        AgentRegistry.Proposal memory proposal = proposals[proposalIndex];
        CommitmentState memory state = commitmentStates[ourCommitmentId];

        AgentConfig memory config = agentConfigs[state.principal];

        // Auto-evaluate if enabled
        if (config.autoAcceptProposals) {
            uint256 proposerRep = punctualityCore.getUserReputation(proposal.proposerPrincipal);
            bool acceptable = proposerRep >= config.minReputation;

            registry.respondToProposal(ourCommitmentId, proposalIndex, acceptable);

            emit AgentProposalHandled(ourCommitmentId, proposal.proposerAgent, acceptable);
        }
    }

    /**
     * @dev Send a proposal to a counterparty agent discovered in the registry
     */
    function proposeToCounterparty(
        bytes32 ourCommitmentId,
        bytes32 targetCommitmentId,
        string calldata message
    ) external payable {
        CommitmentState memory state = commitmentStates[ourCommitmentId];
        require(state.principal != address(0), "Unknown commitment");
        require(authorizedPrincipals[state.principal], "Not authorized");

        AgentRegistry.AgentListing memory target = registry.getListing(targetCommitmentId);
        require(target.active, "Target not active");

        registry.sendProposal(
            targetCommitmentId,
            ourCommitmentId,
            state.principal,
            state.deadline,
            state.stakeAmount,
            message
        );
    }

    // ──────────────────────────────────────────────
    // SOCIAL UPDATE GENERATION
    // ──────────────────────────────────────────────

    function _requestSocialUpdate(
        bytes32 commitmentId,
        address principal,
        string memory eventType
    ) internal {
        AgentConfig memory config = agentConfigs[principal];

        string memory prompt = string(abi.encodePacked(
            "Generate a short, engaging social media update (max 280 chars) about this punctuality event. ",
            "Event: ", eventType, ". ",
            "Personality style: ", config.personality, ". ",
            "Include relevant emojis. Be witty but professional. ",
            "Mention being on the IMONMYWAY punctuality protocol."
        ));

        bytes memory payload = abi.encodeWithSelector(
            ILLMAgent.inferString.selector,
            prompt,
            "You are a social media ghostwriter for a punctuality tracking agent on Somnia blockchain. Write concise, engaging updates.",
            true,
            new string[](0)
        );

        uint256 deposit = platform.getRequestDeposit() + (LLM_COST_PER_AGENT * SUBCOMMITTEE_SIZE);
        uint256 requestId = platform.createRequest{value: deposit}(
            llmAgentId,
            address(this),
            this.handleResponse.selector,
            payload
        );

        pendingRequests[requestId] = PendingRequest({
            requestType: RequestType.SocialUpdate,
            commitmentId: commitmentId,
            principal: principal,
            exists: true
        });
    }

    // ──────────────────────────────────────────────
    // CONTEXT FETCHING (JSON API Agent)
    // ──────────────────────────────────────────────

    /**
     * @dev Fetch real-time traffic/distance data from an external API
     *      to inform deadline adjustments
     */
    function fetchRouteContext(
        bytes32 commitmentId,
        string calldata mapsApiUrl,
        string calldata jsonSelector
    ) external payable {
        CommitmentState memory state = commitmentStates[commitmentId];
        require(state.principal != address(0), "Unknown commitment");

        bytes memory payload = abi.encodeWithSelector(
            IJsonApiAgent.fetchUint.selector,
            mapsApiUrl,
            jsonSelector,
            uint8(0) // no decimal scaling
        );

        uint256 deposit = platform.getRequestDeposit() + (JSON_API_COST_PER_AGENT * SUBCOMMITTEE_SIZE);
        uint256 requestId = platform.createRequest{value: deposit}(
            jsonApiAgentId,
            address(this),
            this.handleResponse.selector,
            payload
        );

        pendingRequests[requestId] = PendingRequest({
            requestType: RequestType.ContextFetch,
            commitmentId: commitmentId,
            principal: state.principal,
            exists: true
        });

        emit AgentRequestSent(requestId, RequestType.ContextFetch, commitmentId);
    }

    // ──────────────────────────────────────────────
    // VIEW FUNCTIONS
    // ──────────────────────────────────────────────

    function getCommitmentState(bytes32 commitmentId)
        external
        view
        returns (CommitmentState memory)
    {
        return commitmentStates[commitmentId];
    }

    function isAuthorized(address principal) external view returns (bool) {
        return authorizedPrincipals[principal];
    }

    function getConfig(address principal) external view returns (AgentConfig memory) {
        return agentConfigs[principal];
    }

    function getAgentDeposit() external view returns (uint256) {
        return platform.getRequestDeposit();
    }

    // ──────────────────────────────────────────────
    // INTERNAL HELPERS
    // ──────────────────────────────────────────────

    struct StashedParams {
        IPunctualityProtocol.LocationData startLocation;
        IPunctualityProtocol.LocationData targetLocation;
        string context;
        uint256 stakeAmount;
        uint256 distanceKm;
    }

    mapping(bytes32 => StashedParams) private _stashedParams;

    function _stashCommitmentParams(
        bytes32 tempId,
        address /* principal */,
        IPunctualityProtocol.LocationData calldata startLocation,
        IPunctualityProtocol.LocationData calldata targetLocation,
        string calldata context,
        uint256 stakeAmount
    ) internal {
        uint256 distance = punctualityCore.calculateDistance(
            startLocation.latitude, startLocation.longitude,
            targetLocation.latitude, targetLocation.longitude
        );

        _stashedParams[tempId] = StashedParams({
            startLocation: startLocation,
            targetLocation: targetLocation,
            context: context,
            stakeAmount: stakeAmount,
            distanceKm: distance / 1000 // approximate km
        });
    }

    function _getStashedParams(bytes32 tempId) internal view returns (StashedParams memory) {
        return _stashedParams[tempId];
    }

    function _getStashedDistanceKm(bytes32 tempId) internal view returns (uint256) {
        return _stashedParams[tempId].distanceKm;
    }

    function _buildPacePrompt(
        address principal,
        uint256 reputation,
        uint256 distance,
        string calldata context
    ) internal pure returns (string memory) {
        return string(abi.encodePacked(
            "Principal address: ", _addressToString(principal), ". ",
            "Reputation score: ", _uint2str(reputation), "/10000. ",
            "Distance: ", _uint2str(distance), " units. ",
            "Context: ", context, ". ",
            "Recommend the optimal travel pace in seconds per kilometer. ",
            "Lower reputation = more conservative (slower) pace. ",
            "Urgent context = faster pace with less buffer. ",
            "Return a single integer representing seconds per kilometer."
        ));
    }

    function _contextBuffer(string memory context) internal pure returns (uint256) {
        bytes32 contextHash = keccak256(abi.encodePacked(context));
        if (contextHash == keccak256(abi.encodePacked("urgent"))) return 300;   // 5 min
        if (contextHash == keccak256(abi.encodePacked("work"))) return 600;     // 10 min
        return 900; // 15 min default
    }

    function _isOnTime(bytes32 commitmentId) internal view returns (bool) {
        CommitmentState memory state = commitmentStates[commitmentId];
        return block.timestamp <= state.deadline;
    }

    function _removeActiveCommitment(address principal, bytes32 commitmentId) internal {
        bytes32[] storage ids = _activeCommitmentIds[principal];
        for (uint256 i = 0; i < ids.length; i++) {
            if (ids[i] == commitmentId) {
                ids[i] = ids[ids.length - 1];
                ids.pop();
                return;
            }
        }
    }

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

    function _addressToString(address addr) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory data = abi.encodePacked(addr);
        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < data.length; i++) {
            str[2 + i * 2] = alphabet[uint8(data[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }

    // ──────────────────────────────────────────────
    // RECEIVE STT (for agent call refunds)
    // ──────────────────────────────────────────────

    receive() external payable {}

    /**
     * @dev Withdraw STT trapped from failed LLM calls.
     *      Only the principal who authorized can withdraw their own stuck funds.
     */
    function withdrawStuckFunds() external {
        require(authorizedPrincipals[msg.sender], "Not authorized");
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "Withdraw failed");
    }

    /**
     * @dev Allow the contract deployer to recover stuck funds.
     */
    function ownerWithdraw() external {
        require(msg.sender == owner, "Only owner");
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "Withdraw failed");
    }
}
