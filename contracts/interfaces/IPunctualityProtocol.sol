// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title IPunctualityProtocol
 * @dev Interface for the Punctuality Protocol contracts
 * Defines the core functions and events for punctuality betting
 */
interface IPunctualityProtocol {
    
    struct LocationData {
        int256 latitude;   // Scaled by 1e6 for precision
        int256 longitude;  // Scaled by 1e6 for precision
        uint256 accuracy;  // In meters
        uint256 timestamp;
    }
    
    struct ETACommitment {
        address user;
        uint256 stakeAmount;
        uint256 commitmentTime;
        uint256 arrivalDeadline;
        LocationData startLocation;
        LocationData targetLocation;
        uint256 estimatedDistance;
        uint256 estimatedPace;
        bool fulfilled;
        bool successful;
        uint256 actualArrivalTime;
        uint256 totalBetsFor;
        uint256 totalBetsAgainst;
    }

    // Events
    event CommitmentCreated(
        bytes32 indexed commitmentId,
        address indexed user,
        uint256 stakeAmount,
        uint256 arrivalDeadline,
        LocationData startLocation,
        LocationData targetLocation
    );
    
    event CommitmentFulfilled(
        bytes32 indexed commitmentId,
        address indexed user,
        bool successful,
        uint256 actualArrivalTime,
        uint256 rewardAmount
    );
    
    event BetPlaced(
        bytes32 indexed commitmentId,
        address indexed bettor,
        uint256 betAmount,
        bool bettingFor
    );

    // Core functions
    function createCommitment(
        LocationData memory startLocation,
        LocationData memory targetLocation,
        uint256 arrivalDeadline,
        uint256 estimatedPace
    ) external payable returns (bytes32);

    function placeBet(bytes32 commitmentId, bool bettingFor) external payable;

    function fulfillCommitment(
        bytes32 commitmentId,
        LocationData memory arrivalLocation
    ) external;

    function calculateDistance(
        int256 lat1,
        int256 lon1,
        int256 lat2,
        int256 lon2
    ) external pure returns (uint256);

    function calculateETA(uint256 distance, uint256 pace) external pure returns (uint256);

    function getCommitment(bytes32 commitmentId) external view returns (ETACommitment memory);

    function getUserReputation(address user) external view returns (uint256);
}