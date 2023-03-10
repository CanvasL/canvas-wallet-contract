import { ethers } from "hardhat";

const main = async () => {
  const CanvasWallet = await ethers.getContractFactory("CanvasWallet");
  const canvasWallet = await CanvasWallet.deploy();

  await canvasWallet.deployed();

  console.log(`CanvasWallet deployed to ${canvasWallet.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
