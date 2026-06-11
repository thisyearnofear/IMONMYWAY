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
  /** Pre-formatted stake (ether units) — populated by UI loaders to avoid pulling ethers into the bundle. */
  stakeAmountFormatted?: string;
}

export interface LeaderboardUserData {
  address: string;
  reputation: number;
  totalSessions: number;
  successRate: number;
}

// ── Simple TTL Cache ─────────────────────────────────────

interface CacheEntry<T> { value: T; expires: number }

class TTLCache {
  private store = new Map<string, CacheEntry<any>>();
  private defaultTTL: number;

  constructor(defaultTTLms: number = 60_000) {
    this.defaultTTL = defaultTTLms;
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    this.store.set(key, { value, expires: Date.now() + (ttlMs ?? this.defaultTTL) });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// ── ContractService ────────────────────────────────────────

let _readOnlyInstance: ContractService | null = null;

/** Shared read-only instance. Caches + provider live for the page lifetime. */
export function getReadOnlyContractService(): ContractService {
  if (!_readOnlyInstance) _readOnlyInstance = new ContractService();
  return _readOnlyInstance;
}

export class ContractService {
  private contract: ethers.Contract;
  private agentContract: ethers.Contract | null;
  private registryContract: ethers.Contract | null;
  private provider: ethers.Provider;
  private signer: ethers.Signer | null;
  private cache = new TTLCache(60_000);

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
    for (const log of receipt.logs) {
      try {
        const parsed = this.contract.interface.parseLog(log);
        if (parsed?.name === 'CommitmentCreated') {
          this.cache.invalidate(`commitment:${parsed.args.commitmentId}`);
          return parsed.args.commitmentId;
        }
      } catch { /* skip non-matching logs */ }
    }
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
    this.cache.invalidate(`commitment:${commitmentId}`);
  }

  async getCommitment(commitmentId: string): Promise<Commitment | null> {
    const cached = this.cache.get<Commitment>(`commitment:${commitmentId}`);
    if (cached) return cached;

    try {
      const c = await this.contract.getCommitment(commitmentId);
      const result: Commitment = {
        user: c.user, stakeAmount: c.stakeAmount, arrivalDeadline: c.arrivalDeadline,
        startTime: c.commitmentTime, startLocation: c.startLocation, targetLocation: c.targetLocation,
        pace: c.estimatedPace, distance: c.estimatedDistance, fulfilled: c.fulfilled, successful: c.successful,
        actualArrivalTime: c.actualArrivalTime, rewardAmount: BigInt(0),
        totalBetsFor: c.totalBetsFor, totalBetsAgainst: c.totalBetsAgainst,
      };
      this.cache.set(`commitment:${commitmentId}`, result);
      return result;
    } catch (err) {
      console.error(`Failed to fetch commitment ${commitmentId}:`, err);
      return null;
    }
  }

  async getUserReputation(userAddress: string): Promise<bigint> {
    const cacheKey = `reputation:${userAddress}`;
    const cached = this.cache.get<bigint>(cacheKey);
    if (cached !== undefined) return cached;

    try {
      const rep = await this.contract.getUserReputation(userAddress);
      this.cache.set(cacheKey, rep, 30_000); // 30s TTL for reputation
      return rep;
    } catch (err) {
      console.error(`Failed to fetch reputation for ${userAddress}:`, err);
      return BigInt(0);
    }
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
    } catch (err) {
      console.error(`Failed to fetch agent config for ${principal}:`, err);
      return null;
    }
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
    } catch (err) {
      console.error(`Failed to fetch agent commitment state ${commitmentId}:`, err);
      return null;
    }
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
      const rpc = getNetworkConfig().rpcUrl;
      const latestBlock = await Promise.race([
        new ethers.JsonRpcProvider(rpc).getBlockNumber(),
        new Promise<number>(r => setTimeout(() => r(0), 5_000)),
      ]);
      if (latestBlock === 0) return [];

      const fromBlock = Math.max(0, latestBlock - 5000);
      const createdFilter = this.contract.filters.CommitmentCreated(null, userAddress);
      const createdEvents = await this.contract.queryFilter(createdFilter, fromBlock, latestBlock);
      const fulfilledFilter = this.contract.filters.CommitmentFulfilled(null, userAddress);
      const fulfilledEvents = await this.contract.queryFilter(fulfilledFilter, fromBlock, latestBlock);

      // Build a lookup map from fulfilled events — no per-commitment RPC calls
      const fulfilledMap = new Map<string, typeof fulfilledEvents[0]>();
      for (const e of fulfilledEvents) {
        if ('args' in e && e.args) fulfilledMap.set(e.args.commitmentId, e);
      }

      const history: UserPerformanceHistory[] = [];
      for (const createdEvent of createdEvents) {
        if (!('args' in createdEvent) || !createdEvent.args) continue;
        const commitmentId = createdEvent.args.commitmentId;
        if (!commitmentId) continue;

        const fulfilledEvent = fulfilledMap.get(commitmentId);
        if (!fulfilledEvent || !('args' in fulfilledEvent) || !fulfilledEvent.args) continue;

        // Extract data from event args directly — no extra RPC call
        history.push({
          commitmentId,
          estimatedDistance: Number(createdEvent.args.targetLocation?.[0] ?? 0), // approximate from event
          estimatedPace: 0,
          actualArrivalTime: Number(fulfilledEvent.args.actualArrivalTime || 0),
          arrivalDeadline: Number(createdEvent.args.arrivalDeadline),
          successful: fulfilledEvent.args.successful || false,
          timestamp: Number(createdEvent.args.stakeAmount ?? 0), // use commitmentTime if available
        });
      }
      return history.sort((a, b) => b.timestamp - a.timestamp);
    } catch (err) {
      console.error('Failed to fetch user performance history:', err);
      return [];
    }
  }

  // ── REGISTRY: Live Listings ────────────────────────────────

  async getRecentListings(limit: number = 20): Promise<AgentListingData[]> {
    if (!this.registryContract) return [];
    try {
      const rpc = getNetworkConfig().rpcUrl;
      const latestBlock = await Promise.race([
        new ethers.JsonRpcProvider(rpc).getBlockNumber(),
        new Promise<number>(r => setTimeout(() => r(0), 5_000)),
      ]);
      if (latestBlock === 0) return [];

      const filter = this.registryContract.filters.AgentListed();
      const events = await this.registryContract.queryFilter(filter, Math.max(0, latestBlock - 5000), latestBlock);
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
    } catch (err) {
      console.error('Failed to fetch recent listings:', err);
      return [];
    }
  }

  // ── LEADERBOARD: On-chain user aggregation ─────────────────

  async getLeaderboardUsers(): Promise<LeaderboardUserData[]> {
    try {
      const rpc = getNetworkConfig().rpcUrl;
      const latestBlock = await Promise.race([
        new ethers.JsonRpcProvider(rpc).getBlockNumber(),
        new Promise<number>(r => setTimeout(() => r(0), 5_000)),
      ]);
      if (latestBlock === 0) return [];

      const fulfilledFilter = this.contract.filters.CommitmentFulfilled();
      const fulfilledEvents = await this.contract.queryFilter(fulfilledFilter, Math.max(0, latestBlock - 5000), latestBlock);

      const userMap = new Map<string, { totalSessions: number; successes: number }>();
      for (const event of fulfilledEvents) {
        if (!('args' in event) || !event.args) continue;
        const user = event.args.user;
        const existing = userMap.get(user) || { totalSessions: 0, successes: 0 };
        existing.totalSessions++;
        if (event.args.successful) existing.successes++;
        userMap.set(user, existing);
      }

      // Batch reputation lookups — each uses cache
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
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      return [];
    }
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
      this.cache.invalidate(`commitment:${commitmentId}`);
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
    this.cache.clear();
  }
}
