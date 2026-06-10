const { ethers, network } = require("hardhat");
async function main() {
  const b = await ethers.provider.getBalance("0x24D16d61De02c29706c51C7a473410a88BF44663");
  console.log("Agent:", ethers.formatEther(b), "STT");
  const d = await ethers.provider.getBalance("0x437D081d1Cfa5e5E30FE8E364f84b25904c8ebAc");
  console.log("Deployer:", ethers.formatEther(d), "STT");
}
main().catch(console.error);
