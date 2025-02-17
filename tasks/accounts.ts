import { HDNodeWallet } from "ethers";
import { task } from "hardhat/config";

task("accounts", "Prints the list of accounts with their private keys", async (_taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();
  const provider = hre.ethers.provider;
  const mnemonic = (hre.network.config.accounts as { mnemonic: string }).mnemonic;

  console.log("\nAccounts:");
  console.log("=========");

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const balance = await provider.getBalance(account.address);
    const path = `m/44'/60'/0'/0/${i}`;
    const wallet = HDNodeWallet.fromPhrase(mnemonic, undefined, path);

    console.log("\nAddress:", account.address);
    console.log("Private Key:", wallet.privateKey);
    console.log("Path:", path);
    console.log("Balance:", hre.ethers.formatEther(balance), "ETH");
  }
});
