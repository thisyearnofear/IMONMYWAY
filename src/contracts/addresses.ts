/**
 * Contract addresses for different networks
 * Single source of truth for contract deployments
 */

export interface ContractAddresses {
  PunctualityCore: string;
  LocationVerifier: string;
  ImmediateBets: string;
  ProgressiveGoals: string;
  ReputationOracle: string;
}

// Somnia Testnet addresses (will be populated after deployment)
export const SOMNIA_TESTNET_ADDRESSES: ContractAddresses = {
  PunctualityCore: '0x41f2fA6E60A34c26BD2C467d21EcB0a2f9087B03', // To be filled after deployment
  LocationVerifier: '',
  ImmediateBets: '',
  ProgressiveGoals: '',
  ReputationOracle: '',
};

// Somnia Mainnet addresses (for future deployment)
export const SOMNIA_MAINNET_ADDRESSES: ContractAddresses = {
  PunctualityCore: '0x41f2fA6E60A34c26BD2C467d21EcB0a2f9087B03',
  LocationVerifier: '',
  ImmediateBets: '',
  ProgressiveGoals: '',
  ReputationOracle: '',
};

// Network configuration - CONSOLIDATED (DRY principle)
export const NETWORKS = {
  SOMNIA_TESTNET: {
    chainId: 5031, // Somnia Shannon Testnet chain ID
    name: 'Somnia Shannon Testnet',
    rpcUrl: 'https://dream-rpc.somnia.network/',
    blockExplorer: 'https://shannon-explorer.somnia.network/',
    nativeCurrency: {
      name: 'STT',
      symbol: 'STT',
      decimals: 18,
    },
    contracts: SOMNIA_TESTNET_ADDRESSES,
  },
  SOMNIA_MAINNET: {
    chainId: 50312, // Somnia Mainnet chain ID (LIVE DEPLOYMENT)
    name: 'Somnia Network',
    rpcUrl: 'https://dream-rpc.somnia.network/',
    blockExplorer: 'https://shannon-explorer.somnia.network/',
    nativeCurrency: {
      name: 'SOMI',
      symbol: 'SOMI',
      decimals: 18,
    },
    contracts: SOMNIA_MAINNET_ADDRESSES,
  },
} as const;

export type NetworkName = keyof typeof NETWORKS;

/**
 * Get contract addresses for current network
 */
export function getContractAddresses(networkName: NetworkName): ContractAddresses {
  return NETWORKS[networkName].contracts;
}

/**
 * Get network configuration
 */
export function getNetworkConfig(networkName: NetworkName) {
  return NETWORKS[networkName];
}