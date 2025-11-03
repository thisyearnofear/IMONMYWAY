// Contract service for interacting with the Punctuality Protocol contracts
// Real blockchain integration using ethers.js

import { ethers } from 'ethers';
import { getContract } from '@/lib/contracts';
import { getNetworkConfig } from '@/contracts/addresses';

// Event types
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

// Commitment data structure
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

/**
 * Initialize contract service with signer
 */
export class ContractService {
  private contract: ethers.Contract;
  private provider: ethers.Provider;
  private signer: ethers.Signer | null;

  constructor(signer: ethers.Signer | null = null) {
    const networkConfig = getNetworkConfig();
    this.signer = signer;
    
    // Create provider
    this.provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    
    // Create contract instance
    if (signer) {
      this.contract = getContract(networkConfig.chainId, signer);
    } else {
      // Fallback to provider-only contract for read operations
      const { contracts } = networkConfig;
      this.contract = new ethers.Contract(contracts.PunctualityCore, [
        // Read-only functions
        "function getCommitment(bytes32 commitmentId) view returns (tuple(address,uint256,uint256,uint256,tuple(int256,int256,uint256,uint256),tuple(int256,int256,uint256,uint256),uint256,uint256,bool,bool,uint256,uint256,uint256))",
        "function getUserReputation(address user) view returns (uint256)",
      ], this.provider);
    }
  }

  /**
   * Create a new commitment
   */
  async createCommitment(
    startLocation: [bigint, bigint, bigint, bigint],
    targetLocation: [bigint, bigint, bigint, bigint],
    arrivalDeadline: bigint,
    estimatedPace: bigint,
    stakeAmount: string
  ): Promise<string> {
    if (!this.signer) {
      throw new Error('Signer required for write operations');
    }

    try {
      const tx = await this.contract.createCommitment(
        startLocation,
        targetLocation,
        arrivalDeadline,
        estimatedPace,
        { value: ethers.parseEther(stakeAmount) }
      );
      
      const receipt = await tx.wait();
      
      // Extract commitment ID from events
      const commitmentCreatedEvent = receipt.logs.find((log: any) => {
        try {
          const parsedLog = this.contract.interface.parseLog(log);
          return parsedLog?.name === 'CommitmentCreated';
        } catch {
          return false;
        }
      });
      
      if (commitmentCreatedEvent) {
        const parsedEvent = this.contract.interface.parseLog(commitmentCreatedEvent);
        return parsedEvent?.args.commitmentId;
      }
      
      throw new Error('Failed to extract commitment ID from transaction');
    } catch (error) {
      console.error('Error creating commitment:', error);
      throw error;
    }
  }

  /**
   * Place a bet on a commitment
   */
  async placeBet(
    commitmentId: string,
    bettingFor: boolean,
    betAmount: string
  ): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer required for write operations');
    }

    try {
      const tx = await this.contract.placeBet(
        commitmentId,
        bettingFor,
        { value: ethers.parseEther(betAmount) }
      );
      
      await tx.wait();
    } catch (error) {
      console.error('Error placing bet:', error);
      throw error;
    }
  }

  /**
   * Fulfill a commitment
   */
  async fulfillCommitment(
    commitmentId: string,
    arrivalLocation: [bigint, bigint, bigint, bigint]
  ): Promise<void> {
    if (!this.signer) {
      throw new Error('Signer required for write operations');
    }

    try {
      const tx = await this.contract.fulfillCommitment(
        commitmentId,
        arrivalLocation
      );
      
      await tx.wait();
    } catch (error) {
      console.error('Error fulfilling commitment:', error);
      throw error;
    }
  }

  /**
   * Get commitment details
   */
  async getCommitment(commitmentId: string): Promise<Commitment | null> {
    try {
      const commitment = await this.contract.getCommitment(commitmentId);
      
      return {
        user: commitment.user,
        stakeAmount: commitment.stakeAmount,
        arrivalDeadline: commitment.arrivalDeadline,
        startTime: commitment.startTime,
        startLocation: commitment.startLocation,
        targetLocation: commitment.targetLocation,
        pace: commitment.pace,
        distance: commitment.distance,
        fulfilled: commitment.fulfilled,
        successful: commitment.successful,
        actualArrivalTime: commitment.actualArrivalTime,
        rewardAmount: commitment.rewardAmount,
        totalBetsFor: commitment.totalBetsFor,
        totalBetsAgainst: commitment.totalBetsAgainst,
      };
    } catch (error) {
      console.error('Error getting commitment:', error);
      return null;
    }
  }

  /**
   * Get user reputation
   */
  async getUserReputation(userAddress: string): Promise<bigint> {
    try {
      return await this.contract.getUserReputation(userAddress);
    } catch (error) {
      console.error('Error getting user reputation:', error);
      return BigInt(0);
    }
  }

  /**
   * Listen for commitment created events
   */
  onCommitmentCreated(callback: (event: CommitmentCreatedEvent) => void): void {
    this.contract.on('CommitmentCreated', (
      commitmentId: string,
      user: string,
      stakeAmount: bigint,
      arrivalDeadline: bigint,
      startLocation: [bigint, bigint, bigint, bigint],
      targetLocation: [bigint, bigint, bigint, bigint]
    ) => {
      callback({
        commitmentId,
        user,
        stakeAmount,
        arrivalDeadline,
        startLocation,
        targetLocation,
      });
    });
  }

  /**
   * Listen for commitment fulfilled events
   */
  onCommitmentFulfilled(callback: (event: CommitmentFulfilledEvent) => void): void {
    this.contract.on('CommitmentFulfilled', (
      commitmentId: string,
      user: string,
      successful: boolean,
      actualArrivalTime: bigint,
      rewardAmount: bigint
    ) => {
      callback({
        commitmentId,
        user,
        successful,
        actualArrivalTime,
        rewardAmount,
      });
    });
  }

  /**
   * Listen for bet placed events
   */
  onBetPlaced(callback: (event: BetPlacedEvent) => void): void {
    this.contract.on('BetPlaced', (
      commitmentId: string,
      bettor: string,
      betAmount: bigint,
      bettingFor: boolean
    ) => {
      callback({
        commitmentId,
        bettor,
        betAmount,
        bettingFor,
      });
    });
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners(): void {
    this.contract.removeAllListeners();
  }
}