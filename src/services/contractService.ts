// Contract service for the Punctuality Protocol + Agent layer
// Bridges frontend to PunctualityCore, PunctualityAgent, and AgentRegistry

import { ethers } from 'ethers';
import { getContract, getAgentContract, getRegistryContract, CORE_ABI, AGENT_ABI, REGISTRY_ABI } from '@/lib/contracts';
import { getNetworkConfig, getContractAddresses } from '@/contracts/addresses';

// ── Types ──────────────────────────────────────────────────

export interface CommitmentCreatedEvent {
  commitmentId: string;
  user: string;
  stakeAmount: bigint;
  arrivalDeadline: bigint;
  startLocation: [bigint, bigint, bigint, bigint];
  targetLocation: [bigint, bigint, bigint, bigint];
}

export interface CommitmentFulfilledEvent {
  commitmentId: string;
  user: string;
  successful: boolean;
  actualArrivalTime: bigint;
  rewardAmount: bigint;
}

export interface BetPlacedEvent {
  commitmentId: string;
  bettor: string;
  betAmount: bigint;
  bettingFor: boolean;
}

export interface Commitment {
  user: string;
  stakeAmount: bigint;
  arrivalDeadline: bigint;
  startTime: bigint;
  startLocation: [bigint, bigint, bigint, bigint];
  targetLocation: [bigint, bigint, bigint, bigint];
  pace: bigint;
  distance: bigint;
  fulfilled: boolean;
  successful: boolean;
  actualArrivalTime: bigint;
  rewardAmount: bigint;
  totalBetsFor: bigint;
  totalBetsAgainst: bigint;
}

export interface UserPerformanceHistory {
  commitmentId: string;
  estimatedDistance: number;
  estimatedPace: number;
  actualArrivalTime: number;
  arrivalDeadline: number;
  successful: boolean;
  timestamp: number;
}

export interface AgentConfig {
  maxStake: string;
  minReputation: bigint;
  autoAcceptProposals: boolean;
  autoPostSocial: boolean;
  personality: string;
}

export interface AgentCommitmentState {
  principal: string;
  commitmentId: string;
  deadline: bigint;
  stakeAmount: bigint;
  startLocation: [bigint, bigint, bigint, bigint];
  targetLocation: [bigint, bigint, bigint, bigint];
  context: string;
  decidedPace: bigint;
  settled: boolean;
}

export interface AgentDecisionEvent {
  requestId: bigint;
  requestType: number;
  commitmentId: string;
  decision: string;
}

export interface AgentSocialEvent {
  commitmentId: string;
  eventType: string;
  message: string;
}

export interface LocationData {
  latitude: bigint;
  longitude: bigint;
  accuracy: bigint;
  timestamp: bigint;
}

export interface AgentListingData {
  commitmentId: string;
  principal: string;
  agentContract: string;
  deadline: number;
  stakeAmount: bigint;
  context: string;
}

export interface LeaderboardUserData {
  address: string;
  reputation: number;
  totalSessions: number;
  successRate: number;
}

// ── ContractService ────────────────────────────────────────

export class ContractService {
  private contract: ethers.Contract;
  private agentContract: ethers.Contract | null;
  private registryContract: ethers.Contract | null;
  private provider: ethers.Provider;
  private signer: ethers.Signer | null;

  constructor(signer: ethers.Signer | null = null) {
    const networkConfig = getNetworkConfig();
    this.signer = signer;
    this.provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);

    if (signer) {
      this.contract = getContract(networkConfig.chainId, signer);
      this.agentContract = getAgentContract(signer);
      this.registryContract = getRegistryContract(signer);
    } else {
      const addresses = getContractAddresses();
      this.contract = new ethers.Contract(addresses.PunctualityCore, CORE_ABI, this.provider);
      this.agentContract = addresses.PunctualityAgent
        ? new ethers.Contract(addresses.PunctualityAgent, AGENT_ABI, this.provider)
        : null;
      this.registryContract = addresses.AgentRegistry
        ? new ethers.Contract(addresses.AgentRegistry, REGISTRY_ABI, this.provider)
        : null;
    }
  }

  // ── CORE: Commitment Operations ──────────────────────────

  async createCommitment(
    startLocation: [bigint, bigint, bigint, bigint],
    targetLocation: [bigint, bigint, bigint, bigint],
    arrivalDeadline: bigint,
    estimatedPace: bigint,
    stakeAmount: string
  ): Promise<string> {
    if (!this.signer) throw new Error('Signer required');
    const tx = await this.contract.createCommitment(
      startLocation, targetLocation, arrivalDeadline, estimatedPace,
      { value: ethers.parseEther(stakeAmount) }
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find((log: any) => {
      try { return this.contract.interface.parseLog(log)?.name === 'CommitmentCreated'; } catch { return false; }
    });
    if (event) return this.contract.interface.parseLog(event)?.args.commitmentId;
    throw new Error('Failed to extract commitment ID');
  }

  async placeBet(commitmentId: string, bettingFor: boolean, betAmount: string): Promise<void> {
    if (!this.signer) throw new Error('Signer required');
    const tx = await this.contract.placeBet(commitmentId, bettingFor, { value: ethers.parseEther(betAmount) });
    await tx.wait();
  }

  async fulfillCommitment(commitmentId: string, arrivalLocation: [bigint, bigint, bigint, bigint]): Promise<void> {
    if (!this.signer) throw new Error('Signer required');
    const tx = await this.contract.fulfillCommitment(commitmentId, arrivalLocation);
    await tx.wait();
  }

  async getCommitment(commitmentId: string): Promise<Commitment | null> {
    try {
      const c = await this.contract.getCommitment(commitmentId);
      return {
        user: c.user, stakeAmount: c.stakeAmount, arrivalDeadline: c.arrivalDeadline,
        startTime: c.startTime, startLocation: c.startLocation, targetLocation: c.targetLocation,
        pace: c.pace, distance: c.distance, fulfilled: c.fulfilled, successful: c.successful,
        actualArrivalTime: c.actualArrivalTime, rewardAmount: c.rewardAmount,
        totalBetsFor: c.totalBetsFor, totalBetsAgainst: c.totalBetsAgainst,
      };
    } catch { return null; }
  }

  async getUserReputation(userAddress: string): Promise<bigint> {
    try { return await this.contract.getUserReputation(userAddress); } catch { return BigInt(0); }
  }

  // ── AGENT: Authorization ─────────────────────────────────

  async authorizeAgent(config: AgentConfig, fundingAmount: string = '0'): Promise<void> {
    if (!this.signer || !this.agentContract) throw new Error('Signer and agent contract required');
    const tx = await this.agentContract.authorizeAgent(
      {
        maxStake: ethers.parseEther(config.maxStake),
        minReputation: config.minReputation,
        autoAcceptProposals: config.autoAcceptProposals,
        autoPostSocial: config.autoPostSocial,
        personality: config.personality,
      },
      { value: fundingAmount ? ethers.parseEther(fundingAmount) : BigInt(0) }
    );
    await tx.wait();
  }

  async revokeAgent(): Promise<void> {
    if (!this.signer || !this.agentContract) throw new Error('Signer and agent contract required');
    const tx = await this.agentContract.revokeAgent();
    await tx.wait();
  }

  async updateAgentConfig(config: AgentConfig): Promise<void> {
    if (!this.signer || !this.agentContract) throw new Error('Signer and agent contract required');
    const tx = await this.agentContract.updateConfig({
      maxStake: ethers.parseEther(config.maxStake),
      minReputation: config.minReputation,
      autoAcceptProposals: config.autoAcceptProposals,
      autoPostSocial: config.autoPostSocial,
      personality: config.personality,
    });
    await tx.wait();
  }

  async isAgentAuthorized(principal: string): Promise<boolean> {
    if (!this.agentContract) throw new Error('Agent contract not available');
    return await this.agentContract.isAuthorized(principal);
  }

  async getAgentConfig(principal: string): Promise<AgentConfig | null> {
    if (!this.agentContract) return null;
    try {
      const c = await this.agentContract.getConfig(principal);
      return {
        maxStake: ethers.formatEther(c.maxStake),
        minReputation: c.minReputation,
        autoAcceptProposals: c.autoAcceptProposals,
        autoPostSocial: c.autoPostSocial,
        personality: c.personality,
      };
    } catch { return null; }
  }

  async getActiveCommitmentCount(principal: string): Promise<bigint> {
    if (!this.agentContract) return BigInt(0);
    return await this.agentContract.activeCommitmentCount(principal);
  }

  // ── AGENT: Commitment Lifecycle ──────────────────────────

  async initiateAgentCommitment(
    startLocation: LocationData,
    targetLocation: LocationData,
    context: string,
    stakeAmount: string
  ): Promise<void> {
    if (!this.signer || !this.agentContract) throw new Error('Signer and agent contract required');
    const tx = await this.agentContract.initiateCommitment(
      startLocation,
      targetLocation,
      context,
      { value: ethers.parseEther(stakeAmount) }
    );
    await tx.wait();
  }

  async fetchRouteContext(commitmentId: string, mapsApiUrl: string, jsonSelector: string): Promise<void> {
    if (!this.signer || !this.agentContract) throw new Error('Signer and agent contract required');
    const tx = await this.agentContract.fetchRouteContext(commitmentId, mapsApiUrl, jsonSelector);
    await tx.wait();
  }

  async getAgentCommitmentState(commitmentId: string): Promise<AgentCommitmentState | null> {
    if (!this.agentContract) return null;
    try {
      const s = await this.agentContract.getCommitmentState(commitmentId);
      return {
        principal: s.principal,
        commitmentId: s.commitmentId,
        deadline: s.deadline,
        stakeAmount: s.stakeAmount,
        startLocation: s.startLocation,
        targetLocation: s.targetLocation,
        context: s.context,
        decidedPace: s.decidedPace,
        settled: s.settled,
      };
    } catch { return null; }
  }

  // ── AGENT: Agent-to-Agent ────────────────────────────────

  async evaluateProposal(ourCommitmentId: string, proposalIndex: number): Promise<void> {
    if (!this.signer || !this.agentContract) throw new Error('Signer and agent contract required');
    const tx = await this.agentContract.evaluateProposal(ourCommitmentId, proposalIndex);
    await tx.wait();
  }

  async proposeToCounterparty(
    ourCommitmentId: string,
    targetCommitmentId: string,
    message: string
  ): Promise<void> {
    if (!this.signer || !this.agentContract) throw new Error('Signer and agent contract required');
    const tx = await this.agentContract.proposeToCounterparty(ourCommitmentId, targetCommitmentId, message);
    await tx.wait();
  }

  // ── REGISTRY: Discovery ──────────────────────────────────

  async hasActiveAgent(principal: string): Promise<boolean> {
    if (!this.registryContract) return false;
    return await this.registryContract.hasActiveAgent(principal);
  }

  async findAgentByPrincipal(principal: string) {
    if (!this.registryContract) throw new Error('Registry contract not available');
    return await this.registryContract.findAgentByPrincipal(principal);
  }

  async getAgentDeposit(): Promise<bigint> {
    if (!this.agentContract) return BigInt(0);
    return await this.agentContract.getAgentDeposit();
  }

  // ── HISTORY: On-chain performance analysis ───────────────

  async getUserPerformanceHistory(userAddress: string): Promise<UserPerformanceHistory[]> {
    try {
      const createdFilter = this.contract.filters.CommitmentCreated(null, userAddress);
      const createdEvents = await this.contract.queryFilter(createdFilter);
      const fulfilledFilter = this.contract.filters.CommitmentFulfilled(null, userAddress);
      const fulfilledEvents = await this.contract.queryFilter(fulfilledFilter);

      const history: UserPerformanceHistory[] = [];
      for (const createdEvent of createdEvents) {
        if ('args' in createdEvent && createdEvent.args) {
          const commitmentId = createdEvent.args.commitmentId;
          if (!commitmentId) continue;
          const fulfilledEvent = fulfilledEvents.find(e =>
            'args' in e && e.args && e.args.commitmentId === commitmentId
          );
          if (fulfilledEvent && 'args' in fulfilledEvent && fulfilledEvent.args) {
            const commitment = await this.getCommitment(commitmentId);
            if (commitment) {
              history.push({
                commitmentId,
                estimatedDistance: Number(commitment.distance),
                estimatedPace: Number(commitment.pace),
                actualArrivalTime: Number(fulfilledEvent.args.actualArrivalTime || 0),
                arrivalDeadline: Number(commitment.arrivalDeadline),
                successful: fulfilledEvent.args.successful || false,
                timestamp: Number(commitment.startTime)
              });
            }
          }
        }
      }
      return history.sort((a, b) => b.timestamp - a.timestamp);
    } catch { return []; }
  }

  // ── REGISTRY: Live Listings ────────────────────────────────

  async getRecentListings(limit: number = 20): Promise<AgentListingData[]> {
    if (!this.registryContract) return [];
    try {
      const filter = this.registryContract.filters.AgentListed();
      const events = await this.registryContract.queryFilter(filter);
      const listings: AgentListingData[] = [];
      for (const event of events.slice(-limit).reverse()) {
        if ('args' in event && event.args) {
          listings.push({
            commitmentId: event.args.commitmentId,
            principal: event.args.principal,
            agentContract: event.args.agentContract,
            deadline: Number(event.args.deadline),
            stakeAmount: event.args.stakeAmount,
            context: event.args.context,
          });
        }
      }
      return listings;
    } catch { return []; }
  }

  // ── LEADERBOARD: On-chain user aggregation ─────────────────

  async getLeaderboardUsers(): Promise<LeaderboardUserData[]> {
    try {
      const fulfilledFilter = this.contract.filters.CommitmentFulfilled();
      const fulfilledEvents = await this.contract.queryFilter(fulfilledFilter);

      const userMap = new Map<string, { totalSessions: number; successes: number }>();
      for (const event of fulfilledEvents) {
        if ('args' in event && event.args) {
          const user = event.args.user;
          const existing = userMap.get(user) || { totalSessions: 0, successes: 0 };
          existing.totalSessions++;
          if (event.args.successful) existing.successes++;
          userMap.set(user, existing);
        }
      }

      const users: LeaderboardUserData[] = [];
      for (const [address, stats] of userMap) {
        const reputation = await this.getUserReputation(address);
        users.push({
          address,
          reputation: Number(reputation),
          totalSessions: stats.totalSessions,
          successRate: stats.totalSessions > 0 ? (stats.successes / stats.totalSessions) * 100 : 0,
        });
      }
      return users.sort((a, b) => b.reputation - a.reputation);
    } catch { return []; }
  }

  // ── EVENT LISTENERS: Core ────────────────────────────────

  onCommitmentCreated(callback: (event: CommitmentCreatedEvent) => void): void {
    this.contract.on('CommitmentCreated', (
      commitmentId: string, user: string, stakeAmount: bigint,
      arrivalDeadline: bigint, startLocation: [bigint, bigint, bigint, bigint],
      targetLocation: [bigint, bigint, bigint, bigint]
    ) => {
      callback({ commitmentId, user, stakeAmount, arrivalDeadline, startLocation, targetLocation });
    });
  }

  onCommitmentFulfilled(callback: (event: CommitmentFulfilledEvent) => void): void {
    this.contract.on('CommitmentFulfilled', (
      commitmentId: string, user: string, successful: boolean,
      actualArrivalTime: bigint, rewardAmount: bigint
    ) => {
      callback({ commitmentId, user, successful, actualArrivalTime, rewardAmount });
    });
  }

  onBetPlaced(callback: (event: BetPlacedEvent) => void): void {
    this.contract.on('BetPlaced', (
      commitmentId: string, bettor: string, betAmount: bigint, bettingFor: boolean
    ) => {
      callback({ commitmentId, bettor, betAmount, bettingFor });
    });
  }

  // ── EVENT LISTENERS: Agent ───────────────────────────────

  onAgentDecisionMade(callback: (event: AgentDecisionEvent) => void): void {
    if (!this.agentContract) return;
    this.agentContract.on('AgentDecisionMade', (
      requestId: bigint, requestType: number, commitmentId: string, decision: string
    ) => {
      callback({ requestId, requestType, commitmentId, decision });
    });
  }

  onAgentCreatedCommitment(callback: (commitmentId: string, principal: string, pace: bigint, reasoning: string) => void): void {
    if (!this.agentContract) return;
    this.agentContract.on('AgentCreatedCommitment', (
      commitmentId: string, principal: string, pace: bigint, reasoning: string
    ) => {
      callback(commitmentId, principal, pace, reasoning);
    });
  }

  onAgentSettledCommitment(callback: (commitmentId: string, success: boolean, reasoning: string) => void): void {
    if (!this.agentContract) return;
    this.agentContract.on('AgentSettledCommitment', (
      commitmentId: string, success: boolean, reasoning: string
    ) => {
      callback(commitmentId, success, reasoning);
    });
  }

  onAgentSocialUpdate(callback: (event: AgentSocialEvent) => void): void {
    if (!this.agentContract) return;
    this.agentContract.on('AgentSocialUpdate', (
      commitmentId: string, eventType: string, message: string
    ) => {
      callback({ commitmentId, eventType, message });
    });
  }

  removeAllListeners(): void {
    this.contract.removeAllListeners();
    this.agentContract?.removeAllListeners();
    this.registryContract?.removeAllListeners();
  }
}

export const contractService = new ContractService();
