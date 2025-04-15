import { Options } from "@layerzerolabs/lz-v2-utilities";
import * as fs from "fs";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { getLzEId, getNetworkPair, isMainnet } from "../utils";

interface ContractsJson {
  oft?: string;
  oftAdapter?: string;
  token?: string;
  endpoint?: string;
  [key: string]: string | undefined;
}

// Default gas settings - adjust these values for mainnet deployment
const DEFAULT_GAS_SETTINGS = {
  testnet: 200000, // Sufficient for testnet (Sepolia/Etherlink testnet)
  mainnet: 400000, // Higher value for mainnet (Ethereum/Etherlink mainnet)
} as const;

task("set-enforced-options", "Sets enforced options for OFT or OFTAdapter contract")
  .addFlag("isForOftAdapter", "Whether to set options for OFTAdapter (true) or OFT (false)")
  .addOptionalParam("maxGas", "Max gas for executor lz receive option", DEFAULT_GAS_SETTINGS.mainnet.toString())
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    try {
      const network = hre.network.name === "ganache" ? "ethereum" : hre.network.name;
      const isForOftAdapter = taskArgs.isForOftAdapter;
      const maxGas = parseInt(taskArgs.maxGas);

      // Get network configuration
      const mainnet = isMainnet(network);
      const { sourceNetwork, targetNetwork } = getNetworkPair(network);

      // Validate network based on contract type
      if (isForOftAdapter && network !== sourceNetwork) {
        throw new Error(`OFTAdapter options must be set on ${sourceNetwork} network`);
      }
      if (!isForOftAdapter && network !== targetNetwork) {
        throw new Error(`OFT options must be set on ${targetNetwork} network`);
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
      console.log("Setting enforced options with account:", deployer.address);

      // Get contract instances
      const contract = isForOftAdapter
        ? await hre.ethers.getContractAt("MyOFTAdapter", sourceContracts.oftAdapter)
        : await hre.ethers.getContractAt("MyOFT", targetContracts.oft);

      // Get remote chain's EID
      const remoteEid = isForOftAdapter ? getLzEId(targetNetwork) : getLzEId(sourceNetwork);

      console.log("\nSetting enforced options:");
      console.log("Environment:", mainnet ? "Mainnet" : "Testnet");
      console.log("Contract:", isForOftAdapter ? "OFTAdapter" : "OFT");
      console.log("Contract address:", isForOftAdapter ? sourceContracts.oftAdapter : targetContracts.oft);
      console.log("Remote EID:", remoteEid);
      console.log("Max gas:", maxGas);
      console.log("Network:", network);

      // Create options with environment-specific gas settings
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
      const otherNetwork = isForOftAdapter ? targetNetwork : sourceNetwork;
      const otherContract = isForOftAdapter ? "OFT" : "OFTAdapter";
      console.log(`\nIMPORTANT: Make sure to also set enforced options for ${otherContract} on ${otherNetwork}`);
      console.log(
        `npx hardhat set-enforced-options --is-for-oft-adapter ${!isForOftAdapter} --network ${otherNetwork}`,
      );

      if (!mainnet) {
        console.log("\nNote: For mainnet deployment, use appropriate gas values with --max-gas parameter");
        console.log(`Recommended mainnet gas: ${DEFAULT_GAS_SETTINGS.mainnet}`);
      }
    } catch (error) {
      console.error("Error setting enforced options:", error);
      throw error;
    }
  });
