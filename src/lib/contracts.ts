// Contract utilities for the Punctuality Protocol
// Real blockchain integration using ethers.js

import { ethers } from 'ethers';
import { getContractAddresses, getNetworkConfig } from '@/contracts/addresses';

// Contract ABI (simplified)
const CONTRACT_ABI = [
  // Functions
  "function createCommitment(tuple(int256,int256,uint256,uint256) startLocation, tuple(int256,int256,uint256,uint256) targetLocation, uint256 arrivalDeadline, uint256 estimatedPace) payable returns (bytes32)",
  "function placeBet(bytes32 commitmentId, bool bettingFor) payable",
  "function fulfillCommitment(bytes32 commitmentId, tuple(int256,int256,uint256,uint256) arrivalLocation)",
  "function calculateDistance(int256 lat1, int256 lon1, int256 lat2, int256 lon2) pure returns (uint256)",
  "function calculateETA(uint256 distance, uint256 pace) pure returns (uint256)",
  "function getCommitment(bytes32 commitmentId) view returns (tuple(address,uint256,uint256,uint256,tuple(int256,int256,uint256,uint256),tuple(int256,int256,uint256,uint256),uint256,uint256,bool,bool,uint256,uint256,uint256))",
  "function getUserReputation(address user) view returns (uint256)",

  // Events
  "event CommitmentCreated(bytes32 indexed commitmentId, address indexed user, uint256 stakeAmount, uint256 arrivalDeadline, tuple(int256,int256,uint256,uint256) startLocation, tuple(int256,int256,uint256,uint256) targetLocation)",
  "event CommitmentFulfilled(bytes32 indexed commitmentId, address indexed user, bool successful, uint256 actualArrivalTime, uint256 rewardAmount)",
  "event BetPlaced(bytes32 indexed commitmentId, address indexed bettor, uint256 betAmount, bool bettingFor)"
];

// Get contract instance
export function getContract(chainId: number, signer: ethers.Signer) {
  // Get contract addresses for the network
  const addresses = getContractAddresses();
  const networkConfig = getNetworkConfig();

  // Create contract instance
  const contract = new ethers.Contract(addresses.PunctualityCore, CONTRACT_ABI, signer);

  return contract;
}

// Calculate distance using haversine formula
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  // Haversine distance calculation
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 1000); // Return meters
}

// Estimate gas cost for operations
export async function estimateGasCost(operation: string, params: any, signer: ethers.Signer, chainId: number) {
  try {
    const contract = getContract(chainId, signer);

    // Estimate gas based on operation
    let gasEstimate;
    switch (operation) {
      case 'createCommitment':
        gasEstimate = await contract.createCommitment.estimateGas(
          params.startLocation,
          params.targetLocation,
          params.deadline,
          params.pace,
          { value: ethers.parseEther(params.stakeAmount) }
        );
        break;
      case 'placeBet':
        gasEstimate = await contract.placeBet.estimateGas(
          params.commitmentId,
          params.bettingFor,
          { value: ethers.parseEther(params.betAmount) }
        );
        break;
      case 'fulfillCommitment':
        gasEstimate = await contract.fulfillCommitment.estimateGas(
          params.commitmentId,
          params.arrivalLocation
        );
        break;
      default:
        gasEstimate = BigInt(100000); // Default gas estimate
    }

    // Get current gas price
    const gasPrice = await signer.provider?.getFeeData();
    const gasCost = gasEstimate * (gasPrice?.gasPrice || BigInt(1000000000));

    return Number(ethers.formatEther(gasCost));
  } catch (error) {
    console.error('Error estimating gas:', error);
    // Return default estimates
    const baseCosts = {
      createCommitment: 0.001,
      placeBet: 0.0005,
      fulfillCommitment: 0.0007
    };

    return baseCosts[operation as keyof typeof baseCosts] || 0.0005;
  }
}