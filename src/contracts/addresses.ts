/**
 * Contract addresses for Somnia Network
 * Single source of truth for contract deployments
 */
export interface ContractAddresses {
  PunctualityCore: string;
  LocationVerifier: string;
  ImmediateBets: string;
  ProgressiveGoals: string;
  ReputationOracle: string;
}

// ✅ ACTIVE: Somnia Mainnet Contract Addresses
export const SOMNIA_MAINNET_CONTRACT_ADDRESSES: ContractAddresses = {
  PunctualityCore: '0xE93ECD999526BBBaCd35FA808E6F590BB1017246',
  LocationVerifier: '',
  ImmediateBets: '',
  ProgressiveGoals: '',
  ReputationOracle: '',
};

// 🚨 DEVELOPMENT: Somnia Testnet Contract Addresses (replace with actual testnet addresses)
export const SOMNIA_TESTNET_CONTRACT_ADDRESSES: ContractAddresses = {
  PunctualityCore: '0x0000000000000000000000000000000000000000', // Placeholder
  LocationVerifier: '',
  ImmediateBets: '',
  ProgressiveGoals: '',
  ReputationOracle: '',
};

// ✅ PRODUCTION READY: Somnia Mainnet Configuration
export const SOMNIA_MAINNET_CONFIG = {
  chainId: 5031,
  name: 'Somnia Mainnet',
  rpcUrl: 'https://api.infra.mainnet.somnia.network/',
  blockExplorer: 'https://explorer.somnia.network/',
  nativeCurrency: {
    name: 'SOMI',
    symbol: 'SOMI',
    decimals: 18,
  },
  contracts: SOMNIA_MAINNET_CONTRACT_ADDRESSES,
} as const;

// 🚨 DEVELOPMENT: Somnia Testnet Configuration
export const SOMNIA_TESTNET_CONFIG = {
  chainId: 50312,
  name: 'Somnia Testnet',
  rpcUrl: 'https://dream-rpc.somnia.network/',
  blockExplorer: 'https://shannon-explorer.somnia.network/',
  nativeCurrency: {
    name: 'STT',
    symbol: 'STT',
    decimals: 18,
  },
  contracts: SOMNIA_TESTNET_CONTRACT_ADDRESSES,
} as const;

const ACTIVE_NETWORK = process.env.NEXT_PUBLIC_NETWORK === 'mainnet' ? SOMNIA_MAINNET_CONFIG : SOMNIA_TESTNET_CONFIG;

/**
 * Get contract addresses for the active Somnia Network
 */
export function getContractAddresses(): ContractAddresses {
  return ACTIVE_NETWORK.contracts;
}

/**
 * Get network configuration for the active Somnia Network
 */
export function getNetworkConfig() {
  return ACTIVE_NETWORK;
}
