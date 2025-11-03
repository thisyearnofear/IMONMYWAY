const { ethers, network } = require("hardhat");

async function main() {
  console.log("Deploying PunctualityCore contract...");
  console.log("Network:", network.name);
  console.log("Chain ID:", network.config.chainId);

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Check account balance
  try {
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "STT");
    
    if (balance == 0n) {
      console.warn("⚠️  Account has zero balance. You may need to get test tokens from a faucet.");
      console.log("Faucet options:");
      console.log("- https://faucet.somnia.network/");
      console.log("- Discord: https://discord.gg/somnia");
    }
  } catch (error) {
    console.warn("⚠️  Could not check account balance:", error.message);
  }

  try {
    // Get the contract factory with the deployer signer
    const PunctualityCore = await ethers.getContractFactory("PunctualityCore", deployer);
    
    console.log("Contract factory created successfully");
    
    // Deploy the contract
    console.log("Deploying contract...");
    const punctualityCore = await PunctualityCore.deploy();
    
    console.log("Contract deployment transaction sent");
    
    await punctualityCore.waitForDeployment();
    
    const contractAddress = await punctualityCore.getAddress();
    
    console.log("✅ PunctualityCore deployed to:", contractAddress);
    
    // Verify the deployment by calling a function
    const owner = await punctualityCore.owner();
    console.log("Contract owner:", owner);
    
    // Get contract balance (should be 0 initially)
    const contractBalance = await ethers.provider.getBalance(contractAddress);
    console.log("Contract balance:", ethers.formatEther(contractBalance), "STT");
    
    // Save deployment info to a file for later use
    const fs = require('fs');
    const deploymentInfo = {
      network: network.name,
      chainId: network.config.chainId,
      contractAddress: contractAddress,
      deployer: deployer.address,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      `deployment-${network.name}-${Date.now()}.json`, 
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("Deployment info saved to file");
    
    console.log("🎉 Deployment completed successfully!");
    
    return contractAddress;
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Tips to resolve:");
      console.log("1. Get test tokens from the Somnia faucet:");
      console.log("   - https://faucet.somnia.network/");
      console.log("2. Join the Somnia Discord for additional support:");
      console.log("   - https://discord.gg/somnia");
      console.log("3. Check your private key in .env.local is correct");
    }
    
    process.exitCode = 1;
    throw error;
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error("Deployment script failed:", error);
  process.exitCode = 1;
});