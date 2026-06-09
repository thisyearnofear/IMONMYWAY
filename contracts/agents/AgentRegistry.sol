// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title AgentRegistry
 * @dev On-chain registry for agent discovery and counterparty matching.
 *      Bounded storage, proposal TTL, functional getActiveListings.
 */
contract AgentRegistry {

    uint256 public constant MAX_COMMITMENTS_PER_PRINCIPAL = 10;
    uint256 public constant PROPOSAL_TTL = 24 hours;

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

    mapping(bytes32 => AgentListing) public listings;
    mapping(address => bytes32[]) private _principalCommitments;
    mapping(bytes32 => Proposal[]) private _commitmentProposals;
    mapping(address => address) public agentToPrincipal;

    // Active listings index for getActiveListings
    bytes32[] private _activeListingIds;

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
        address indexed proposerPrincipal,
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
        require(
            _principalCommitments[principal].length < MAX_COMMITMENTS_PER_PRINCIPAL,
            "Max commitments reached"
        );

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
        _activeListingIds.push(commitmentId);

        emit AgentListed(commitmentId, principal, msg.sender, deadline, stakeAmount, context);
    }

    function delistAgent(bytes32 commitmentId) external {
        AgentListing storage listing = listings[commitmentId];
        require(listing.agentContract == msg.sender, "Only listing agent can delist");
        listing.active = false;
        _removeActiveListing(commitmentId);
        emit AgentDelisted(commitmentId, listing.principal);
    }

    // ──────────────────────────────────────────────
    // DISCOVERY
    // ──────────────────────────────────────────────

    function findAgentByPrincipal(
        address targetPrincipal
    ) external view returns (AgentListing memory) {
        bytes32[] memory commitments = _principalCommitments[targetPrincipal];
        for (uint256 i = commitments.length; i > 0; i--) {
            AgentListing memory listing = listings[commitments[i - 1]];
            if (listing.active && listing.deadline > block.timestamp) {
                return listing;
            }
        }
        revert("No active agent found for principal");
    }

    /**
     * @dev Get active listings with pagination.
     */
    function getActiveListings(uint256 limit, uint256 offset)
        external
        view
        returns (AgentListing[] memory results, uint256 total)
    {
        // Count active listings
        uint256 count = 0;
        for (uint256 i = 0; i < _activeListingIds.length; i++) {
            if (listings[_activeListingIds[i]].active) count++;
        }
        total = count;

        // Paginate
        uint256 start = offset;
        uint256 end = offset + limit;
        if (end > count) end = count;
        uint256 size = end > start ? end - start : 0;

        results = new AgentListing[](size);
        uint256 idx = 0;
        for (uint256 i = 0; i < _activeListingIds.length && idx < size; i++) {
            AgentListing storage listing = listings[_activeListingIds[i]];
            if (listing.active && listing.deadline > block.timestamp) {
                if (idx >= start - offset) {
                    results[idx] = listing;
                }
                idx++;
            }
        }
    }

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

        // Expire old proposals before adding new one
        _expireStaleProposals(targetCommitmentId);

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
        require(
            block.timestamp <= proposals[proposalIndex].createdAt + PROPOSAL_TTL,
            "Proposal expired"
        );

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

    function getProposals(bytes32 commitmentId)
        external
        view
        returns (Proposal[] memory)
    {
        return _commitmentProposals[commitmentId];
    }

    function getPrincipalCommitments(address principal)
        external
        view
        returns (bytes32[] memory)
    {
        return _principalCommitments[principal];
    }

    function getListing(bytes32 commitmentId)
        external
        view
        returns (AgentListing memory)
    {
        return listings[commitmentId];
    }

    // ──────────────────────────────────────────────
    // INTERNAL
    // ──────────────────────────────────────────────

    function _removeActiveListing(bytes32 commitmentId) internal {
        for (uint256 i = 0; i < _activeListingIds.length; i++) {
            if (_activeListingIds[i] == commitmentId) {
                _activeListingIds[i] = _activeListingIds[_activeListingIds.length - 1];
                _activeListingIds.pop();
                return;
            }
        }
    }

    function _expireStaleProposals(bytes32 commitmentId) internal {
        Proposal[] storage proposals = _commitmentProposals[commitmentId];
        for (uint256 i = 0; i < proposals.length; i++) {
            if (proposals[i].status == ProposalStatus.Pending &&
                block.timestamp > proposals[i].createdAt + PROPOSAL_TTL) {
                proposals[i].status = ProposalStatus.Expired;
            }
        }
    }
}
