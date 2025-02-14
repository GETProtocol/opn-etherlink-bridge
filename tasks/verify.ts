import * as fs from "fs";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

interface ContractConfig {
  token?: string;
  oft?: string;
  oftAdapter?: string;
  endpoint?: string;
  tokenParams?: {
    name: string;
    symbol: string;
    supply: string;
  };
  oftParams?: {
    name: string;
    symbol: string;
  };
}

task("verify-contracts", "Verifies contracts on Etherscan").setAction(async (_, hre: HardhatRuntimeEnvironment) => {
  try {
    const network = hre.network.name;
    const contractsFile = `contracts.${network}.json`;

    if (!fs.existsSync(contractsFile)) {
      throw new Error(`Contracts file not found: ${contractsFile}`);
    }

    const contracts: ContractConfig = JSON.parse(fs.readFileSync(contractsFile, "utf8"));
    const [deployer] = await hre.ethers.getSigners();

    console.log(`Verifying contracts on ${network}...`);
    console.log("Deployer address:", deployer.address);

    // Verify Token
    if (contracts.token) {
      console.log(`\nVerifying Token at ${contracts.token}`);
      try {
        const tokenParams = contracts.tokenParams || {
          name: "TestOPN",
          symbol: "TSTOPN",
          supply: "2200000",
        };

        await hre.run("verify:verify", {
          address: contracts.token,
          constructorArguments: [
            tokenParams.name,
            tokenParams.symbol,
            hre.ethers.parseEther(tokenParams.supply),
            deployer.address, // owner is the deployer
          ],
        });
        console.log("Token verification successful");
      } catch (error) {
        console.error("Token verification failed:", error);
      }
    }

    // Verify OFT
    if (contracts.oft) {
      console.log(`\nVerifying OFT at ${contracts.oft}`);
      try {
        const oftParams = contracts.oftParams || {
          name: "TestOFT",
          symbol: "TOFT",
        };

        await hre.run("verify:verify", {
          address: contracts.oft,
          constructorArguments: [
            oftParams.name,
            oftParams.symbol,
            contracts.endpoint,
            deployer.address, // delegate/owner is the deployer
          ],
        });
        console.log("OFT verification successful");
      } catch (error) {
        console.error("OFT verification failed:", error);
      }
    }

    // Verify OFTAdapter
    if (contracts.oftAdapter) {
      console.log(`\nVerifying OFTAdapter at ${contracts.oftAdapter}`);
      try {
        await hre.run("verify:verify", {
          address: contracts.oftAdapter,
          constructorArguments: [
            contracts.token,
            contracts.endpoint,
            deployer.address, // owner is the deployer
          ],
        });
        console.log("OFTAdapter verification successful");
      } catch (error) {
        console.error("OFTAdapter verification failed:", error);
      }
    }
  } catch (error) {
    console.error("Verification failed:", error);
    throw error;
  }
});
