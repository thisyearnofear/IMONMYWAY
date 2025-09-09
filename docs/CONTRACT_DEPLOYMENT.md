# Smart Contract Deployment Guide

## Prerequisites

1. Install Node.js (version 18 or higher)
2. Install pnpm (package manager)
3. Set up a wallet with STT tokens on Somnia Testnet
4. Export your wallet's private key (keep it secure!)

## Deployment Steps

### 1. Set up environment variables

Create or update your `.env.local` file with your private key:

```env
# Blockchain configuration
PRIVATE_KEY="your_wallet_private_key_here"
```

**⚠️ Security Warning**: Never commit your private key to version control!

### 2. Install dependencies

```bash
pnpm install
```

### 3. Compile the contracts

```bash
pnpm compile
```

### 4. Deploy to Somnia Testnet

```bash
pnpm deploy --network somnia_testnet
```

### 5. Note the deployed contract address

After successful deployment, you'll see output like:
```
PunctualityCore deployed to: 0xYourContractAddressHere
```

### 6. Update contract addresses

Update the `src/contracts/addresses.ts` file with the deployed address:

```typescript
// Somnia Testnet addresses (will be populated after deployment)
export const SOMNIA_TESTNET_ADDRESSES: ContractAddresses = {
  PunctualityCore: '0xYourContractAddressHere', // ← UPDATE THIS
  LocationVerifier: '',
  ImmediateBets: '',
  ProgressiveGoals: '',
  ReputationOracle: '',
};
```

### 7. Verify the deployment (optional)

You can verify the contract on the Somnia Testnet explorer:
1. Go to https://shannon-explorer.somnia.network/
2. Search for your contract address
3. Verify the contract source code

## Troubleshooting

### Common Issues

1. **Invalid account error**: Make sure your private key is correctly formatted (64 characters, no 0x prefix)

2. **Insufficient funds**: Make sure your wallet has enough STT tokens for gas fees

3. **Network connection issues**: Check that you can connect to the Somnia RPC endpoint

### Deployment Script Customization

You can customize the deployment script in `scripts/deploy.js`:
- Add constructor parameters if needed
- Modify gas settings
- Add additional deployment steps

## Mainnet Deployment

To deploy to Somnia Mainnet:

1. Update your `.env.local` with a Mainnet wallet private key
2. Run the deployment command:

```bash
pnpm deploy --network somnia
```

3. Update the Mainnet addresses in `src/contracts/addresses.ts`