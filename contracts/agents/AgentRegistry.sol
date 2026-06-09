// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title AgentRegistry
 * @dev On-chain registry for agent discovery and counterparty matching.
 *      Agents list their active commitments here so other agents can find them.
 *      Designed for Somnia's Agentic L1 — agents subscribe to AgentListed events
 *      via on-chain reactivity to discover new counterparties autonomously.
 */
contract AgentRegistry {

    struct AgentListing {
        address agentContract;
        address principal;
        bytes32 commitmentId;
        uint256 deadline;
        uint256 stakeAmount;
        string context;
        bool active;
        uint256 listedAt;
    }

    struct Proposal {
        address proposerAgent;
        address proposerPrincipal;
        bytes32 proposerCommitmentId;
        uint256 proposedDeadline;
        uint256 proposedStake;
        string message;
        ProposalStatus status;
        uint256 createdAt;
    }

    enum ProposalStatus { Pending, Accepted, Rejected, Expired }

    // commitmentId => listing
    mapping(bytes32 => AgentListing) public listings;

    // principal => list of commitment IDs
    mapping(address => bytes32[]) private _principalCommitments;

    // commitmentId => list of proposals received
    mapping(bytes32 => Proposal[]) private _commitmentProposals;

    // agent contract => principal (for verification)
    mapping(address => address) public agentToPrincipal;

    // Events for reactivity subscriptions
    event AgentListed(
        bytes32 indexed commitmentId,
        address indexed principal,
        address agentContract,
        uint256 deadline,
        uint256 stakeAmount,
        string context
    );

    event AgentDelisted(
        bytes32 indexed commitmentId,
        address indexed principal
    );

    event ProposalSent(
        bytes32 indexed targetCommitmentId,
        address indexed proposerAgent,
        address proposerPrincipal,
        string message
    );

    event ProposalResponded(
        bytes32 indexed targetCommitmentId,
        address indexed proposerAgent,
        bool accepted
    );

    event AgentMatched(
        bytes32 indexed commitmentA,
        bytes32 indexed commitmentB,
        address indexed principalA,
        address principalB
    );

    // ──────────────────────────────────────────────
    // LISTING
    // ──────────────────────────────────────────────

    /**
     * @dev List an agent's active commitment for discovery
     */
    function listAgent(
        bytes32 commitmentId,
        address principal,
        uint256 deadline,
        uint256 stakeAmount,
        string calldata context
    ) external {
        require(!listings[commitmentId].active || listings[commitmentId].agentContract == address(0),
            "Already listed");
        require(deadline > block.timestamp, "Deadline must be in the future");

        listings[commitmentId] = AgentListing({
            agentContract: msg.sender,
            principal: principal,
            commitmentId: commitmentId,
            deadline: deadline,
            stakeAmount: stakeAmount,
            context: context,
            active: true,
            listedAt: block.timestamp
        });

        agentToPrincipal[msg.sender] = principal;
        _principalCommitments[principal].push(commitmentId);

        emit AgentListed(commitmentId, principal, msg.sender, deadline, stakeAmount, context);
    }

    /**
     * @dev Remove a listing (commitment completed or cancelled)
     */
    function delistAgent(bytes32 commitmentId) external {
        AgentListing storage listing = listings[commitmentId];
        require(listing.agentContract == msg.sender, "Only listing agent can delist");
        listing.active = false;
        emit AgentDelisted(commitmentId, listing.principal);
    }

    // ──────────────────────────────────────────────
    // DISCOVERY
    // ──────────────────────────────────────────────

    /**
     * @dev Find the most recent active agent for a given principal
     */
    function findAgentByPrincipal(
        address targetPrincipal
    ) external view returns (AgentListing memory) {
        bytes32[] memory commitments = _principalCommitments[targetPrincipal];
        // Search from newest to oldest
        for (uint256 i = commitments.length; i > 0; i--) {
            AgentListing memory listing = listings[commitments[i - 1]];
            if (listing.active && listing.deadline > block.timestamp) {
                return listing;
            }
        }
        revert("No active agent found for principal");
    }

    /**
     * @dev Get all active listings (for frontend/off-chain indexing)
     *      In production, use Data Streams or subgraph for this.
     */
    function getActiveListings(uint256 /* limit */, uint256 /* offset */)
        external
        pure
        returns (AgentListing[] memory results, uint256 total)
    {
        // Placeholder — real implementation would use an indexed array
        // For hackathon: track via events and off-chain indexing
        results = new AgentListing[](0);
        return (results, 0);
    }

    /**
     * @dev Check if a principal has any active agent
     */
    function hasActiveAgent(address principal) external view returns (bool) {
        bytes32[] memory commitments = _principalCommitments[principal];
        for (uint256 i = commitments.length; i > 0; i--) {
            AgentListing memory listing = listings[commitments[i - 1]];
            if (listing.active && listing.deadline > block.timestamp) {
                return true;
            }
        }
        return false;
    }

    // ──────────────────────────────────────────────
    // AGENT-TO-AGENT PROPOSALS
    // ──────────────────────────────────────────────

    /**
     * @dev Send a proposal to a listed agent's counterparty
     *      Called by an agent who discovered a listing and wants to negotiate
     */
    function sendProposal(
        bytes32 targetCommitmentId,
        bytes32 proposerCommitmentId,
        address proposerPrincipal,
        uint256 proposedDeadline,
        uint256 proposedStake,
        string calldata message
    ) external {
        AgentListing memory target = listings[targetCommitmentId];
        require(target.active, "Target listing not active");

        _commitmentProposals[targetCommitmentId].push(Proposal({
            proposerAgent: msg.sender,
            proposerPrincipal: proposerPrincipal,
            proposerCommitmentId: proposerCommitmentId,
            proposedDeadline: proposedDeadline,
            proposedStake: proposedStake,
            message: message,
            status: ProposalStatus.Pending,
            createdAt: block.timestamp
        }));

        emit ProposalSent(targetCommitmentId, msg.sender, proposerPrincipal, message);
    }

    /**
     * @dev Respond to a proposal (accept/reject)
     */
    function respondToProposal(
        bytes32 targetCommitmentId,
        uint256 proposalIndex,
        bool accepted
    ) external {
        AgentListing memory listing = listings[targetCommitmentId];
        require(listing.agentContract == msg.sender, "Only target agent can respond");

        Proposal[] storage proposals = _commitmentProposals[targetCommitmentId];
        require(proposalIndex < proposals.length, "Invalid proposal index");
        require(proposals[proposalIndex].status == ProposalStatus.Pending, "Proposal already resolved");

        proposals[proposalIndex].status = accepted
            ? ProposalStatus.Accepted
            : ProposalStatus.Rejected;

        emit ProposalResponded(
            targetCommitmentId,
            proposals[proposalIndex].proposerAgent,
            accepted
        );

        if (accepted) {
            emit AgentMatched(
                targetCommitmentId,
                proposals[proposalIndex].proposerCommitmentId,
                listing.principal,
                proposals[proposalIndex].proposerPrincipal
            );
        }
    }

    /**
     * @dev Get proposals for a commitment
     */
    function getProposals(bytes32 commitmentId)
        external
        view
        returns (Proposal[] memory)
    {
        return _commitmentProposals[commitmentId];
    }

    /**
     * @dev Get all commitment IDs for a principal
     */
    function getPrincipalCommitments(address principal)
        external
        view
        returns (bytes32[] memory)
    {
        return _principalCommitments[principal];
    }

    /**
     * @dev Get listing details
     */
    function getListing(bytes32 commitmentId)
        external
        view
        returns (AgentListing memory)
    {
        return listings[commitmentId];
    }
}
