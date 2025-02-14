import { zeroPad } from "@ethersproject/bytes";
import * as fs from "fs";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { NETWORK_NAMES, getLzChainId } from "../constants";

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

      if (network !== NETWORK_NAMES.SEPOLIA) {
        throw new Error("This task must be run on Sepolia network");
      }

      // Read contract addresses from both networks
      const sepoliaContracts = JSON.parse(
        fs.readFileSync(`contracts.${NETWORK_NAMES.SEPOLIA}.json`, "utf8"),
      ) as ContractsJson;

      const etherlinkContracts = JSON.parse(
        fs.readFileSync(`contracts.${NETWORK_NAMES.ETHERLINK}.json`, "utf8"),
      ) as ContractsJson;

      if (!sepoliaContracts.oftAdapter) {
        throw new Error("OFTAdapter contract not found on Sepolia");
      }
      if (!etherlinkContracts.oft) {
        throw new Error("OFT contract not found on Etherlink");
      }

      // Get the deployer account
      const [deployer] = await hre.ethers.getSigners();
      console.log("Setting OFTAdapter peer with account:", deployer.address);

      // Get contract instance
      const MyOFTAdapter = await hre.ethers.getContractFactory("MyOFTAdapter");
      const oftAdapter = MyOFTAdapter.attach(sepoliaContracts.oftAdapter);

      // Get Etherlink's EID
      const etherlinkEid = getLzChainId(NETWORK_NAMES.ETHERLINK);

      console.log("\nSetting peer for OFTAdapter contract:");
      console.log("OFTAdapter address:", sepoliaContracts.oftAdapter);
      console.log("Etherlink EID:", etherlinkEid);
      console.log("OFT address:", etherlinkContracts.oft);

      // Set the peer
      const tx = await oftAdapter.setPeer(etherlinkEid, zeroPad(etherlinkContracts.oft, 32));
      const receipt = await tx.wait();

      console.log("\nPeer setup completed successfully");
      console.log("Transaction hash:", receipt.hash);

      console.log("\nIMPORTANT: Make sure to also run set-oft-peer on Etherlink network");
      console.log("npx hardhat set-oft-peer --network etherlink");
    } catch (error) {
      console.error("Error setting OFTAdapter peer:", error);
      throw error;
    }
  },
);
