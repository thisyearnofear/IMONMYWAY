// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "../interfaces/IPunctualityProtocol.sol";
import "../lib/Math.sol";
import "../lib/ReentrancyGuard.sol";

/**
 * @title PunctualityCore
 * @dev Core contract for the Punctuality Protocol.
 *      Settlement, betting, reputation — single source of truth.
 */
contract PunctualityCore is IPunctualityProtocol, ReentrancyGuard {

    // ── Errors (save ~50 gas per revert vs require strings) ──────

    error ZeroStake();
    error DeadlineInPast();
    error ZeroPace();
    error CommitmentNotFound();
    error CommitmentAlreadyFulfilled();
    error DeadlinePassed();
    error ZeroBet();
    error CannotBetOnSelf();
    error AlreadyBet();
    error NotCommitmentCreator();
    error OnlyOwner();
    error ZeroAddressRecipient();

    // ── State ────────────────────────────────────────────────────

    mapping(bytes32 => ETACommitment) public commitments;
    mapping(address => uint256) public userReputations;
    mapping(bytes32 => mapping(address => bool)) public betsPlaced;

    uint256 public constant REPUTATION_BASE = 5000;
    uint256 public constant REPUTATION_MIN = 1000;
    uint256 public constant REPUTATION_MAX = 10000;
    uint256 public constant LOCATION_TOLERANCE = 100; // meters

    // Commitment ID nonce — prevents same-block ID collisions
    uint256 private _commitmentNonce;

    // Owner — two-step transfer pattern
    address private _owner;
    address private _pendingOwner;

    event ContractDeployed(address indexed deployer, uint256 timestamp);
    event OwnershipTransferStarted(address indexed currentOwner, address indexed pendingOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ── Modifiers ────────────────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != _owner) revert OnlyOwner();
        _;
    }

    // ── Constructor ──────────────────────────────────────────────

    constructor() {
        _owner = msg.sender;
        userReputations[msg.sender] = REPUTATION_BASE;
        emit ContractDeployed(msg.sender, block.timestamp);
    }

    // ── Ownership (two-step) ─────────────────────────────────────

    function owner() public view returns (address) {
        return _owner;
    }

    function pendingOwner() public view returns (address) {
        return _pendingOwner;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        if (newOwner == address(0)) revert ZeroAddressRecipient();
        _pendingOwner = newOwner;
        emit OwnershipTransferStarted(_owner, newOwner);
    }

    function acceptOwnership() public {
        if (msg.sender != _pendingOwner) revert OnlyOwner();
        emit OwnershipTransferred(_owner, msg.sender);
        _owner = msg.sender;
        _pendingOwner = address(0);
    }

    // ── Commitment Creation ──────────────────────────────────────

    function createCommitment(
        LocationData memory startLocation,
        LocationData memory targetLocation,
        uint256 arrivalDeadline,
        uint256 estimatedPace
    ) external payable nonReentrant returns (bytes32) {
        if (msg.value == 0) revert ZeroStake();
        if (arrivalDeadline <= block.timestamp) revert DeadlineInPast();
        if (estimatedPace == 0) revert ZeroPace();

        // ID uses block.number + nonce — no prevrandao dependency
        bytes32 commitmentId = keccak256(
            abi.encodePacked(msg.sender, block.number, _commitmentNonce++)
        );

        uint256 distance = calculateDistance(
            startLocation.latitude,
            startLocation.longitude,
            targetLocation.latitude,
            targetLocation.longitude
        );

        commitments[commitmentId] = ETACommitment({
            user: msg.sender,
            stakeAmount: msg.value,
            commitmentTime: block.timestamp,
            arrivalDeadline: arrivalDeadline,
            startLocation: startLocation,
            targetLocation: targetLocation,
            estimatedDistance: distance,
            estimatedPace: estimatedPace,
            fulfilled: false,
            successful: false,
            actualArrivalTime: 0,
            totalBetsFor: 0,
            totalBetsAgainst: 0
        });

        emit CommitmentCreated(
            commitmentId,
            msg.sender,
            msg.value,
            arrivalDeadline,
            startLocation,
            targetLocation
        );

        return commitmentId;
    }

    // ── Betting ──────────────────────────────────────────────────

    function placeBet(bytes32 commitmentId, bool bettingFor) external payable nonReentrant {
        ETACommitment storage commitment = commitments[commitmentId];

        if (commitment.user == address(0)) revert CommitmentNotFound();
        if (commitment.fulfilled) revert CommitmentAlreadyFulfilled();
        if (block.timestamp >= commitment.arrivalDeadline) revert DeadlinePassed();
        if (msg.value == 0) revert ZeroBet();
        if (msg.sender == commitment.user) revert CannotBetOnSelf();
        if (betsPlaced[commitmentId][msg.sender]) revert AlreadyBet();

        betsPlaced[commitmentId][msg.sender] = true;

        if (bettingFor) {
            commitment.totalBetsFor += msg.value;
        } else {
            commitment.totalBetsAgainst += msg.value;
        }

        emit BetPlaced(commitmentId, msg.sender, msg.value, bettingFor);
    }

    // ── Fulfillment & Settlement ─────────────────────────────────

    function fulfillCommitment(
        bytes32 commitmentId,
        LocationData memory arrivalLocation
    ) external nonReentrant {
        ETACommitment storage commitment = commitments[commitmentId];

        if (commitment.user == address(0)) revert CommitmentNotFound();
        if (commitment.fulfilled) revert CommitmentAlreadyFulfilled();
        if (msg.sender != commitment.user) revert NotCommitmentCreator();

        // Effects before interactions (CEI pattern)
        commitment.fulfilled = true;
        commitment.actualArrivalTime = block.timestamp;

        bool onTime = block.timestamp <= commitment.arrivalDeadline;
        uint256 distanceToTarget = calculateDistance(
            arrivalLocation.latitude,
            arrivalLocation.longitude,
            commitment.targetLocation.latitude,
            commitment.targetLocation.longitude
        );
        bool atLocation = distanceToTarget <= LOCATION_TOLERANCE;
        commitment.successful = onTime && atLocation;

        uint256 rewardAmount = 0;

        if (commitment.successful) {
            // On time: stake + opposing bets returned to user
            rewardAmount = commitment.stakeAmount + commitment.totalBetsAgainst;
            // Pay user — call() not transfer()
            _sendEth(commitment.user, rewardAmount);

            userReputations[commitment.user] = Math.min(
                REPUTATION_MAX,
                userReputations[commitment.user] + 100
            );
        } else {
            // Failed: pool = stake + bets-for, distributed to bettors-against
            uint256 totalPool = commitment.stakeAmount + commitment.totalBetsFor;

            if (commitment.totalBetsAgainst > 0 && totalPool > 0) {
                // Proportional payout to each bettor-against
                // For simplicity: send totalPool to a pending-withdrawal mapping
                // In production, use a pull-payment pattern
                _pendingWithdrawals[commitmentId] = totalPool;
            }

            userReputations[commitment.user] = Math.max(
                REPUTATION_MIN,
                userReputations[commitment.user] - 100
            );
        }

        emit CommitmentFulfilled(
            commitmentId,
            commitment.user,
            commitment.successful,
            block.timestamp,
            rewardAmount
        );
    }

    // ── Pending Withdrawals (pull-payment for failed commitments) ─

    mapping(bytes32 => uint256) public _pendingWithdrawals;

    /**
     * @dev Bettors-against claim their share after a failed commitment.
     *      Simplified: totalPool is sent to first claimer. In production,
     *      track per-bettor shares.
     */
    function claimWinnings(bytes32 commitmentId) external nonReentrant {
        uint256 amount = _pendingWithdrawals[commitmentId];
        if (amount == 0) revert CommitmentNotFound();
        delete _pendingWithdrawals[commitmentId];
        _sendEth(msg.sender, amount);
    }

    // ── Helpers ──────────────────────────────────────────────────

    function calculateDistance(
        int256 lat1, int256 lon1,
        int256 lat2, int256 lon2
    ) public pure returns (uint256) {
        int256 dLat = lat2 - lat1;
        int256 dLon = lon2 - lon1;
        int256 sum = (dLat * dLat) + (dLon * dLon);
        return uint256(sum / 1_000_000);
    }

    function calculateETA(uint256 distance, uint256 pace) public pure returns (uint256) {
        return distance * pace;
    }

    function getCommitment(bytes32 commitmentId) external view returns (ETACommitment memory) {
        return commitments[commitmentId];
    }

    function getUserReputation(address user) external view returns (uint256) {
        uint256 reputation = userReputations[user];
        if (reputation == 0) return REPUTATION_BASE;
        return reputation;
    }

    // ── Internal ─────────────────────────────────────────────────

    function _sendEth(address to, uint256 amount) internal {
        (bool success, ) = payable(to).call{value: amount}("");
        if (!success) revert FailedEthTransfer();
    }

    error FailedEthTransfer();
}
