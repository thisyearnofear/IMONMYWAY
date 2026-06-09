"use client";

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { ContractService } from '@/services/contractService';
import { useWallet } from '@/hooks/useWallet';

export function useContractService() {
  const [service, setService] = useState<ContractService | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected, address } = useWallet();

  useEffect(() => {
    const init = async () => {
      if (!isConnected || !address || !(window as any).ethereum) {
        setService(null);
        return;
      }
      setIsLoading(true);
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        setService(new ContractService(signer));
      } catch {
        setService(null);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [isConnected, address]);

  const getReadOnly = useCallback((): ContractService => {
    return new ContractService();
  }, []);

  return { service, isLoading, isConnected, getReadOnly };
}
