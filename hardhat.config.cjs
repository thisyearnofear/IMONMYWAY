require("@nomicfoundation/hardhat-toolbox");
require("dotenv/config");
// Load .env.local specifically
require('dotenv').config({ path: '.env.local' });

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: {
    version: "0.8.22",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    somniaMainnet: {
      // RPCs:
      // - https://api.infra.mainnet.somnia.network/ (official)
      // - https://www.ankr.com/rpc/somnia (Ankr)
      // - https://somnia.publicnode.com (Public Node)
      // - https://somnia-json-rpc.stakely.io (Stakely)
      url: "https://api.infra.mainnet.somnia.network/",
      chainId: 5031,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    somniaTestnet: {
      url: "https://dream-rpc.somnia.network/",
      chainId: 50312,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    }
  }
};

module.exports = config;