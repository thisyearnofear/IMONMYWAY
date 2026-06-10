const { ethers, network } = require("hardhat");
const fs = require("fs");

const OLD_AGENT_ADDRESS = "0xFe1b279C5C4A867c849726E4735729D2a6A79726";
const OLD_CORE_ADDRESS = "0x6Ba7C599F33fCBe1A9a5848FDE4D4EFA495A25c9";
const REGISTRY_ADDRESS = "0x81F47d5BD7A79d75ee7d20F5a2cfcfDaf9d05775";

const LLM_AGENT_ID = "12847293847561029384";
const JSON_API_AGENT_ID = "13174292974160097713";

const SOMNIA_PLATFORM = {
  5031: "0x5E5205CF39E766118C01636bED000A54D93163E6",
  50312: "0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776",
};

const OLD_AGENT_ABI = [
  "function authorizeAgent(tuple(uint256 maxStake, uint256 minReputation, bool autoAcceptProposals, bool autoPostSocial, string personality) config) external payable",
  "function withdrawStuckFunds() external",
  "function authorizedPrincipals(address) external view returns (bool)",
];

async function main() {
  console.log("═".repeat(60));
  console.log("  STT Recovery + PunctualityAgent Redeploy");
  console.log("═".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`Chain:   ${network.config.chainId}`);
  console.log();

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance:  ${ethers.formatEther(balance)} STT`);

  const platformAddress = SOMNIA_PLATFORM[network.config.chainId];
  if (!platformAddress) {
    console.error("Unsupported chain");
    process.exitCode = 1;
    return;
  }

  // ── Step 1: Recover 35 STT from old contract ───────────

  console.log("\n── Step 1: Recover STT from old PunctualityAgent ──");

  const oldAgent = new ethers.Contract(OLD_AGENT_ADDRESS, OLD_AGENT_ABI, deployer);

  const isAuthorized = await oldAgent.authorizedPrincipals(deployer.address);
  if (!isAuthorized) {
    console.log("Authorizing deployer on old contract...");
    const authTx = await oldAgent.authorizeAgent({
      maxStake: 1,
      minReputation: 0,
      autoAcceptProposals: false,
      autoPostSocial: false,
      personality: "recovery",
    });
    await authTx.wait();
    console.log("Authorized.");
  } else {
    console.log("Already authorized.");
  }

  const oldBalance = await ethers.provider.getBalance(OLD_AGENT_ADDRESS);
  console.log(`Old contract balance: ${ethers.formatEther(oldBalance)} STT`);

  if (oldBalance > 0n) {
    console.log("Withdrawing funds...");
    const withdrawTx = await oldAgent.withdrawStuckFunds();
    await withdrawTx.wait();
    console.log("Withdrawn.");
  }

  const balanceAfter = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance now: ${ethers.formatEther(balanceAfter)} STT`);

  // ── Step 2: Deploy new PunctualityAgent ────────────────

  console.log("\n── Step 2: Deploy new PunctualityAgent with correct IDs ──");

  console.log(`LLM Agent ID:      ${LLM_AGENT_ID}`);
  console.log(`JSON API Agent ID: ${JSON_API_AGENT_ID}`);
  console.log(`Platform:          ${platformAddress}`);
  console.log(`Core:              ${OLD_CORE_ADDRESS}`);
  console.log(`Registry:          ${REGISTRY_ADDRESS}`);

  const TARGET_FUNDING = ethers.parseEther("35");
  const GAS_RESERVE = ethers.parseEther("1");
  const availableForFunding = balanceAfter - GAS_RESERVE;
  const initialFunding = availableForFunding >= TARGET_FUNDING
    ? TARGET_FUNDING
    : availableForFunding > 0n ? availableForFunding : 0n;

  console.log(`Funding new contract with: ${ethers.formatEther(initialFunding)} STT`);

  const PunctualityAgent = await ethers.getContractFactory("PunctualityAgent", deployer);
  const newAgent = await PunctualityAgent.deploy(
    platformAddress,
    OLD_CORE_ADDRESS,
    REGISTRY_ADDRESS,
    BigInt(LLM_AGENT_ID),
    BigInt(JSON_API_AGENT_ID),
    { value: initialFunding }
  );
  await newAgent.waitForDeployment();
  const newAddress = await newAgent.getAddress();

  console.log(`\nNew PunctualityAgent: ${newAddress}`);

  // ── Step 3: Verify ─────────────────────────────────────

  console.log("\n── Verification ──");

  const llmId = await newAgent.llmAgentId();
  const jsonId = await newAgent.jsonApiAgentId();
  const agentDeposit = await newAgent.getAgentDeposit();
  const newBalance = await ethers.provider.getBalance(newAddress);

  console.log(`LLM Agent ID:      ${llmId.toString()} ${llmId.toString() === LLM_AGENT_ID ? "✓" : "✗"}`);
  console.log(`JSON API Agent ID: ${jsonId.toString()} ${jsonId.toString() === JSON_API_AGENT_ID ? "✓" : "✗"}`);
  console.log(`Agent deposit:     ${ethers.formatEther(agentDeposit)} STT`);
  console.log(`Contract balance:  ${ethers.formatEther(newBalance)} STT`);

  // ── Step 4: Save artifacts ─────────────────────────────

  const deployment = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    PunctualityCore: OLD_CORE_ADDRESS,
    AgentRegistry: REGISTRY_ADDRESS,
    PunctualityAgent: newAddress,
    oldPunctualityAgent: OLD_AGENT_ADDRESS,
    recoveredSTT: ethers.formatEther(oldBalance),
    llmAgentId: LLM_AGENT_ID,
    jsonApiAgentId: JSON_API_AGENT_ID,
    platformAddress,
  };

  // Subscribe to AgentListed events for autonomous discovery (needs >= 32 STT balance)
  if (initialFunding >= ethers.parseEther("32")) {
    console.log("\n── Subscribing to AgentRegistry events ──");
    try {
      const subTx = await newAgent.subscribeToRegistry();
      await subTx.wait();
      const subId = await newAgent.registrySubscriptionId();
      console.log(`Registry subscription ID: ${subId}`);
      deployment.registrySubscriptionId = subId.toString();
    } catch (err) {
      console.warn(`Registry subscription failed: ${err.message}`);
    }
  }

  const fileName = `deployment-${network.name}-${Date.now()}.json`;
  fs.writeFileSync(fileName, JSON.stringify(deployment, null, 2));
  console.log(`\n${fileName}`);

  console.log("\n" + "═".repeat(60));
  console.log("  Summary");
  console.log("═".repeat(60));
  console.log(`PunctualityCore:   ${OLD_CORE_ADDRESS} (unchanged)`);
  console.log(`AgentRegistry:     ${REGISTRY_ADDRESS} (unchanged)`);
  console.log(`PunctualityAgent:  ${newAddress} (NEW — correct IDs)`);
  console.log(`Old Agent:         ${OLD_AGENT_ADDRESS} (drained)`);
  console.log(`Recovered:         ${ethers.formatEther(oldBalance)} STT`);
  console.log("═".repeat(60));
}

main().catch((error) => {
  console.error("Failed:", error.message);
  process.exitCode = 1;
});
