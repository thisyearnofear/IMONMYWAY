/**
 * Hero State Hook - Clean Separation of Concerns
 * Manages hero section state and wallet interactions
 */

import { useMemo } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { getWalletStateInfo, formatAddress, type HeroState, type WalletStateInfo } from '@/lib/wallet-utils';

export interface HeroStateReturn {
  // State
  heroState: HeroState;
  walletInfo: WalletStateInfo;
  formattedAddress: string;
  
  // Actions
  connect: () => void;
  switchToSomnia: () => void;
  
  // Status
  isConnecting: boolean;
  isConnected: boolean;
}

/**
 * Custom hook for managing hero section state
 * Encapsulates wallet logic and provides clean interface
 */
export function useHeroState(): HeroStateReturn {
  const {
    isConnected,
    address,
    chainId,
    connect,
    switchToSomnia,
    isConnecting,
  } = useWallet();

  // Memoize wallet state info to prevent unnecessary recalculations
  const walletInfo = useMemo(
    () => getWalletStateInfo(isConnected, chainId),
    [isConnected, chainId]
  );

  // Memoize formatted address
  const formattedAddress = useMemo(
    () => address ? formatAddress(address) : '',
    [address]
  );

  return {
    // State
    heroState: walletInfo.state,
    walletInfo,
    formattedAddress,
    
    // Actions
    connect,
    switchToSomnia,
    
    // Status
    isConnecting,
    isConnected,
  };
}