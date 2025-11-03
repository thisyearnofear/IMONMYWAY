// Hook for interacting with the Punctuality Protocol contracts
// Real blockchain integration using ethers.js

import { useState, useEffect, useCallback } from 'react';
import { ContractService } from '@/services/contractService';
import { useWallet } from '@/hooks/useWallet';
import { useUIStore } from '@/stores/uiStore';
import { ethers } from 'ethers';

interface CommitmentData {
  startLocation: [bigint, bigint, bigint, bigint];
  targetLocation: [bigint, bigint, bigint, bigint];
  arrivalDeadline: bigint;
  estimatedPace: bigint;
  stakeAmount: string;
}

interface BetData {
  commitmentId: string;
  bettingFor: boolean;
  betAmount: string;
}

interface FulfillmentData {
  commitmentId: string;
  arrivalLocation: [bigint, bigint, bigint, bigint];
}

export function useContractService() {
  const [contractService, setContractService] = useState<ContractService | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { address, isConnected, chainId } = useWallet();
  const { addToast } = useUIStore();

  // Initialize contract service when wallet is connected
  useEffect(() => {
    const initializeContractService = async () => {
      if (!isConnected || !address) {
        setContractService(null);
        return;
      }

      setIsInitializing(true);
      setError(null);

      try {
        // Create signer from wallet
        if (typeof window !== 'undefined' && window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const service = new ContractService(signer);
          setContractService(service);
        }
      } catch (err) {
        console.error('Error initializing contract service:', err);
        setError('Failed to initialize contract service');
        addToast({
          type: 'error',
          message: 'Failed to initialize contract service. Please check your wallet connection.'
        });
      } finally {
        setIsInitializing(false);
      }
    };

    initializeContractService();
  }, [isConnected, address, addToast]);

  // Create a new commitment
  const createCommitment = useCallback(async (data: CommitmentData): Promise<string | null> => {
    if (!contractService) {
      addToast({
        type: 'error',
        message: 'Contract service not initialized. Please connect your wallet.'
      });
      return null;
    }

    try {
      const commitmentId = await contractService.createCommitment(
        data.startLocation,
        data.targetLocation,
        data.arrivalDeadline,
        data.estimatedPace,
        data.stakeAmount
      );
      
      addToast({
        type: 'success',
        message: 'Commitment created successfully!'
      });
      
      return commitmentId;
    } catch (err) {
      console.error('Error creating commitment:', err);
      addToast({
        type: 'error',
        message: 'Failed to create commitment. Please try again.'
      });
      return null;
    }
  }, [contractService, addToast]);

  // Place a bet on a commitment
  const placeBet = useCallback(async (data: BetData): Promise<boolean> => {
    if (!contractService) {
      addToast({
        type: 'error',
        message: 'Contract service not initialized. Please connect your wallet.'
      });
      return false;
    }

    try {
      await contractService.placeBet(
        data.commitmentId,
        data.bettingFor,
        data.betAmount
      );
      
      addToast({
        type: 'success',
        message: 'Bet placed successfully!'
      });
      
      return true;
    } catch (err) {
      console.error('Error placing bet:', err);
      addToast({
        type: 'error',
        message: 'Failed to place bet. Please try again.'
      });
      return false;
    }
  }, [contractService, addToast]);

  // Fulfill a commitment
  const fulfillCommitment = useCallback(async (data: FulfillmentData): Promise<boolean> => {
    if (!contractService) {
      addToast({
        type: 'error',
        message: 'Contract service not initialized. Please connect your wallet.'
      });
      return false;
    }

    try {
      await contractService.fulfillCommitment(
        data.commitmentId,
        data.arrivalLocation
      );
      
      addToast({
        type: 'success',
        message: 'Commitment fulfilled successfully!'
      });
      
      return true;
    } catch (err) {
      console.error('Error fulfilling commitment:', err);
      addToast({
        type: 'error',
        message: 'Failed to fulfill commitment. Please try again.'
      });
      return false;
    }
  }, [contractService, addToast]);

  // Get commitment details
  const getCommitment = useCallback(async (commitmentId: string) => {
    if (!contractService) {
      addToast({
        type: 'error',
        message: 'Contract service not initialized. Please connect your wallet.'
      });
      return null;
    }

    try {
      const commitment = await contractService.getCommitment(commitmentId);
      return commitment;
    } catch (err) {
      console.error('Error fetching commitment:', err);
      addToast({
        type: 'error',
        message: 'Failed to fetch commitment details.'
      });
      return null;
    }
  }, [contractService, addToast]);

  // Get user reputation
  const getUserReputation = useCallback(async (userAddress: string) => {
    if (!contractService) {
      addToast({
        type: 'error',
        message: 'Contract service not initialized. Please connect your wallet.'
      });
      return BigInt(0);
    }

    try {
      const reputation = await contractService.getUserReputation(userAddress);
      return reputation;
    } catch (err) {
      console.error('Error fetching user reputation:', err);
      addToast({
        type: 'error',
        message: 'Failed to fetch user reputation.'
      });
      return BigInt(0);
    }
  }, [contractService, addToast]);

  // Listen for commitment created events
  const onCommitmentCreated = useCallback((callback: (event: any) => void) => {
    if (!contractService) return;
    
    contractService.onCommitmentCreated(callback);
  }, [contractService]);

  // Listen for commitment fulfilled events
  const onCommitmentFulfilled = useCallback((callback: (event: any) => void) => {
    if (!contractService) return;
    
    contractService.onCommitmentFulfilled(callback);
  }, [contractService]);

  // Listen for bet placed events
  const onBetPlaced = useCallback((callback: (event: any) => void) => {
    if (!contractService) return;
    
    contractService.onBetPlaced(callback);
  }, [contractService]);

  // Remove all event listeners
  const removeAllListeners = useCallback(() => {
    if (!contractService) return;
    
    contractService.removeAllListeners();
  }, [contractService]);

  return {
    // State
    isInitializing,
    error,
    isConnected,
    
    // Methods
    createCommitment,
    placeBet,
    fulfillCommitment,
    getCommitment,
    getUserReputation,
    onCommitmentCreated,
    onCommitmentFulfilled,
    onBetPlaced,
    removeAllListeners
  };
}