const { ethers, network } = require("hardhat");
const fs = require("fs");

const CORE_ADDRESS = "0x6Ba7C599F33fCBe1A9a5848FDE4D4EFA495A25c9";
const REGISTRY_ADDRESS = "0x81F47d5BD7A79d75ee7d20F5a2cfcfDaf9d05775";
const LLM_AGENT_ID = "12847293847561029384";
const JSON_API_AGENT_ID = "13174292974160097713";

const SOMNIA_PLATFORM = {
  50312: "0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776",
};

const EXPLORER_BASE = "https://shannon-explorer.somnia.network/tx";
const ADDR_EXPLORER = "https://shannon-explorer.somnia.network/address";

async function main() {
  console.log("═".repeat(70));
  console.log("  IMONMYWAY — End-to-End Testnet Run v2");
  console.log("  Somnia Agentothon Demo");
  console.log("═".repeat(70));
  console.log(`Network: ${network.name} (${network.config.chainId})`);
  console.log();

  const [deployer] = await ethers.getSigners();
  const startBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance:  ${ethers.formatEther(startBalance)} STT`);
  console.log();

  const platformAddress = SOMNIA_PLATFORM[network.config.chainId];
  if (!platformAddress) throw new Error("Unsupported chain");

  const txLog = [];

  const mark = (label, txOrHash) => {
    const hash = typeof txOrHash === "string" ? txOrHash : txOrHash.hash;
    txLog.push({ label, hash, url: `${EXPLORER_BASE}/${hash}` });
    console.log(`  ✓ ${label}: ${EXPLORER_BASE}/${hash}`);
    return hash;
  };

  // ── Step 1: Deploy fresh PunctualityAgent ───────────
  console.log("── Step 1: Deploy PunctualityAgent (fixed) ──");

  const FUND_AMOUNT = ethers.parseEther("33");
  const GAS_BUFFER = ethers.parseEther("1");

  const PunctualityAgent = await ethers.getContractFactory("PunctualityAgent", deployer);
  const agent = await PunctualityAgent.deploy(
    platformAddress,
    CORE_ADDRESS,
    REGISTRY_ADDRESS,
    BigInt(LLM_AGENT_ID),
    BigInt(JSON_API_AGENT_ID),
    { value: FUND_AMOUNT }
  );
  await agent.waitForDeployment();
  const agentAddr = await agent.getAddress();
  mark("Deploy Agent", agent.deploymentTransaction());

  console.log(`  Address: ${agentAddr}`);
  console.log(`  ${ADDR_EXPLORER}/${agentAddr}`);

  // ── Step 2: Subscribe to AgentRegistry ──────────────
  console.log("\n── Step 2: Subscribe to AgentListed events ──");
  try {
    const subTx = await agent.subscribeToRegistry();
    await subTx.wait();
    mark("Registry Subscription", subTx);
    const subId = await agent.registrySubscriptionId();
    console.log(`  Subscription ID: ${subId}`);
  } catch (err) {
    console.log(`  Subscription failed: ${err.message}`);
  }

  // ── Step 3: Authorize deployer ──────────────────────
  console.log("\n── Step 3: Authorize deployer ──");
  const authTx = await agent.authorizeAgent({
    maxStake: ethers.parseEther("10"),
    minReputation: 0,
    autoAcceptProposals: false,
    autoPostSocial: false,
    personality: "Demo Agent",
  });
  await authTx.wait();
  mark("Authorize Deployer", authTx);

  // ── Step 4: Initiate commitment ─────────────────────
  console.log("\n── Step 4: Initiate commitment (→ LLM agent) ──");

  // Micro-distance so deadline ≈ 5 minutes (urgent buffer)
  const STAKE = ethers.parseEther("0.5");

  const commitTx = await agent.initiateCommitment(
    { latitude: 40712900, longitude: -74006000, accuracy: 10, timestamp: Math.floor(Date.now() / 1000) },
    { latitude: 40713000, longitude: -74005950, accuracy: 10, timestamp: Math.floor(Date.now() / 1000) },
    "urgent",
    { value: STAKE }
  );
  await commitTx.wait();
  mark("initiateCommitment (LLM trigger)", commitTx);

  // ── Step 5: Poll for callback events ────────────────
  console.log("\n── Step 5: Waiting for Somnia LLM callback ──");
  console.log("  (agents platform is async — polling up to 5 min)");

  const seen = new Set();
  let deadlineHit = false;
  let lastPollBlock = await ethers.provider.getBlockNumber();
  let commitmentId = null;

  for (let poll = 0; poll < 60; poll++) {
    if (deadlineHit) break;

    const currentBlock = await ethers.provider.getBlockNumber();

    try {
      const filter = {
        address: agentAddr,
        fromBlock: ethers.toQuantity(lastPollBlock),
        toBlock: ethers.toQuantity(currentBlock),
      };
      const rawLogs = await ethers.provider.send("eth_getLogs", [filter]);

      for (const log of rawLogs) {
        const key = `${log.transactionHash}-${log.logIndex}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const parsed = agent.interface.parseLog({
          topics: log.topics,
          data: log.data,
        });
        if (!parsed) continue;

        const { name, args } = parsed;
        const txUrl = `${EXPLORER_BASE}/${log.transactionHash}`;

        if (name === "AgentRequestSent") {
          console.log(`  📡 RequestSent  requestId=${args[0]} type=${args[1]}  ${txUrl}`);
        } else if (name === "AgentDecisionMade") {
          console.log(`  📡 DecisionMade requestId=${args[0]} type=${args[1]} decision="${args[3]}"  ${txUrl}`);
        } else if (name === "AgentCreatedCommitment") {
          console.log(`  📡 CommitmentCreated id=${args[0]} principal=${args[1]} pace=${args[2]}  ${txUrl}`);
          mark("LLM Callback → Commitment Created", log.transactionHash);
          commitmentId = args[0];
        } else if (name === "AgentSettledCommitment") {
          console.log(`  📡 Settlement id=${args[0]} success=${args[1]}  ${txUrl}`);
          mark("Reactivity → Settlement", log.transactionHash);
          deadlineHit = true;
        }
      }
      lastPollBlock = currentBlock;
    } catch (err) {
      console.log(`  ⚠ Poll error: ${err.message}`);
    }

    if (!deadlineHit) {
      const remaining = Math.round((60 - poll - 1) * 5);
      process.stdout.write(`\r  Poll ${poll + 1}/60 — ~${remaining}s left...`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  process.stdout.write("\n");

  // ── Step 6: Manual settlement fallback ────────────

  if (!deadlineHit && commitmentId) {
    console.log("\n── Step 6: Manual settlement fallback ──");
    console.log(`  Commitment: ${commitmentId}`);

    for (let i = 0; i < 36; i++) {
      try {
        const { settled, deadline } = await agent.commitmentStates(commitmentId);
        if (settled) {
          console.log(`  ✅ Already settled via reactivity.`);
          deadlineHit = true;
          break;
        }
        const now = Math.floor(Date.now() / 1000);
        if (BigInt(deadline) <= BigInt(now)) {
          console.log(`  Deadline passed. Calling settleCommitment...`);
          const tx = await agent.settleCommitment(commitmentId);
          await tx.wait();
          console.log(`  ✅ Manual settlement: ${EXPLORER_BASE}/${tx.hash}`);
          mark("Manual Settlement", tx);
          deadlineHit = true;
          break;
        }
      } catch (err) {
        console.log(`  ⚠ ${err.message}`);
      }
      process.stdout.write(`\r  Waiting for deadline (${i + 1}/36)...`);
      await new Promise((r) => setTimeout(r, 10000));
    }
  }

  // ── Summary ─────────────────────────────────────────
  console.log("\n" + "═".repeat(70));
  console.log("  Summary");
  console.log("═".repeat(70));
  console.log(`Agent: ${ADDR_EXPLORER}/${agentAddr}`);

  for (const { label, url } of txLog) {
    console.log(`  ${label}: ${url}`);
  }

  const endBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`\nDeployer final balance: ${ethers.formatEther(endBalance)} STT`);
  console.log(`Gas spent: ${ethers.formatEther(startBalance - endBalance)} STT`);

  // Save demo video URLs
  const content = [
    "# IMONMYWAY — Demo Video Explorer URLs",
    `# Generated: ${new Date().toISOString()}`,
    "",
    `## Contracts`,
    `PunctualityAgent: ${ADDR_EXPLORER}/${agentAddr}`,
    `PunctualityCore: ${ADDR_EXPLORER}/${CORE_ADDRESS}`,
    `AgentRegistry: ${ADDR_EXPLORER}/${REGISTRY_ADDRESS}`,
    "",
    `## Transaction History`,
    ...txLog.map(({ label, url }) => `${label}: ${url}`),
    "",
    `## Events Captured`,
    ...txLog.map(({ label }) => `- ${label}`),
    "",
    `Commitment settlement: ${deadlineHit ? "YES ✅" : "Manual settlement not attempted ⏳"}`,
  ].join("\n");

  fs.writeFileSync("explorer-urls-demo-video.txt", content);
  console.log("\nSaved urls to explorer-urls-demo-video.txt");

  // Save deployment artifact
  const deployment = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    PunctualityAgent: agentAddr,
    PunctualityCore: CORE_ADDRESS,
    AgentRegistry: REGISTRY_ADDRESS,
    llmAgentId: LLM_AGENT_ID,
    registrySubscriptionId: (await agent.registrySubscriptionId()).toString(),
    txLog,
  };
  const fname = `deployment-${network.name}-${Date.now()}.json`;
  fs.writeFileSync(fname, JSON.stringify(deployment, null, 2));
  console.log(`Saved deployment to ${fname}`);

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exitCode = 1;
});
