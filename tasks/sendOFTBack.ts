import { zeroPad } from "@ethersproject/bytes";
import { Options } from "@layerzerolabs/lz-v2-utilities";
import { waitForMessageReceived } from "@layerzerolabs/scan-client";
import * as fs from "fs";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { getLzEId, getNetworkPair, isMainnet } from "../constants";

const OFT_CONTRACT_NAME = "MyOFT";

interface ContractsJson {
  oft?: string;
  oftAdapter?: string;
  token?: string;
  [key: string]: string | undefined;
}

// LayerZero interfaces for type safety
interface SendParam {
  dstEid: number;
  to: `0x${string}`;
  amountLD: bigint;
  minAmountLD: bigint;
  extraOptions: string;
  composeMsg: string;
  oftCmd: string;
}

interface MessagingFee {
  nativeFee: bigint;
  lzTokenFee: bigint;
}

task("send-oft-back", "Send OFT tokens back to source chain")
  .addParam("amount", "Amount of tokens to send (in full tokens, not wei)")
  .addParam("receiver", "Receiver address on the source chain")
  .addOptionalParam("gasDrop", "Amount of native gas to drop on destination chain (in wei)", "0")
  .addOptionalParam("maxGas", "Max gas for executor lz receive option", "200000")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    try {
      const network = hre.network.name;

      // Get network configuration
      const mainnet = isMainnet(network);
      const { sourceNetwork, targetNetwork } = getNetworkPair(network);

      // Validate network - this task must be run on the target chain
      if (network !== targetNetwork) {
        throw new Error(`This task must be run on ${targetNetwork} network`);
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

      // Get the sender account
      const [sender] = await hre.ethers.getSigners();
      console.log("Sending tokens back with account:", sender.address);
      console.log("Environment:", mainnet ? "Mainnet" : "Testnet");

      // Get contract instance
      const oft = await hre.ethers.getContractAt(OFT_CONTRACT_NAME, targetContracts.oft, sender);

      // Convert amount to wei
      const amountInWei = hre.ethers.parseEther(taskArgs.amount);
      const receiverAddressInBytes32 = `0x${zeroPad(taskArgs.receiver, 32).slice(2)}` as `0x${string}`;

      // Get LayerZero endpoint IDs
      const srcEid = getLzEId(sourceNetwork);
      const dstEid = getLzEId(targetNetwork);

      console.log("\nSending tokens back cross-chain:");
      console.log("From:", targetNetwork, "(EID:", dstEid, ")");
      console.log("To:", sourceNetwork, "(EID:", srcEid, ")");
      console.log("Amount:", taskArgs.amount, "tokens");
      console.log("Receiver:", taskArgs.receiver);
      console.log("Gas drop:", taskArgs.gasDrop, "wei");
      console.log("Max gas:", taskArgs.maxGas);

      // Step 1: Set options
      const options = Options.newOptions()
        .addExecutorNativeDropOption(BigInt(taskArgs.gasDrop), taskArgs.receiver)
        .addExecutorLzReceiveOption(BigInt(taskArgs.maxGas), 0)
        .toHex()
        .toString();

      // Step 2: Set send parameters
      const sendParam: SendParam = {
        dstEid: srcEid, // Sending back to source chain
        to: receiverAddressInBytes32,
        amountLD: amountInWei,
        minAmountLD: amountInWei,
        extraOptions: options,
        composeMsg: "0x",
        oftCmd: "0x",
      };

      // Step 3: Quote native fee
      console.log("\nEstimating cross-chain fee...");
      const [nativeFee] = await oft.quoteSend.staticCall(sendParam, false);
      console.log("Estimated fee:", hre.ethers.formatEther(nativeFee), "ETH");

      // Step 4: Send tokens
      console.log("\nSending tokens...");
      const messagingFee: MessagingFee = {
        nativeFee,
        lzTokenFee: BigInt(0),
      };

      const sendTx = await oft.send(sendParam, messagingFee, sender.address, {
        value: nativeFee,
      });
      const sendTxReceipt = await sendTx.wait();

      if (!sendTxReceipt?.hash) {
        throw new Error("Transaction failed - no hash returned");
      }

      console.log("Send transaction:", sendTxReceipt.hash);

      // Step 5: Wait for message delivery
      console.log("\nWaiting for cross-chain message delivery...");
      const deliveredMsg = await waitForMessageReceived(srcEid, sendTxReceipt.hash);
      console.log("Message delivered! Destination transaction:", deliveredMsg?.dstTxHash);

      console.log("\nToken transfer completed successfully!");
      console.log(`Check ${sourceNetwork} explorer for the destination transaction.`);
    } catch (error) {
      console.error("Error sending tokens back:", error);
      throw error;
    }
  });
