const { ethers, network } = require("hardhat");
const fs = require("fs");

/**
 * Redeploy only PunctualityAgent with correct agent IDs from Somnia portal.
 *
 * Usage:
 *   npx hardhat run scripts/redeploy-agent.cjs --network somniaTestnet
 *
 * Uses:
 *   - Somnia's canonical AgentRegistry (from portal)
 *   - Already-deployed PunctualityCore
 *   - Real agent IDs registered at agents.somnia.network
 */
async function main() {
  console.log("Redeploying PunctualityAgent with real agent IDs...\n");

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance:  ${ethers.formatEther(balance)} STT\n`);

  // Real agent IDs from Somnia portal
  const LLM_AGENT_ID = 12847293847561029384n;
  const JSON_API_AGENT_ID = 13174292974160097713n;

  // Somnia platform + canonical registry
  const PLATFORM_ADDRESS = "0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776";
  const REGISTRY_ADDRESS = "0x08D1Fc808f1983d2Ea7B63a28ECD4d8C885Cd02A";

  // Already-deployed PunctualityCore
  const CORE_ADDRESS = "0x81531CCdA5Ed9C22a5d57F4AF5A6B9612A81Cc5A";

  console.log(`Platform:         ${PLATFORM_ADDRESS}`);
  console.log(`Registry (Somnia): ${REGISTRY_ADDRESS}`);
  console.log(`PunctualityCore:  ${CORE_ADDRESS}`);
  console.log(`LLM Agent ID:     ${LLM_AGENT_ID}`);
  console.log(`JSON API Agent ID: ${JSON_API_AGENT_ID}\n`);

  const PunctualityAgent = await ethers.getContractFactory("PunctualityAgent", deployer);
  const punctualityAgent = await PunctualityAgent.deploy(
    PLATFORM_ADDRESS,
    CORE_ADDRESS,
    REGISTRY_ADDRESS,
    LLM_AGENT_ID,
    JSON_API_AGENT_ID,
    { value: 0n }
  );
  await punctualityAgent.waitForDeployment();
  const agentAddress = await punctualityAgent.getAddress();
  console.log(`PunctualityAgent: ${agentAddress}`);

  // Verify
  const storedPlatform = await punctualityAgent.platform();
  const storedCore = await punctualityAgent.punctualityCore();
  const storedRegistry = await punctualityAgent.registry();
  const storedLlmId = await punctualityAgent.llmAgentId();
  const storedJsonId = await punctualityAgent.jsonApiAgentId();

  console.log("\n-- Verification --");
  console.log(`Platform:   ${storedPlatform} ${storedPlatform === PLATFORM_ADDRESS ? "OK" : "MISMATCH"}`);
  console.log(`Core:       ${storedCore} ${storedCore.toLowerCase() === CORE_ADDRESS.toLowerCase() ? "OK" : "MISMATCH"}`);
  console.log(`Registry:   ${storedRegistry} ${storedRegistry === REGISTRY_ADDRESS ? "OK" : "MISMATCH"}`);
  console.log(`LLM ID:     ${storedLlmId} ${storedLlmId === LLM_AGENT_ID ? "OK" : "MISMATCH"}`);
  console.log(`JSON ID:    ${storedJsonId} ${storedJsonId === JSON_API_AGENT_ID ? "OK" : "MISMATCH"}`);

  const snippet = `
// Update in src/contracts/addresses.ts:
AgentRegistry: '${REGISTRY_ADDRESS}',  // Somnia canonical
PunctualityAgent: '${agentAddress}',
// PunctualityCore (unchanged): '${CORE_ADDRESS}'
`;
  fs.writeFileSync("redeploy-snippet.txt", snippet.trim());
  console.log(`\nAddress snippet saved to redeploy-snippet.txt`);
}

main().catch((error) => {
  console.error("Redeployment failed:", error.message);
  process.exitCode = 1;
});
