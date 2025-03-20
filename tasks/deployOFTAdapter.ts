import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { getLzEndpoint } from "../utils";

task("deploy-oft-adapter", "Deploys the OFTAdapter contract")
  .addParam("token", "The ERC20 token address", "0xc28eb2250d1ae32c7e74cfb6d6b86afc9beb6509")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    try {
      const { token } = taskArgs;
      const endpoint = getLzEndpoint(hre.network.name);

      // Get the deployer account
      const [deployer] = await hre.ethers.getSigners();

      console.log("Deploying OFTAdapter with the account:", deployer.address);

      // Deploy the contract
      const OFTAdapter = await hre.ethers.getContractFactory("MyOFTAdapter");
      const oftAdapter = await OFTAdapter.deploy(
        token,
        endpoint,
        deployer.address, // owner address
      );

      await oftAdapter.waitForDeployment();

      const deployedAddress = await oftAdapter.getAddress();

      console.log("OFTAdapter deployed to:", deployedAddress);
      console.log("Token address:", token);
      console.log("LZ Endpoint:", endpoint);

      return deployedAddress;
    } catch (error) {
      console.error("Error deploying OFTAdapter:", error);
      throw error;
    }
  });
