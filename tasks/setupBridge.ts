import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { getNetworkPair, isMainnet } from "../utils";

task("setup-bridge", "Sets up and tests the OFT bridge between chains")
  .addParam("tokenName", "Token name", "TestOPN")
  .addParam("tokenSymbol", "Token symbol", "TSTOPN")
  .addParam("tokenSupply", "Initial token supply", "2200000")
  .addParam("oftName", "OFT token name", "TestOFT")
  .addParam("oftSymbol", "OFT token symbol", "TOFT")
  .addParam("testAmount", "Amount to test bridge with", "100")
  .addParam("receiver", "Receiver address for test transfer", "0x947226984c8008C16547c9Fe3b9EF5d84DF4Af55")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    try {
      const network = hre.network.name;
      const mainnet = isMainnet(network);
      const { sourceNetwork, targetNetwork } = getNetworkPair(network);

      // Validate network - this task must be run on the source chain
      if (network !== sourceNetwork) {
        throw new Error(`This task must be run on ${sourceNetwork} network`);
      }

      console.log("\n=== Starting Bridge Setup ===");
      console.log("Environment:", mainnet ? "Mainnet" : "Testnet");
      console.log("Source Network:", sourceNetwork);
      console.log("Target Network:", targetNetwork);

      // Step 1: Deploy Token on source chain
      console.log("\n=== Step 1: Deploying Token on source chain ===");
      const tokenAddress = await hre.run("deploy-token", {
        name: taskArgs.tokenName,
        symbol: taskArgs.tokenSymbol,
        supply: taskArgs.tokenSupply,
      });

      // Step 2: Deploy OFTAdapter on source chain
      console.log("\n=== Step 2: Deploying OFTAdapter on source chain ===");
      await hre.run("deploy-oft-adapter", {
        token: tokenAddress,
      });

      // Step 3: Deploy OFT on target chain
      console.log("\n=== Step 3: Deploying OFT on target chain ===");
      console.log(`Please run the following command on ${targetNetwork}:`);
      console.log(
        `npx hardhat deploy-oft --name "${taskArgs.oftName}" --symbol "${taskArgs.oftSymbol}" --network ${targetNetwork}`,
      );
      console.log("Press Enter after completing the OFT deployment on the target chain...");
      await new Promise((resolve) => process.stdin.once("data", resolve));

      // Step 4: Set trusted peers
      console.log("\n=== Step 4: Setting up peers ===");
      await hre.run("set-oftadapter-peer");
      console.log(`\nPlease run the following command on ${targetNetwork}:`);
      console.log(`npx hardhat set-oft-peer --network ${targetNetwork}`);
      console.log("Press Enter after setting up the OFT peer...");
      await new Promise((resolve) => process.stdin.once("data", resolve));

      // Step 5: Set enforced options
      console.log("\n=== Step 5: Setting enforced options ===");
      await hre.run("set-enforced-options", {
        isForOftAdapter: true,
      });
      console.log(`\nPlease run the following command on ${targetNetwork}:`);
      console.log(`npx hardhat set-enforced-options --network ${targetNetwork}`);
      console.log("Press Enter after setting enforced options...");
      await new Promise((resolve) => process.stdin.once("data", resolve));

      // Step 6: Set config
      console.log("\n=== Step 6: Setting LayerZero configuration ===");
      await hre.run("set-config", {
        isForOftAdapter: true,
      });
      console.log(`\nPlease run the following command on ${targetNetwork}:`);
      console.log(`npx hardhat set-config --network ${targetNetwork}`);
      console.log("Press Enter after setting the configuration...");
      await new Promise((resolve) => process.stdin.once("data", resolve));

      // Step 7: Test bridge by sending tokens
      console.log("\n=== Step 7: Testing bridge by sending tokens ===");
      await hre.run("send-oft", {
        amount: taskArgs.testAmount,
        receiver: taskArgs.receiver,
      });

      console.log("\n=== Bridge Setup Complete ===");
      console.log("\nTo send tokens back from the target chain, use:");
      console.log(
        `npx hardhat send-oft-back --amount ${taskArgs.testAmount} --receiver ${taskArgs.receiver} --network ${targetNetwork}`,
      );
    } catch (error) {
      console.error("Error setting up bridge:", error);
      throw error;
    }
  });
