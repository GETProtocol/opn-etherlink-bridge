import { zeroPad } from "@ethersproject/bytes";
import * as fs from "fs";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { MyOFT } from "../types/contracts/MyOFT";
import { getLzEId, getLzEndpoint, getNetworkPair, isMainnet } from "../utils";

interface ContractsJson {
  oft?: string;
  oftAdapter?: string;
  token?: string;
  [key: string]: string | undefined;
}

task("set-oft-peer", "Sets peer for OFT contract").setAction(async (_, hre: HardhatRuntimeEnvironment) => {
  try {
    const network = hre.network.name;

    // Get network configuration
    const mainnet = isMainnet(network);
    const { sourceNetwork, targetNetwork } = getNetworkPair(network);

    if (network !== targetNetwork) {
      throw new Error(`This task must be run on ${targetNetwork} network`);
    }

    // Read contract addresses from both networks
    const targetContracts = JSON.parse(fs.readFileSync(`contracts.${targetNetwork}.json`, "utf8")) as ContractsJson;
    const sourceContracts = JSON.parse(fs.readFileSync(`contracts.${sourceNetwork}.json`, "utf8")) as ContractsJson;

    if (!targetContracts.oft) {
      throw new Error(`OFT contract not found on ${targetNetwork}`);
    }
    if (!sourceContracts.oftAdapter) {
      throw new Error(`OFTAdapter contract not found on ${sourceNetwork}`);
    }

    // Get the deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("Setting OFT peer with account:", deployer.address);
    console.log("Environment:", mainnet ? "Mainnet" : "Testnet");

    // Get contract instance
    const oft = (await hre.ethers.getContractAt("MyOFT", targetContracts.oft)) as MyOFT;

    // Get source chain's EID and endpoint
    const sourceEid = getLzEId(sourceNetwork);
    const endpoint = getLzEndpoint(network);

    console.log("\nSetting peer for OFT contract:");
    console.log("OFT address:", targetContracts.oft);
    console.log(`${sourceNetwork} EID:`, sourceEid);
    console.log("OFTAdapter address:", sourceContracts.oftAdapter);
    console.log("LayerZero Endpoint:", endpoint);

    // Set the peer
    const tx = await oft.setPeer(sourceEid, zeroPad(sourceContracts.oftAdapter, 32));
    const receipt = await tx.wait();

    console.log("\nPeer setup completed successfully");
    console.log("Transaction hash:", receipt?.hash);

    console.log(`\nIMPORTANT: Make sure to also run set-oftadapter-peer on ${sourceNetwork} network`);
    console.log(`npx hardhat set-oftadapter-peer --network ${sourceNetwork}`);
  } catch (error) {
    console.error("Error setting OFT peer:", error);
    throw error;
  }
});
