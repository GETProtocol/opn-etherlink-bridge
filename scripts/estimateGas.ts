import { ethers } from "hardhat";

import { getLzEndpoint } from "../utils";

async function main() {
  console.log("Estimating gas costs for contract deployments on mainnet fork...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Estimating with account:", deployer.address);

  // Get current mainnet gas price
  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice || 0n;
  console.log(`Current gas price: ${ethers.formatUnits(gasPrice, "gwei")} Gwei\n`);

  // Track total gas used
  let totalGasUsed = 0n;
  let totalCost = 0n;

  // 1. Estimate MyToken deployment
  console.log("1. Estimating MyToken deployment...");
  const MyToken = await ethers.getContractFactory("MyToken");
  const mockToken = await MyToken.deploy("TestOPN", "TSTOPN", ethers.parseEther("2200000"), deployer.address);
  const tokenDeployTx = await mockToken.deploymentTransaction();
  if (!tokenDeployTx) throw new Error("Failed to get token deployment transaction");
  const tokenDeployReceipt = await tokenDeployTx.wait();
  if (!tokenDeployReceipt) throw new Error("Failed to get token deployment receipt");

  const tokenGasUsed = tokenDeployReceipt.gasUsed;
  const tokenCost = tokenGasUsed * gasPrice;
  totalGasUsed += tokenGasUsed;
  totalCost += tokenCost;

  console.log(`Gas used: ${tokenGasUsed.toString()}`);
  console.log(`Cost: ${ethers.formatEther(tokenCost)} ETH`);
  console.log(`Cost in USD: $${(Number(ethers.formatEther(tokenCost)) * 3500).toFixed(2)}\n`);

  // 2. Estimate OFTAdapter deployment
  console.log("2. Estimating OFTAdapter deployment...");
  const OFTAdapter = await ethers.getContractFactory("MyOFTAdapter");
  const mockAdapter = await OFTAdapter.deploy(
    await mockToken.getAddress(),
    getLzEndpoint("ethereum"),
    deployer.address,
  );
  const adapterDeployTx = await mockAdapter.deploymentTransaction();
  if (!adapterDeployTx) throw new Error("Failed to get adapter deployment transaction");
  const adapterDeployReceipt = await adapterDeployTx.wait();
  if (!adapterDeployReceipt) throw new Error("Failed to get adapter deployment receipt");

  const adapterGasUsed = adapterDeployReceipt.gasUsed;
  const adapterCost = adapterGasUsed * gasPrice;
  totalGasUsed += adapterGasUsed;
  totalCost += adapterCost;

  console.log(`Gas used: ${adapterGasUsed.toString()}`);
  console.log(`Cost: ${ethers.formatEther(adapterCost)} ETH`);
  console.log(`Cost in USD: $${(Number(ethers.formatEther(adapterCost)) * 3500).toFixed(2)}\n`);

  // 3. Estimate OFT deployment (for Etherlink)
  console.log("3. Estimating OFT deployment (for Etherlink)...");
  const OFT = await ethers.getContractFactory("MyOFT");
  const mockOft = await OFT.deploy("TestOFT", "TOFT", getLzEndpoint("etherlink-testnet"), deployer.address);
  const oftDeployTx = await mockOft.deploymentTransaction();
  if (!oftDeployTx) throw new Error("Failed to get OFT deployment transaction");
  const oftDeployReceipt = await oftDeployTx.wait();
  if (!oftDeployReceipt) throw new Error("Failed to get OFT deployment receipt");

  const oftGasUsed = oftDeployReceipt.gasUsed;
  const oftCost = oftGasUsed * gasPrice;

  console.log(`Gas used: ${oftGasUsed.toString()}`);
  console.log(`Cost: ${ethers.formatEther(oftCost)} ETH`);
  console.log(`Cost in USD: $${(Number(ethers.formatEther(oftCost)) * 3500).toFixed(2)}\n`);

  // Summary
  console.log("=== Deployment Cost Summary ===");
  console.log("\nOn Ethereum:");
  console.log(`Total gas units: ${totalGasUsed.toString()}`);
  console.log(`Total cost: ${ethers.formatEther(totalCost)} ETH`);
  console.log(`Total cost in USD: $${(Number(ethers.formatEther(totalCost)) * 3500).toFixed(2)}`);

  console.log("\nOn Etherlink:");
  console.log(`Total gas units: ${oftGasUsed.toString()}`);
  console.log(`Total cost: ${ethers.formatEther(oftCost)} ETH`);
  console.log(`Total cost in USD: $${(Number(ethers.formatEther(oftCost)) * 3500).toFixed(2)}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
