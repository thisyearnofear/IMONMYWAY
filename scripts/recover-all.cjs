const { ethers, network } = require("hardhat");

const AGENTS_TO_DRAIN = [
  "0x880b5e8A7FD4E0b444b42B6cb7929c9c2CD8EFAf",
  "0x24D16d61De02c29706c51C7a473410a88BF44663",
  "0x9b7B2dEc89F4cE8Ad8494Fe1758BDF14F6d30665",
  "0xE4f8c3Fea3874b7cC79a3Ff7eC0629601a15A509",
  "0x807C115978736D4cFC3b006A2c743374fED4BA4a",
];

const ABI = [
  "function owner() external view returns (address)",
  "function ownerWithdraw() external",
];

async function main() {
  console.log("═".repeat(60));
  console.log("  Drain remaining STT from orphaned agents");
  console.log("═".repeat(60));

  const [deployer] = await ethers.getSigners();
  const startBalance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Start balance: ${ethers.formatEther(startBalance)} STT`);

  for (const addr of AGENTS_TO_DRAIN) {
    const balance = await ethers.provider.getBalance(addr);
    console.log(`\nAgent ${addr}: ${ethers.formatEther(balance)} STT`);

    if (balance == 0n) {
      console.log("  Already empty, skipping.");
      continue;
    }

    const agent = new ethers.Contract(addr, ABI, deployer);
    try {
      const owner = await agent.owner();
      if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.log(`  Owner is ${owner}, not deployer. Skipping.`);
        continue;
      }
    } catch {
      console.log("  Cannot read owner. Skipping.");
      continue;
    }

    try {
      const tx = await agent.ownerWithdraw();
      await tx.wait();
      console.log(`  Drained! Tx: https://shannon-explorer.somnia.network/tx/${tx.hash}`);
    } catch (err) {
      console.log(`  ownerWithdraw failed: ${err.message}`);
    }
  }

  const endBalance = await ethers.provider.getBalance(deployer.address);
  const recovered = endBalance - startBalance;
  console.log(`\nRecovered: ${ethers.formatEther(recovered)} STT`);
  console.log(`Final balance: ${ethers.formatEther(endBalance)} STT`);
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exitCode = 1;
});
