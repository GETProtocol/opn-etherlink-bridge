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

task("set-oft-peer", "Sets peer for OFT contract").setAction(async (_, hre: HardhatRuntimeEnvironment) => {
  try {
    const network = hre.network.name;

    if (network !== NETWORK_NAMES.ETHERLINK) {
      throw new Error("This task must be run on Etherlink network");
    }

    // Read contract addresses from both networks
    const etherlinkContracts = JSON.parse(
      fs.readFileSync(`contracts.${NETWORK_NAMES.ETHERLINK}.json`, "utf8"),
    ) as ContractsJson;

    const sepoliaContracts = JSON.parse(
      fs.readFileSync(`contracts.${NETWORK_NAMES.SEPOLIA}.json`, "utf8"),
    ) as ContractsJson;

    if (!etherlinkContracts.oft) {
      throw new Error("OFT contract not found on Etherlink");
    }
    if (!sepoliaContracts.oftAdapter) {
      throw new Error("OFTAdapter contract not found on Sepolia");
    }

    // Get the deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("Setting OFT peer with account:", deployer.address);

    // Get contract instance
    const MyOFT = await hre.ethers.getContractFactory("MyOFT");
    const oft = MyOFT.attach(etherlinkContracts.oft);

    // Get Sepolia's EID
    const sepoliaEid = getLzChainId(NETWORK_NAMES.SEPOLIA);

    console.log("\nSetting peer for OFT contract:");
    console.log("OFT address:", etherlinkContracts.oft);
    console.log("Sepolia EID:", sepoliaEid);
    console.log("OFTAdapter address:", sepoliaContracts.oftAdapter);

    // Set the peer
    const tx = await oft.setPeer(sepoliaEid, zeroPad(sepoliaContracts.oftAdapter, 32));
    const receipt = await tx.wait();

    console.log("\nPeer setup completed successfully");
    console.log("Transaction hash:", receipt.hash);

    console.log("\nIMPORTANT: Make sure to also run set-oftadapter-peer on Sepolia network");
    console.log("npx hardhat set-oftadapter-peer --network sepolia");
  } catch (error) {
    console.error("Error setting OFT peer:", error);
    throw error;
  }
});
