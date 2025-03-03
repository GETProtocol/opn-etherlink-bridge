import * as fs from "fs";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { getLzEndpoint } from "../utils";

interface ContractsJson {
  oft?: string;
  endpoint?: string;
  [key: string]: string | undefined;
}

task("deploy-oft", "Deploys the MyOFT contract")
  .addParam("name", "Token name", "TestOFT")
  .addParam("symbol", "Token symbol", "TOFT")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    try {
      const { name, symbol } = taskArgs;
      const endpoint = getLzEndpoint(hre.network.name);

      // Get the deployer account
      const [deployer] = await hre.ethers.getSigners();
      console.log("Deploying MyOFT with the account:", deployer.address);

      // Deploy the contract
      const MyOFT = await hre.ethers.getContractFactory("MyOFT");
      const oft = await MyOFT.deploy(
        name,
        symbol,
        endpoint,
        deployer.address, // delegate/owner address
      );

      await oft.waitForDeployment();
      const deployedAddress = await oft.getAddress();

      console.log("MyOFT deployed to:", deployedAddress);
      console.log({
        name,
        symbol,
        endpoint,
        delegate: deployer.address,
        network: hre.network.name,
      });

      // Update the contracts file
      const network = hre.network.name;
      const contractsFile = `contracts.${network}.json`;
      let contracts: ContractsJson = {};

      if (fs.existsSync(contractsFile)) {
        contracts = JSON.parse(fs.readFileSync(contractsFile, "utf8"));
      }

      contracts.oft = deployedAddress;
      contracts.endpoint = endpoint;

      fs.writeFileSync(contractsFile, JSON.stringify(contracts, null, 2));
      console.log(`Contract addresses saved to ${contractsFile}`);

      return deployedAddress;
    } catch (error) {
      console.error("Error deploying MyOFT:", error);
      throw error;
    }
  });
