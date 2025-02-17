import { zeroPad } from "@ethersproject/bytes";
import * as fs from "fs";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { NETWORK_NAMES, getLzEId, getNetworkPair, isMainnet } from "../constants";
import { MyOFTAdapter } from "../types";

interface ContractsJson {
  oft?: string;
  oftAdapter?: string;
  token?: string;
  endpoint?: string;
  [key: string]: string | undefined;
}

task("set-oftadapter-peer", "Sets peer for OFTAdapter contract").setAction(
  async (_, hre: HardhatRuntimeEnvironment) => {
    try {
      const network = hre.network.name;

      // Get network configuration
      const mainnet = isMainnet(network);
      const { sourceNetwork, targetNetwork } = getNetworkPair(network);

      if (network !== sourceNetwork) {
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

      // Get target chain's EID
      const targetEid = getLzEId(targetNetwork);

      console.log("\nSetting peer for OFTAdapter contract:");
      console.log("OFTAdapter address:", sourceContracts.oftAdapter);
      console.log(`${targetNetwork} EID:`, targetEid);
      console.log("OFT address:", targetContracts.oft);

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
