/**
 * Contract addresses for Somnia Network
 * Single source of truth for contract deployments
 *
 * After deploying with `npx hardhat run scripts/deploy-agents.cjs --network somniaTestnet`,
 * paste the output addresses here.
 */
export interface ContractAddresses {
  PunctualityCore: string;
  AgentRegistry: string;
  PunctualityAgent: string;
}

// Somnia platform contract (not deployed by us — provided by Somnia)
export const SOMNIA_PLATFORM_ADDRESS = {
  mainnet: '0x5E5205CF39E766118C01636bED000A54D93163E6',
  testnet: '0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776',
} as const;

// Somnia Mainnet Contract Addresses
export const SOMNIA_MAINNET_CONTRACT_ADDRESSES: ContractAddresses = {
  PunctualityCore: '0xE93ECD999526BBBaCd35FA808E6F590BB1017246',
  AgentRegistry: '',    // Deploy and paste
  PunctualityAgent: '', // Deploy and paste
};

// Somnia Testnet Contract Addresses
export const SOMNIA_TESTNET_CONTRACT_ADDRESSES: ContractAddresses = {
  PunctualityCore: '0x6Ba7C599F33fCBe1A9a5848FDE4D4EFA495A25c9',
  AgentRegistry: '0x81F47d5BD7A79d75ee7d20F5a2cfcfDaf9d05775',
  PunctualityAgent: '0x24D16d61De02c29706c51C7a473410a88BF44663',
};

// Somnia agent IDs (registered at agents.somnia.network)
export const SOMNIA_AGENT_IDS = {
  llmInference: '12847293847561029384',
  jsonApiRequest: '13174292974160097713',
} as const;

// Somnia Mainnet Configuration
export const SOMNIA_MAINNET_CONFIG = {
  chainId: 5031,
  name: 'Somnia Mainnet',
  rpcUrl: 'https://api.infra.mainnet.somnia.network/',
  wsUrl: 'wss://api.infra.mainnet.somnia.network/',
  blockExplorer: 'https://explorer.somnia.network/',
  nativeCurrency: {
    name: 'SOMI',
    symbol: 'SOMI',
    decimals: 18,
  },
  contracts: SOMNIA_MAINNET_CONTRACT_ADDRESSES,
  platformAddress: SOMNIA_PLATFORM_ADDRESS.mainnet,
} as const;

// Somnia Testnet Configuration
export const SOMNIA_TESTNET_CONFIG = {
  chainId: 50312,
  name: 'Somnia Testnet',
  rpcUrl: 'https://api.infra.testnet.somnia.network/',
  wsUrl: 'wss://api.infra.testnet.somnia.network/',
  blockExplorer: 'https://shannon-explorer.somnia.network/',
  nativeCurrency: {
    name: 'STT',
    symbol: 'STT',
    decimals: 18,
  },
  contracts: SOMNIA_TESTNET_CONTRACT_ADDRESSES,
  platformAddress: SOMNIA_PLATFORM_ADDRESS.testnet,
} as const;

const ACTIVE_NETWORK = process.env.NEXT_PUBLIC_NETWORK === 'mainnet' ? SOMNIA_MAINNET_CONFIG : SOMNIA_TESTNET_CONFIG;

export function getContractAddresses(): ContractAddresses {
  return ACTIVE_NETWORK.contracts;
}

export function getNetworkConfig() {
  return ACTIVE_NETWORK;
}
