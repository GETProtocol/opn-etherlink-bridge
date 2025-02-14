import { Options } from "@layerzerolabs/lz-v2-utilities";
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

const DEFAULT_MAX_GAS = 200000; // Default max gas for executor lz receive option

task("set-enforced-options", "Sets enforced options for OFT or OFTAdapter contract")
  .addParam("isForOftAdapter", "Whether to set options for OFTAdapter (true) or OFT (false)")
  .addOptionalParam("maxGas", "Max gas for executor lz receive option", DEFAULT_MAX_GAS.toString())
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    try {
      const network = hre.network.name;
      const isForOftAdapter = taskArgs.isForOftAdapter.toLowerCase() === "true";
      const maxGas = parseInt(taskArgs.maxGas);

      // Validate network and get contracts
      if (isForOftAdapter && network !== NETWORK_NAMES.SEPOLIA) {
        throw new Error("OFTAdapter options must be set on Sepolia network");
      }
      if (!isForOftAdapter && network !== NETWORK_NAMES.ETHERLINK) {
        throw new Error("OFT options must be set on Etherlink network");
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
      console.log("Setting enforced options with account:", deployer.address);

      // Get contract instances
      const contract = isForOftAdapter
        ? await hre.ethers.getContractAt("MyOFTAdapter", sepoliaContracts.oftAdapter)
        : await hre.ethers.getContractAt("MyOFT", etherlinkContracts.oft);

      // Get remote chain's EID
      const remoteEid = isForOftAdapter ? getLzChainId(NETWORK_NAMES.ETHERLINK) : getLzChainId(NETWORK_NAMES.SEPOLIA);

      console.log("\nSetting enforced options:");
      console.log("Contract:", isForOftAdapter ? "OFTAdapter" : "OFT");
      console.log("Contract address:", isForOftAdapter ? sepoliaContracts.oftAdapter : etherlinkContracts.oft);
      console.log("Remote EID:", remoteEid);
      console.log("Max gas:", maxGas);

      // Create options
      const options = Options.newOptions().addExecutorLzReceiveOption(maxGas, 0);

      // Create enforced options array
      const enforcedOptions = [
        {
          eid: remoteEid,
          msgType: 1,
          options: options.toBytes(),
        },
      ];

      // Set the enforced options
      const tx = await contract.setEnforcedOptions(enforcedOptions);
      const receipt = await tx.wait();

      console.log("\nEnforced options set successfully");
      console.log("Transaction hash:", receipt?.hash);

      // Remind about setting options on the other chain
      const otherNetwork = isForOftAdapter ? NETWORK_NAMES.ETHERLINK : NETWORK_NAMES.SEPOLIA;
      const otherContract = isForOftAdapter ? "OFT" : "OFTAdapter";
      console.log(`\nIMPORTANT: Make sure to also set enforced options for ${otherContract} on ${otherNetwork}`);
      console.log(
        `npx hardhat set-enforced-options --is-for-oft-adapter ${!isForOftAdapter} --network ${otherNetwork}`,
      );
    } catch (error) {
      console.error("Error setting enforced options:", error);
      throw error;
    }
  });
