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
    somnia: {
      url: "https://dream-rpc.somnia.network/",
      chainId: 50312,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    somnia_testnet: {
      url: "https://dream-rpc.somnia.network/",
      chainId: 50312,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  }
};

module.exports = config;