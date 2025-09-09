const { ethers, network } = require("hardhat");

async function main() {
  console.log("Deploying PunctualityCore contract...");
  console.log("Network:", network.name);
  console.log("Chain ID:", network.config.chainId);

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get the contract factory with the deployer signer
  const PunctualityCore = await ethers.getContractFactory("PunctualityCore", deployer);
  
  console.log("Contract factory created successfully");
  
  // Deploy the contract
  console.log("Deploying contract...");
  const punctualityCore = await PunctualityCore.deploy();
  
  console.log("Contract deployment transaction sent");
  
  await punctualityCore.waitForDeployment();
  
  const contractAddress = await punctualityCore.getAddress();
  
  console.log("PunctualityCore deployed to:", contractAddress);
  
  // Verify the deployment by calling a function
  const owner = await punctualityCore.owner();
  console.log("Contract owner:", owner);
  
  console.log("Deployment completed successfully!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});