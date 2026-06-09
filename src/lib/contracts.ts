// Contract utilities for the Punctuality Protocol
// Includes core settlement, agent orchestration, and agent registry ABIs

import { ethers } from 'ethers';
import { getContractAddresses, getNetworkConfig } from '@/contracts/addresses';

// ── PunctualityCore ABI ────────────────────────────────────
export const CORE_ABI = [
  "function createCommitment(tuple(int256,int256,uint256,uint256) startLocation, tuple(int256,int256,uint256,uint256) targetLocation, uint256 arrivalDeadline, uint256 estimatedPace) payable returns (bytes32)",
  "function placeBet(bytes32 commitmentId, bool bettingFor) payable",
  "function fulfillCommitment(bytes32 commitmentId, tuple(int256,int256,uint256,uint256) arrivalLocation)",
  "function calculateDistance(int256 lat1, int256 lon1, int256 lat2, int256 lon2) pure returns (uint256)",
  "function calculateETA(uint256 distance, uint256 pace) pure returns (uint256)",
  "function getCommitment(bytes32 commitmentId) view returns (tuple(address,uint256,uint256,uint256,tuple(int256,int256,uint256,uint256),tuple(int256,int256,uint256,uint256),uint256,uint256,bool,bool,uint256,uint256,uint256))",
  "function getUserReputation(address user) view returns (uint256)",
  "event CommitmentCreated(bytes32 indexed commitmentId, address indexed user, uint256 stakeAmount, uint256 arrivalDeadline, tuple(int256,int256,uint256,uint256) startLocation, tuple(int256,int256,uint256,uint256) targetLocation)",
  "event CommitmentFulfilled(bytes32 indexed commitmentId, address indexed user, bool successful, uint256 actualArrivalTime, uint256 rewardAmount)",
  "event BetPlaced(bytes32 indexed commitmentId, address indexed bettor, uint256 betAmount, bool bettingFor)"
];

// ── PunctualityAgent ABI ───────────────────────────────────
export const AGENT_ABI = [
  // Authorization
  "function authorizeAgent(tuple(uint256 maxStake, uint256 minReputation, bool autoAcceptProposals, bool autoPostSocial, string personality)) payable",
  "function revokeAgent()",
  "function updateConfig(tuple(uint256 maxStake, uint256 minReputation, bool autoAcceptProposals, bool autoPostSocial, string personality))",

  // Commitment lifecycle
  "function initiateCommitment(tuple(int256 latitude, int256 longitude, uint256 accuracy, uint256 timestamp) startLocation, tuple(int256 latitude, int256 longitude, uint256 accuracy, uint256 timestamp) targetLocation, string context) payable",
  "function fetchRouteContext(bytes32 commitmentId, string mapsApiUrl, string jsonSelector) payable",

  // Agent-to-agent
  "function evaluateProposal(bytes32 ourCommitmentId, uint256 proposalIndex)",
  "function proposeToCounterparty(bytes32 ourCommitmentId, bytes32 targetCommitmentId, string message) payable",

  // View functions
  "function getCommitmentState(bytes32 commitmentId) view returns (tuple(address principal, bytes32 commitmentId, uint256 deadline, uint256 stakeAmount, tuple(int256,int256,uint256,uint256) startLocation, tuple(int256,int256,uint256,uint256) targetLocation, string context, uint256 decidedPace, bool settled))",
  "function isAuthorized(address principal) view returns (bool)",
  "function getConfig(address principal) view returns (tuple(uint256 maxStake, uint256 minReputation, bool autoAcceptProposals, bool autoPostSocial, string personality))",
  "function getAgentDeposit() view returns (uint256)",
  "function activeCommitmentCount(address principal) view returns (uint256)",

  // Events
  "event AgentAuthorized(address indexed principal, uint256 maxStake, string personality)",
  "event AgentRevoked(address indexed principal)",
  "event AgentRequestSent(uint256 indexed requestId, uint8 requestType, bytes32 indexed commitmentId)",
  "event AgentDecisionMade(uint256 indexed requestId, uint8 requestType, bytes32 indexed commitmentId, string decision)",
  "event AgentCreatedCommitment(bytes32 indexed commitmentId, address indexed principal, uint256 pace, string reasoning)",
  "event AgentSettledCommitment(bytes32 indexed commitmentId, bool success, string reasoning)",
  "event AgentSocialUpdate(bytes32 indexed commitmentId, string eventType, string message)",
  "event AgentDeadlineCheck(bytes32 indexed commitmentId, uint256 timeRemaining)",
  "event AgentProposalHandled(bytes32 indexed commitmentId, address proposerAgent, bool accepted)"
];

// ── AgentRegistry ABI ──────────────────────────────────────
export const REGISTRY_ABI = [
  // Listing
  "function listAgent(bytes32 commitmentId, address principal, uint256 deadline, uint256 stakeAmount, string context)",
  "function delistAgent(bytes32 commitmentId)",

  // Discovery
  "function findAgentByPrincipal(address targetPrincipal) view returns (tuple(address agentContract, address principal, bytes32 commitmentId, uint256 deadline, uint256 stakeAmount, string context, bool active, uint256 listedAt))",
  "function hasActiveAgent(address principal) view returns (bool)",
  "function getListing(bytes32 commitmentId) view returns (tuple(address agentContract, address principal, bytes32 commitmentId, uint256 deadline, uint256 stakeAmount, string context, bool active, uint256 listedAt))",
  "function getPrincipalCommitments(address principal) view returns (bytes32[])",

  // Proposals
  "function sendProposal(bytes32 targetCommitmentId, bytes32 proposerCommitmentId, address proposerPrincipal, uint256 proposedDeadline, uint256 proposedStake, string message)",
  "function respondToProposal(bytes32 targetCommitmentId, uint256 proposalIndex, bool accepted)",
  "function getProposals(bytes32 commitmentId) view returns (tuple(address proposerAgent, address proposerPrincipal, bytes32 proposerCommitmentId, uint256 proposedDeadline, uint256 proposedStake, string message, uint8 status, uint256 createdAt)[])",

  // Events
  "event AgentListed(bytes32 indexed commitmentId, address indexed principal, address agentContract, uint256 deadline, uint256 stakeAmount, string context)",
  "event AgentDelisted(bytes32 indexed commitmentId, address indexed principal)",
  "event ProposalSent(bytes32 indexed targetCommitmentId, address indexed proposerAgent, address proposerPrincipal, string message)",
  "event ProposalResponded(bytes32 indexed targetCommitmentId, address indexed proposerAgent, bool accepted)",
  "event AgentMatched(bytes32 indexed commitmentA, bytes32 indexed commitmentB, address indexed principalA, address principalB)"
];

// ── Contract factory helpers ───────────────────────────────

export function getContract(chainId: number, signer: ethers.Signer) {
  const addresses = getContractAddresses();
  return new ethers.Contract(addresses.PunctualityCore, CORE_ABI, signer);
}

export function getAgentContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  const addresses = getContractAddresses();
  return new ethers.Contract(addresses.PunctualityAgent, AGENT_ABI, signerOrProvider);
}

export function getRegistryContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  const addresses = getContractAddresses();
  return new ethers.Contract(addresses.AgentRegistry, REGISTRY_ABI, signerOrProvider);
}

// ── Utility functions ──────────────────────────────────────

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 1000);
}

export async function estimateGasCost(operation: string, params: any, signer: ethers.Signer, chainId: number) {
  try {
    const contract = getContract(chainId, signer);
    let gasEstimate;
    switch (operation) {
      case 'createCommitment':
        gasEstimate = await contract.createCommitment.estimateGas(
          params.startLocation, params.targetLocation, params.deadline, params.pace,
          { value: ethers.parseEther(params.stakeAmount) }
        );
        break;
      case 'placeBet':
        gasEstimate = await contract.placeBet.estimateGas(
          params.commitmentId, params.bettingFor,
          { value: ethers.parseEther(params.betAmount) }
        );
        break;
      case 'fulfillCommitment':
        gasEstimate = await contract.fulfillCommitment.estimateGas(
          params.commitmentId, params.arrivalLocation
        );
        break;
      default:
        gasEstimate = BigInt(100000);
    }
    const gasPrice = await signer.provider?.getFeeData();
    const gasCost = gasEstimate * (gasPrice?.gasPrice || BigInt(1000000000));
    return Number(ethers.formatEther(gasCost));
  } catch (error) {
    console.error('Error estimating gas:', error);
    const baseCosts: Record<string, number> = {
      createCommitment: 0.001,
      placeBet: 0.0005,
      fulfillCommitment: 0.0007
    };
    return baseCosts[operation] || 0.0005;
  }
}
