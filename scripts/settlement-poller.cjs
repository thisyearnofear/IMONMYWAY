/**
 * Off-chain settlement poller.
 * Runs on a free server (Render / Railway / fly.io).
 * Polls agent contract for unsettled commitments past deadline.
 * Calls settleCommitment — no on-chain reactivity needed.
 *
 * Usage:
 *   PRIVATE_KEY=0x... AGENT=0x... node scripts/settlement-poller.cjs
 */
require("dotenv").config({ path: ".env.local" });
const { ethers } = require("ethers");

const RPC = "https://api.infra.testnet.somnia.network";
const AGENT_ABI = [
  "function commitmentStates(bytes32) view returns (tuple(address principal, address socialFeed, uint256 commitmentIndex, uint256 deadline, uint256 createdAt, uint256 pace, uint256 slashedAmount, bool settled, bool onTime))",
  "function settleCommitment(bytes32)",
];

async function main() {
  const pk = process.env.PRIVATE_KEY;
  const agentAddr = process.env.AGENT;
  if (!pk || !agentAddr) throw new Error("Set PRIVATE_KEY and AGENT");

  const provider = new ethers.JsonRpcProvider(RPC);
  const signer = new ethers.Wallet(pk, provider);
  const agent = new ethers.Contract(agentAddr, AGENT_ABI, signer);

  console.log(`[${new Date().toISOString()}] Poller started — agent: ${agentAddr}`);

  // Poll every 30s
  setInterval(async () => {
    try {
      // Get all commitments from AgentCreatedCommitment events (last 200 blocks)
      const latest = await provider.getBlockNumber();
      const logs = await provider.getLogs({
        address: agentAddr,
        topics: [ethers.id("AgentCreatedCommitment(bytes32,address,uint256,string)")],
        fromBlock: latest - 200,
        toBlock: "latest",
      });

      for (const log of logs) {
        const cid = ethers.AbiCoder.defaultAbiCoder().decode(["bytes32"], log.topics[1])[0];
        const st = await agent.commitmentStates(cid);

        if (st.settled) continue;

        const deadline = Number(st.deadline);
        if (deadline > 0 && deadline <= Math.floor(Date.now() / 1000)) {
          console.log(`  Settling ${cid.slice(0, 10)}... (deadline ${new Date(deadline * 1000).toISOString()})`);
          const tx = await agent.settleCommitment(cid, { gasLimit: 200_000 });
          await tx.wait();
          console.log(`  ✅ Settled: ${tx.hash}`);
        }
      }
    } catch (err) {
      console.warn(`  ⚠ ${err.message}`);
    }
  }, 30_000);
}

main().catch(console.error);
