import { zeroPad } from "@ethersproject/bytes";
import * as fs from "fs";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { MyOFTAdapter } from "../types";
import { getLzEId, getLzEndpoint, getNetworkPair, isMainnet } from "../utils";

interface ContractsJson {
  oft?: string;
  oftAdapter?: string;
  token?: string;
  [key: string]: string | undefined;
}

task("set-oftadapter-peer", "Sets peer for OFTAdapter contract").setAction(
  async (_, hre: HardhatRuntimeEnvironment) => {
    try {
      const network = hre.network.name;

      // Get network configuration
      const mainnet = isMainnet(network);
      const { sourceNetwork, targetNetwork } = getNetworkPair(network);

      if (network !== sourceNetwork && network != "ganache") {
        throw new Error(`This task must be run on ${sourceNetwork} network`);
      }

      // Read contract addresses from both networks
      const sourceContracts = JSON.parse(fs.readFileSync(`contracts.${sourceNetwork}.json`, "utf8")) as ContractsJson;
      const targetContracts = JSON.parse(fs.readFileSync(`contracts.${targetNetwork}.json`, "utf8")) as ContractsJson;

      if (!sourceContracts.oftAdapter) {
        throw new Error(`OFTAdapter contract not found on ${sourceNetwork}`);
      }
      if (!targetContracts.oft) {
        throw new Error(`OFT contract not found on ${targetNetwork}`);
      }

      // Get the deployer account
      const [deployer] = await hre.ethers.getSigners();
      console.log("Setting OFTAdapter peer with account:", deployer.address);
      console.log("Environment:", mainnet ? "Mainnet" : "Testnet");

      // Get contract instance
      const oftAdapter = (await hre.ethers.getContractAt("MyOFTAdapter", sourceContracts.oftAdapter)) as MyOFTAdapter;

      // Get target chain's EID and endpoint
      const targetEid = getLzEId(targetNetwork);
      const endpoint = getLzEndpoint(network);

      console.log("\nSetting peer for OFTAdapter contract:");
      console.log("OFTAdapter address:", sourceContracts.oftAdapter);
      console.log(`${targetNetwork} EID:`, targetEid);
      console.log("OFT address:", targetContracts.oft);
      console.log("LayerZero Endpoint:", endpoint);

      // Set the peer
      const tx = await oftAdapter.setPeer(targetEid, zeroPad(targetContracts.oft, 32));
      const receipt = await tx.wait();

      console.log("\nPeer setup completed successfully");
      console.log("Transaction hash:", receipt?.hash);

      console.log(`\nIMPORTANT: Make sure to also run set-oft-peer on ${targetNetwork} network`);
      console.log(`npx hardhat set-oft-peer --network ${targetNetwork}`);
    } catch (error) {
      console.error("Error setting OFTAdapter peer:", error);
      throw error;
    }
  },
);
