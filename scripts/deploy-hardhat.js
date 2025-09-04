import pkg from 'hardhat';
const { ethers } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Deploying Punctuality Protocol to Somnia Shannon Testnet...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deploying with account:", deployer.address);

  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "STT");

  if (balance === 0n) {
    console.log("\n❌ Insufficient balance. Get STT tokens from:");
    console.log("- https://testnet.somnia.network/");
    console.log("- https://thirdweb.com/somnia-shannon-testnet");
    return;
  }

  console.log("\n📄 Compiling and deploying PunctualityCore...");

  // Get the contract factory (use fully qualified name)
  const PunctualityCore = await ethers.getContractFactory("contracts/hardhat/PunctualityCore.sol:PunctualityCore");

  // Deploy the contract (no constructor parameters)
  console.log("🔧 Deploying contract...");
  const punctualityCore = await PunctualityCore.deploy();

  // Wait for deployment
  console.log("⏳ Waiting for deployment confirmation...");
  await punctualityCore.waitForDeployment();

  const contractAddress = await punctualityCore.getAddress();
  
  console.log("\n🎉 Contract deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  console.log("🔗 Explorer:", `https://shannon-explorer.somnia.network/address/${contractAddress}`);
  console.log("⛽ Gas used:", (await punctualityCore.deploymentTransaction()).gasLimit.toString());

  // Update the addresses file
  console.log("\n📝 Updating contract addresses...");
  const addressesPath = path.join(__dirname, '../src/contracts/addresses.ts');
  let addressesContent = fs.readFileSync(addressesPath, 'utf8');
  
  // Replace the empty PunctualityCore address
  addressesContent = addressesContent.replace(
    /PunctualityCore: '',/g,
    `PunctualityCore: '${contractAddress}',`
  );
  
  fs.writeFileSync(addressesPath, addressesContent);
  console.log("✅ Contract address updated in addresses.ts");

  // Test basic contract functionality
  console.log("\n🧪 Testing contract functionality...");
  
  try {
    // Test getUserReputation (should return initial reputation)
    const initialReputation = await punctualityCore.getUserReputation(deployer.address);
    console.log("✅ Initial reputation:", initialReputation.toString());
    
    // Test calculateDistance function
    const distance = await punctualityCore.calculateDistance(
      40748817, // NYC lat * 1e6
      -73985428, // NYC lng * 1e6  
      40758896, // Times Square lat * 1e6
      -73985130  // Times Square lng * 1e6
    );
    console.log("✅ Distance calculation test:", distance.toString(), "meters");
    
    console.log("✅ Contract is working correctly!");
    
  } catch (error) {
    console.log("⚠️  Contract deployed but test failed:", error.message);
  }

  console.log("\n📋 Next steps:");
  console.log("1. ✅ Contract deployed and address updated");
  console.log("2. 🔄 Update src/lib/contracts.ts to use real contract calls");
  console.log("3. 🧪 Test with small stake amounts in the app");
  console.log("4. 🔍 Verify contract on explorer if needed");
  
  console.log("\n🎯 Deployment Summary:");
  console.log("- Network: Somnia Shannon Testnet (Chain ID: 5031)");
  console.log("- Contract:", contractAddress);
  console.log("- Explorer:", `https://shannon-explorer.somnia.network/address/${contractAddress}`);
  console.log("- Status: ✅ Ready for use!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });