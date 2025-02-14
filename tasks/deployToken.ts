import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("deploy-token", "Deploys the MyToken contract")
  .addParam("name", "Token name", "TestOPN  ")
  .addParam("symbol", "Token symbol", "TSTOPN")
  .addParam("supply", "Initial supply (in full tokens, not wei)", "2200000")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    try {
      const [deployer] = await hre.ethers.getSigners();
      console.log("Deploying MyToken with the account:", deployer.address);

      // Convert supply to wei (18 decimals)
      const initialSupply = hre.ethers.parseEther(taskArgs.supply);

      const MyToken = await hre.ethers.getContractFactory("MyToken");
      const token = await MyToken.deploy(
        taskArgs.name,
        taskArgs.symbol,
        initialSupply,
        deployer.address, // owner
      );

      await token.waitForDeployment();

      const deployedAddress = await token.getAddress();

      console.log("Token deployed to:", deployedAddress);
      console.log({
        name: taskArgs.name,
        symbol: taskArgs.symbol,
        initialSupply: taskArgs.supply,
        owner: deployer.address,
        network: hre.network.name,
      });

      return deployedAddress;
    } catch (error) {
      console.error("Error deploying token:", error);
      throw error;
    }
  });
