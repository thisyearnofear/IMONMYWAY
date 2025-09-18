/**
 * Wallet Utilities - Single Source of Truth
 * Consolidates all wallet-related logic and utilities
 */

export type HeroState = 'CONNECT_WALLET' | 'SWITCH_NETWORK' | 'READY_TO_USE';

export interface WalletStateInfo {
  state: HeroState;
  networkName: string;
  isOnCorrectNetwork: boolean;
}

/**
 * Format wallet address for display
 * @param address - Full wallet address
 * @returns Formatted address (e.g., "0x1234...5678")
 */
export function formatAddress(address: string): string {
  if (!address) return 'Unknown';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get network name from chain ID
 * @param chainId - Blockchain chain ID
 * @returns Human-readable network name
 */
export function getNetworkName(chainId: number | undefined): string {
  switch (chainId) {
    case 50311:
      return 'Somnia';
    case 42161:
      return 'Arbitrum';
    case 1:
      return 'Ethereum';
    default:
      return 'Unknown Network';
  }
}

/**
 * Check if connected to correct network (Somnia)
 * @param chainId - Current chain ID
 * @returns True if on Somnia network
 */
export function isOnSomniaNetwork(chainId: number | undefined): boolean {
  return chainId === 50311;
}

/**
 * Determine hero state based on wallet connection status
 * @param isConnected - Wallet connection status
 * @param chainId - Current chain ID
 * @returns Hero state enum
 */
export function getHeroState(isConnected: boolean, chainId: number | undefined): HeroState {
  if (!isConnected) return 'CONNECT_WALLET';
  if (!isOnSomniaNetwork(chainId)) return 'SWITCH_NETWORK';
  return 'READY_TO_USE';
}

/**
 * Get comprehensive wallet state information
 * @param isConnected - Wallet connection status
 * @param chainId - Current chain ID
 * @returns Complete wallet state info
 */
export function getWalletStateInfo(isConnected: boolean, chainId: number | undefined): WalletStateInfo {
  return {
    state: getHeroState(isConnected, chainId),
    networkName: getNetworkName(chainId),
    isOnCorrectNetwork: isOnSomniaNetwork(chainId),
  };
}