const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Deploy all IMONMYWAY agent contracts to Somnia
 *
 * Usage:
 *   npx hardhat run scripts/deploy-agents.cjs --network somniaTestnet
 *
 * Prerequisites:
 *   1. PRIVATE_KEY set in .env.local (wallet with STT balance)
 *   2. Agent IDs registered at https://agents.testnet.somnia.network
 *   3. Set LLM_AGENT_ID and JSON_API_AGENT_ID in .env.local
 *
 * Deploy order:
 *   1. PunctualityCore (settlement layer — unchanged)
 *   2. AgentRegistry (discovery layer)
 *   3. PunctualityAgent (orchestration — references 1 and 2)
 */
async function main() {
  console.log("═".repeat(60));
  console.log("  IMONMYWAY Agent Contracts Deployment");
  console.log("═".repeat(60));
  console.log(`Network:  ${network.name}`);
  console.log(`Chain ID: ${network.config.chainId}`);
  console.log(`Time:     ${new Date().toISOString()}`);
  console.log();

  // ── Validate environment ──────────────────────────────────

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance:  ${ethers.formatEther(balance)} STT`);

  if (balance === 0n) {
    console.error("\n❌ Zero balance. Fund your wallet first:");
    console.error("   Faucet: https://faucet.somnia.network/");
    process.exitCode = 1;
    return;
  }

  // Agent IDs (from Somnia portal registration)
  const llmAgentId = process.env.LLM_AGENT_ID;
  const jsonApiAgentId = process.env.JSON_API_AGENT_ID;

  // Somnia platform contract addresses
  const SOMNIA_PLATFORM = {
    5031:   "0x5E5205CF39E766118C01636bED000A54D93163E6",  // mainnet
    50312:  "0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776",  // testnet
  };

  const platformAddress = SOMNIA_PLATFORM[network.config.chainId];
  if (!platformAddress) {
    console.error(`\n❌ Unsupported chain ID: ${network.config.chainId}`);
    console.error("   Supported: 5031 (mainnet), 50312 (testnet)");
    process.exitCode = 1;
    return;
  }

  console.log(`Platform: ${platformAddress}`);
  console.log(`LLM Agent ID:     ${llmAgentId || "(not set — using placeholder 1)"}`);
  console.log(`JSON API Agent ID: ${jsonApiAgentId || "(not set — using placeholder 2)"}`);
  console.log();

  const deployment = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    platformAddress,
  };

  // ── 1. Deploy PunctualityCore ─────────────────────────────

  console.log("── Step 1/3: PunctualityCore ──");
  const PunctualityCore = await ethers.getContractFactory("PunctualityCore", deployer);
  const punctualityCore = await PunctualityCore.deploy();
  await punctualityCore.waitForDeployment();
  const coreAddress = await punctualityCore.getAddress();
  console.log(`✅ PunctualityCore: ${coreAddress}`);
  deployment.PunctualityCore = coreAddress;

  // ── 2. Deploy AgentRegistry ───────────────────────────────

  console.log("\n── Step 2/3: AgentRegistry ──");
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry", deployer);
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  const registryAddress = await agentRegistry.getAddress();
  console.log(`✅ AgentRegistry:   ${registryAddress}`);
  deployment.AgentRegistry = registryAddress;

  // ── 3. Deploy PunctualityAgent ────────────────────────────

  console.log("\n── Step 3/3: PunctualityAgent ──");

  const llmId = llmAgentId ? BigInt(llmAgentId) : 1n;
  const jsonApiId = jsonApiAgentId ? BigInt(jsonApiAgentId) : 2n;

  // Fund agent contract with initial STT for agent call deposits + reactivity subscription
  // Reactivity requires 32 STT minimum balance for subscription owner
  const TARGET_FUNDING = ethers.parseEther("35"); // 32 for reactivity + 3 for agent calls
  const INITIAL_FUNDING = balance >= TARGET_FUNDING + ethers.parseEther("0.5")
    ? TARGET_FUNDING
    : 0n;

  if (INITIAL_FUNDING === 0n) {
    console.warn(`\u26a0\ufe0f  Balance (${ethers.formatEther(balance)} STT) insufficient for initial funding.`);
    console.warn(`   Agent contract needs ~35 STT for reactivity + agent calls. Fund later.`);
  }

  const PunctualityAgent = await ethers.getContractFactory("PunctualityAgent", deployer);
  const punctualityAgent = await PunctualityAgent.deploy(
    platformAddress,   // Somnia agent platform
    coreAddress,       // PunctualityCore
    registryAddress,   // AgentRegistry
    llmId,             // LLM agent ID
    jsonApiId,         // JSON API agent ID
    { value: INITIAL_FUNDING }
  );
  await punctualityAgent.waitForDeployment();
  const agentAddress = await punctualityAgent.getAddress();
  console.log(`✅ PunctualityAgent: ${agentAddress}`);
  deployment.PunctualityAgent = agentAddress;

  // ── Verify deployments ────────────────────────────────────

  console.log("\n── Verification ──");

  const coreOwner = await punctualityCore.owner();
  console.log(`Core owner:       ${coreOwner} ${coreOwner === deployer.address ? "✓" : "✗"}`);

  const agentDeposit = await punctualityAgent.getAgentDeposit();
  console.log(`Agent deposit:    ${ethers.formatEther(agentDeposit)} STT`);

  const agentBalance = await ethers.provider.getBalance(agentAddress);
  console.log(`Agent balance:    ${ethers.formatEther(agentBalance)} STT`);

  const registryHasAgent = await agentRegistry.hasActiveAgent(deployer.address);
  console.log(`Registry ready:   ${!registryHasAgent ? "✓ (empty, ready for listings)" : "✗"}`);

  // ── Save deployment artifacts ─────────────────────────────

  console.log("\n── Artifacts ──");

  // Save deployment JSON
  const deployFileName = `deployment-${network.name}-${Date.now()}.json`;
  fs.writeFileSync(deployFileName, JSON.stringify(deployment, null, 2));
  console.log(`📄 ${deployFileName}`);

  // Generate addresses.ts update snippet
  const addressesSnippet = `
// ═══════════════════════════════════════════════════════════
// Agent Contract Addresses (deployed ${deployment.timestamp})
// ═══════════════════════════════════════════════════════════
AgentRegistry: '${registryAddress}',
PunctualityAgent: '${agentAddress}',
// PunctualityCore (already deployed): '${coreAddress}'
`;

  const addressesFileName = `deployment-addresses-snippet.txt`;
  fs.writeFileSync(addressesFileName, addressesSnippet.trim());
  console.log(`📄 ${addressesFileName} (paste into src/contracts/addresses.ts)`);

  // ── Summary ───────────────────────────────────────────────

  console.log("\n" + "═".repeat(60));
  console.log("  Deployment Summary");
  console.log("═".repeat(60));
  console.log(`PunctualityCore:  ${coreAddress}`);
  console.log(`AgentRegistry:    ${registryAddress}`);
  console.log(`PunctualityAgent: ${agentAddress}`);
  console.log(`Platform:         ${platformAddress}`);
  console.log(`LLM Agent ID:     ${llmId.toString()}`);
  console.log(`JSON API Agent ID:${jsonApiId.toString()}`);
  console.log("═".repeat(60));

  console.log("\n📋 Next steps:");
  console.log("  1. Update src/contracts/addresses.ts with deployed addresses");
  console.log("  2. Register agent IDs at https://agents.testnet.somnia.network");
  console.log("  3. If agent IDs differ from placeholders, redeploy with correct IDs");
  console.log("  4. Fund the agent contract if balance is low");
  console.log("  5. Test: authorize agent → initiate commitment → watch autonomous flow");

  return deployment;
}

main().catch((error) => {
  console.error("\n❌ Deployment failed:", error.message);

  if (error.message.includes("insufficient funds")) {
    console.log("\n💡 Get test tokens:");
    console.log("   Faucet: https://faucet.somnia.network/");
    console.log("   Discord: https://discord.gg/somnia");
  }

  process.exitCode = 1;
});
