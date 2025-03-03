import { defaultAbiCoder } from "@ethersproject/abi";
import * as fs from "fs";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { getNetworkPair, getPathwayConfig, isMainnet } from "../utils";

const lzEndpointSetConfigABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_oapp",
        type: "address",
      },
      {
        internalType: "address",
        name: "_lib",
        type: "address",
      },
      {
        components: [
          {
            internalType: "uint32",
            name: "eid",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "configType",
            type: "uint32",
          },
          {
            internalType: "bytes",
            name: "config",
            type: "bytes",
          },
        ],
        internalType: "struct SetConfigParam[]",
        name: "_params",
        type: "tuple[]",
      },
    ],
    name: "setConfig",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

interface ContractsJson {
  oft?: string;
  oftAdapter?: string;
  token?: string;
  [key: string]: string | undefined;
}

task("set-config", "Sets LayerZero configuration for OFT or OFTAdapter contract")
  .addFlag("isForOftAdapter", "Whether to set config for OFTAdapter (true) or OFT (false)")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    try {
      const network = hre.network.name;
      const isForOftAdapter = taskArgs.isForOftAdapter;

      // Get network configuration
      const mainnet = isMainnet(network);
      const { sourceNetwork, targetNetwork } = getNetworkPair(network);

      // Validate network based on contract type
      if (isForOftAdapter && network !== sourceNetwork) {
        throw new Error(`OFTAdapter config must be set on ${sourceNetwork} network`);
      }
      if (!isForOftAdapter && network !== targetNetwork) {
        throw new Error(`OFT config must be set on ${targetNetwork} network`);
      }

      // Get pathway configuration
      const config = getPathwayConfig(network, isForOftAdapter ? targetNetwork : sourceNetwork);

      // Read contract addresses
      const contracts = JSON.parse(fs.readFileSync(`contracts.${network}.json`, "utf8")) as ContractsJson;

      // Get the OApp contract address (OFT or OFTAdapter)
      const oAppAddress = isForOftAdapter ? contracts.oftAdapter : contracts.oft;
      if (!oAppAddress) {
        throw new Error(`Contract not found on ${network}`);
      }

      console.log("\nSetting LayerZero configuration:");
      console.log("Environment:", mainnet ? "Mainnet" : "Testnet");
      console.log("Contract:", isForOftAdapter ? "OFTAdapter" : "OFT");
      console.log("OApp address:", oAppAddress);
      console.log("Endpoint:", config.lzEndpointOnCurrentChain);
      console.log("Remote EID:", config.lzEndpointIdOnRemoteChain);
      console.log("Required DVNs:", config.requiredDVNsOnCurrentChain);
      console.log("Confirmations:", config.confirmationsOnCurrentChain);

      // Create ULN config
      const ulnConfig = {
        confirmationsOnCurrentChain: config.confirmationsOnCurrentChain,
        requiredDVNCount: config.requiredDVNsOnCurrentChain.length,
        optionalDVNCount: config.optionalDVNsOnCurrentChain.length,
        optionalDVNThreshold: 0,
        requiredDVNsOnCurrentChain: config.requiredDVNsOnCurrentChain,
        optionalDVNsOnCurrentChain: config.optionalDVNsOnCurrentChain,
      };

      // Encode ULN config
      const ulnConfigStructType =
        "tuple(uint64 confirmationsOnCurrentChain, uint8 requiredDVNCount, uint8 optionalDVNCount, uint8 optionalDVNThreshold, address[] requiredDVNsOnCurrentChain, address[] optionalDVNsOnCurrentChain)";
      const ulnConfigEncoded = defaultAbiCoder.encode([ulnConfigStructType], [ulnConfig]);

      // Create config parameter
      const setConfigParam = {
        eid: config.lzEndpointIdOnRemoteChain,
        configType: 2, // CONFIG_TYPE_ULN
        config: ulnConfigEncoded,
      };

      // Get endpoint contract
      const lzEndpoint = await hre.ethers.getContractAt(lzEndpointSetConfigABI, config.lzEndpointOnCurrentChain);

      // Set config for both send and receive libraries
      const libraries = {
        SEND: config.sendLibAddressOnCurrentChain,
        RECEIVE: config.receiveLibAddressOnCurrentChain,
      };

      for (const [libType, libAddress] of Object.entries(libraries)) {
        console.log(`\nSetting config for ${libType} library: ${libAddress}`);
        const tx = await lzEndpoint.setConfig(oAppAddress, libAddress, [setConfigParam]);
        const receipt = await tx.wait();
        console.log("Transaction hash:", receipt?.hash);
      }

      console.log("\nConfiguration set successfully");

      // Remind about setting config on the other chain
      const otherNetwork = isForOftAdapter ? targetNetwork : sourceNetwork;
      const otherContract = isForOftAdapter ? "OFT" : "OFTAdapter";
      console.log(`\nIMPORTANT: Make sure to also set config for ${otherContract} on ${otherNetwork}`);
      console.log(`npx hardhat set-config --is-for-oft-adapter ${!isForOftAdapter} --network ${otherNetwork}`);
    } catch (error) {
      console.error("Error setting LayerZero config:", error);
      throw error;
    }
  });
