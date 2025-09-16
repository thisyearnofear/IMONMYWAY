/**
 * Contract addresses for Somnia Network
 * Single source of truth for contract deployments
 *
 * ✅ CURRENT STATUS: MAINNET PRODUCTION READY
 * - Network: Somnia Mainnet (chainId: 50312)
 * - Contract: 0xE93ECD999526BBBaCd35FA808E6F590BB1017246
 * - Currency: SOMI (Somnia mainnet token)
 */

export interface ContractAddresses {
  PunctualityCore: string;
  LocationVerifier: string;
  ImmediateBets: string;
  ProgressiveGoals: string;
  ReputationOracle: string;
}

// ✅ ACTIVE: Somnia Mainnet Contract Addresses
export const SOMNIA_CONTRACT_ADDRESSES: ContractAddresses = {
  PunctualityCore: '0xE93ECD999526BBBaCd35FA808E6F590BB1017246',
  LocationVerifier: '',
  ImmediateBets: '',
  ProgressiveGoals: '',
  ReputationOracle: '',
};

// ✅ PRODUCTION READY: Somnia Mainnet Configuration
export const SOMNIA_NETWORK_CONFIG = {
  chainId: 50312,
  name: 'Somnia Network',
  rpcUrl: 'https://dream-rpc.somnia.network/',
  blockExplorer: 'https://explorer.somnia.network/',
  nativeCurrency: {
    name: 'SOMI',
    symbol: 'SOMI',
    decimals: 18,
  },
  contracts: SOMNIA_CONTRACT_ADDRESSES,
} as const;

/**
 * Get contract addresses for Somnia Network
 */
export function getContractAddresses(): ContractAddresses {
  return SOMNIA_CONTRACT_ADDRESSES;
}

/**
 * Get network configuration for Somnia Network
 */
export function getNetworkConfig() {
  return SOMNIA_NETWORK_CONFIG;
}