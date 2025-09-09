// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "../interfaces/IPunctualityProtocol.sol";
import "../lib/Math.sol";

/**
 * @title PunctualityCore
 * @dev Core contract for the Punctuality Protocol
 * Implements punctuality betting with ETA calculations and location verification
 */
contract PunctualityCore is IPunctualityProtocol {
    
    // State variables
    mapping(bytes32 => ETACommitment) public commitments;
    mapping(address => uint256) public userReputations;
    mapping(bytes32 => mapping(address => bool)) public betsPlaced;
    
    // Constants
    uint256 public constant REPUTATION_BASE = 5000;
    uint256 public constant REPUTATION_MIN = 1000;
    uint256 public constant REPUTATION_MAX = 10000;
    uint256 public constant LOCATION_TOLERANCE = 100; // meters
    
    // Events
    event ContractDeployed(address indexed deployer, uint256 timestamp);
    
    address private _owner;
    
    modifier onlyOwner() {
        require(msg.sender == _owner, "Only owner can call this function");
        _;
    }
    
    constructor() {
        _owner = msg.sender;
        userReputations[msg.sender] = REPUTATION_BASE;
        emit ContractDeployed(msg.sender, block.timestamp);
    }
    
    /**
     * @dev Create a punctuality commitment with stake
     * @param startLocation Starting location
     * @param targetLocation Target location
     * @param arrivalDeadline Deadline for arrival
     * @param estimatedPace Estimated pace in seconds per meter
     */
    function createCommitment(
        LocationData memory startLocation,
        LocationData memory targetLocation,
        uint256 arrivalDeadline,
        uint256 estimatedPace
    ) external payable returns (bytes32) {
        require(msg.value > 0, "Stake amount must be greater than 0");
        require(arrivalDeadline > block.timestamp, "Deadline must be in the future");
        require(estimatedPace > 0, "Estimated pace must be greater than 0");
        
        bytes32 commitmentId = keccak256(abi.encodePacked(msg.sender, block.timestamp, block.difficulty));
        
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
    
    /**
     * @dev Place a bet on someone's commitment
     * @param commitmentId ID of the commitment to bet on
     * @param bettingFor Whether betting for success (true) or failure (false)
     */
    function placeBet(bytes32 commitmentId, bool bettingFor) external payable {
        ETACommitment storage commitment = commitments[commitmentId];
        
        require(commitment.user != address(0), "Commitment does not exist");
        require(!commitment.fulfilled, "Commitment already fulfilled");
        require(block.timestamp < commitment.arrivalDeadline, "Commitment deadline passed");
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(msg.sender != commitment.user, "Cannot bet on your own commitment");
        require(!betsPlaced[commitmentId][msg.sender], "Already placed bet on this commitment");
        
        betsPlaced[commitmentId][msg.sender] = true;
        
        if (bettingFor) {
            commitment.totalBetsFor += msg.value;
        } else {
            commitment.totalBetsAgainst += msg.value;
        }
        
        emit BetPlaced(commitmentId, msg.sender, msg.value, bettingFor);
    }
    
    /**
     * @dev Fulfill a commitment with proof of arrival
     * @param commitmentId ID of the commitment to fulfill
     * @param arrivalLocation Location data at arrival
     */
    function fulfillCommitment(
        bytes32 commitmentId,
        LocationData memory arrivalLocation
    ) external {
        ETACommitment storage commitment = commitments[commitmentId];
        
        require(commitment.user != address(0), "Commitment does not exist");
        require(!commitment.fulfilled, "Commitment already fulfilled");
        require(msg.sender == commitment.user, "Only commitment creator can fulfill");
        
        commitment.fulfilled = true;
        commitment.actualArrivalTime = block.timestamp;
        
        // Check if arrival is within deadline and location tolerance
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
            // User arrives on time - return stake + portion of bets against
            rewardAmount = commitment.stakeAmount;
            
            // Calculate winnings from bets against
            if (commitment.totalBetsAgainst > 0) {
                // Simple model: winner takes all from opposing side
                rewardAmount += commitment.totalBetsAgainst;
            }
            
            // Transfer reward to user
            payable(commitment.user).transfer(rewardAmount);
            
            // Update reputation
            userReputations[commitment.user] = Math.min(
                REPUTATION_MAX,
                userReputations[commitment.user] + 100
            );
        } else {
            // User fails - stake is distributed to those who bet against
            if (commitment.totalBetsFor > 0 && commitment.totalBetsAgainst > 0) {
                // Distribute stake proportionally to bets against
                uint256 totalPool = commitment.stakeAmount + commitment.totalBetsFor;
                uint256 payout = (commitment.totalBetsAgainst * totalPool) / 
                                (commitment.totalBetsFor + commitment.totalBetsAgainst);
                
                // Transfer to contract owner as fee (simplified)
                payable(_owner).transfer(totalPool - payout);
                
                // In a real implementation, this would distribute to bettors
            }
            
            // Update reputation
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
    
    /**
     * @dev Calculate distance between two points using simplified distance formula
     * @param lat1 Latitude of point 1 (scaled by 1e6)
     * @param lon1 Longitude of point 1 (scaled by 1e6)
     * @param lat2 Latitude of point 2 (scaled by 1e6)
     * @param lon2 Longitude of point 2 (scaled by 1e6)
     * @return Distance in meters
     */
    function calculateDistance(
        int256 lat1,
        int256 lon1,
        int256 lat2,
        int256 lon2
    ) public pure returns (uint256) {
        // Simplified distance calculation for demonstration purposes
        // In a real implementation, you would use the haversine formula
        int256 dLat = lat2 - lat1;
        int256 dLon = lon2 - lon1;
        
        // Square the differences
        int256 dLat2 = dLat * dLat;
        int256 dLon2 = dLon * dLon;
        
        // Sum of squares
        int256 sum = dLat2 + dLon2;
        
        // For simplicity, we'll just return a scaled version of the sum
        // This is NOT accurate but works for demonstration
        return uint256(sum / 1000000);
    }
    
    /**
     * @dev Calculate ETA based on distance and pace
     * @param distance Distance in meters
     * @param pace Pace in seconds per meter
     * @return ETA in seconds
     */
    function calculateETA(uint256 distance, uint256 pace) public pure returns (uint256) {
        return distance * pace;
    }
    
    /**
     * @dev Get commitment details
     * @param commitmentId ID of the commitment
     * @return Commitment details
     */
    function getCommitment(bytes32 commitmentId) external view returns (ETACommitment memory) {
        return commitments[commitmentId];
    }
    
    /**
     * @dev Get user reputation score
     * @param user Address of the user
     * @return Reputation score
     */
    function getUserReputation(address user) external view returns (uint256) {
        uint256 reputation = userReputations[user];
        if (reputation == 0) {
            return REPUTATION_BASE; // Default reputation
        }
        return reputation;
    }
    
    function owner() public view returns (address) {
        return _owner;
    }
    
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner is the zero address");
        _owner = newOwner;
    }
}