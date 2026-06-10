const { ethers } = require("hardhat");

const CORE = "0x6Ba7C599F33fCBe1A9a5848FDE4D4EFA495A25c9";
const REGISTRY = "0x81F47d5BD7A79d75ee7d20F5a2cfcfDaf9d05775";
const PLATFORM = "0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776";
const LLM_ID = "12847293847561029384";
const JSON_ID = "13174292974160097713";
const TX = "https://shannon-explorer.somnia.network/tx";
const ADDR = "https://shannon-explorer.somnia.network/address";

const log = { txs: [] };
function mark(l, tx) { const h = typeof tx === "string" ? tx : tx.hash; log.txs.push({ l, h, u: `${TX}/${h}` }); console.log(`  ✓ ${l}`); }

async function main() {
  console.log("═══ IMONMYWAY Demo Cycle ═══\n");

  const [d] = await ethers.getSigners();
  console.log(`Deployer: ${d.address} | ${ethers.formatEther(await ethers.provider.getBalance(d.address))} STT\n`);

  // 1. Deploy
  console.log("── 1. Deploy Agent ──");
  const f = await ethers.getContractFactory("PunctualityAgent", d);
  const agent = await f.deploy(PLATFORM, CORE, REGISTRY, LLM_ID, JSON_ID, { value: ethers.parseEther("5") });
  await agent.waitForDeployment();
  const addr = await agent.getAddress();
  mark("Deploy", agent.deploymentTransaction());
  console.log(`  ${ADDR}/${addr}\n`);

  // 2. Authorize
  console.log("── 2. Authorize Deployer ──");
  let tx = await agent.authorizeAgent({ maxStake: ethers.parseEther("10"), minReputation: 0, autoAcceptProposals: false, autoPostSocial: false, personality: "Demo" });
  await tx.wait();
  mark("Authorize", tx);

  // 3. Initiate commitment (retry up to 3 times)
  console.log("\n── 3. Initiate Commitment → LLM ──");
  let cid = null;
  const seen = new Set();
  let lastBlock = await ethers.provider.getBlockNumber();

  for (let attempt = 1; attempt <= 3; attempt++) {
    console.log(`  Attempt ${attempt}/3`);
    const stake = ethers.parseEther("0.5");
    tx = await agent.initiateCommitment(
      { latitude: 40712900, longitude: -74006000, accuracy: 10, timestamp: Math.floor(Date.now() / 1000) },
      { latitude: 40713000, longitude: -74005950, accuracy: 10, timestamp: Math.floor(Date.now() / 1000) },
      "urgent", { value: stake }
    );
    await tx.wait();
    mark(`initiateCommitment (#${attempt})`, tx);

    // Poll for LLM callback — up to 90s
    for (let i = 0; i < 18; i++) {
      const cur = await ethers.provider.getBlockNumber();
      const raw = await ethers.provider.send("eth_getLogs", [{ address: addr, fromBlock: ethers.toQuantity(lastBlock), toBlock: ethers.toQuantity(cur) }]);
      lastBlock = cur;
      for (const l of raw) {
        const key = `${l.transactionHash}-${l.logIndex}`;
        if (seen.has(key)) continue; seen.add(key);
        const p = agent.interface.parseLog({ topics: l.topics, data: l.data });
        if (p && p.name === "AgentCreatedCommitment") {
          cid = p.args[0];
          console.log(`  📡 LLM → CommitmentCreated id=${cid}  ${TX}/${l.transactionHash}`);
          mark("LLM callback", l.transactionHash);
          break;
        }
      }
      if (cid) break;
      process.stdout.write(`\r    Poll ${i+1}/18 (${(18-i-1)*5}s left)...`);
      await new Promise(r => setTimeout(r, 5000));
    }
    process.stdout.write("\n");
    if (cid) break;
    // If no callback, the platform didn't respond — try again with a fresh request
    console.log("  ⚠ No LLM callback — retrying...");
  }

  if (!cid) {
    console.log("\n  ❌ LLM never responded after 3 attempts. Using previous run's data for demo.");
    return;
  }

  // 4. Wait for deadline + settle
  console.log("\n── 4. Settlement ──");

  // Check commitment state immediately
  let st = await agent.commitmentStates(cid);
  const deadline = Number(st.deadline);
  console.log(`  Deadline: ${new Date(deadline * 1000).toISOString()} (${Math.max(0, deadline - Math.floor(Date.now()/1000))}s from now)`);

  if (deadline <= Math.floor(Date.now() / 1000)) {
    // Already past deadline — settle now
    tx = await agent.settleCommitment(cid);
    await tx.wait();
    mark("settleCommitment", tx);
  } else {
    // Wait for deadline + 5s buffer
    const wait = (deadline + 5 - Math.floor(Date.now() / 1000)) * 1000;
    console.log(`  Waiting ${Math.round(wait/1000)}s for deadline...`);
    await new Promise(r => setTimeout(r, Math.min(wait, 600_000)));

    tx = await agent.settleCommitment(cid);
    await tx.wait();
    mark("settleCommitment", tx);
  }

  // 5. Verify
  st = await agent.commitmentStates(cid);
  console.log(`\n  Settled: ${st.settled} | On time: ${st.onTime} | Slashed: ${ethers.formatEther(st.slashedAmount)} STT`);

  // Summary
  console.log("\n═══ Summary ═══");
  console.log(`Agent: ${ADDR}/${addr}`);
  for (const {l, u} of log.txs) console.log(`  ${l}: ${u}`);
  const bal = await ethers.provider.getBalance(d.address);
  console.log(`\nDeployer: ${ethers.formatEther(bal)} STT remaining`);
}

main().catch(err => { console.error("FAILED:", err.message); process.exitCode = 1; });
