import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import "hardhat-deploy";
import type { HardhatUserConfig } from "hardhat/config";
import type { NetworkUserConfig } from "hardhat/types";

import "./tasks/accounts";
import "./tasks/deployOFT";
import "./tasks/deployOFTAdapter";
import "./tasks/deployToken";
import "./tasks/sendOFT";
import "./tasks/sendOFTBack";
import "./tasks/setConfig";
import "./tasks/setEnforcedOptions";
import "./tasks/setOFTAdapterPeer";
import "./tasks/setOFTPeer";
import "./tasks/setupBridge";
import "./tasks/verify";

// Load environment variables from .env file
dotenv.config();

// Check for required environment variables
let MNEMONIC = process.env.MNEMONIC;
if (!MNEMONIC) {
  console.warn("Please set your MNEMONIC in a .env file, using default value");
  MNEMONIC = "test test test test test test test test test test test junk";
}

const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
if (!INFURA_API_KEY) {
  console.warn("Warning: INFURA_API_KEY not set in .env file");
}

const chainIds = {
  "arbitrum-mainnet": 42161,
  avalanche: 43114,
  bsc: 56,
  ganache: 1,
  hardhat: 31337,
  ethereum: 1,
  "optimism-mainnet": 10,
  "polygon-mainnet": 137,
  "polygon-mumbai": 80001,
  sepolia: 11155111,
  "etherlink-testnet": 128123,
  "etherlink-mainnet": 42793,
};

function getChainConfig(chain: keyof typeof chainIds): NetworkUserConfig {
  let jsonRpcUrl: string;
  switch (chain) {
    case "ethereum":
      jsonRpcUrl = "https://eth.llamarpc.com";
      break;
    case "avalanche":
      jsonRpcUrl = "https://api.avax.network/ext/bc/C/rpc";
      break;
    case "bsc":
      jsonRpcUrl = "https://bsc-dataseed1.binance.org";
      break;
    case "etherlink-testnet":
      jsonRpcUrl = "https://node.ghostnet.etherlink.com";
      break;
    case "etherlink-mainnet":
      jsonRpcUrl = "https://node.mainnet.etherlink.com";
      break;
    case "sepolia":
      jsonRpcUrl = "https://rpc.ankr.com/eth_sepolia";
      break;
    default:
      jsonRpcUrl = "https://" + chain + ".infura.io/v3/" + INFURA_API_KEY;
  }
  return {
    accounts: {
      count: 10,
      mnemonic: MNEMONIC,
      path: "m/44'/60'/0'/0",
    },
    chainId: chainIds[chain],
    url: jsonRpcUrl,
  };
}

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: 0,
  },
  etherscan: {
    apiKey: {
      arbitrumOne: process.env.ARBISCAN_API_KEY || "",
      avalanche: process.env.SNOWTRACE_API_KEY || "",
      bsc: process.env.BSCSCAN_API_KEY || "",
      ethereum: process.env.ETHERSCAN_API_KEY || "",
      optimisticEthereum: process.env.OPTIMISM_API_KEY || "",
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      "etherlink-testnet": process.env.ETHERLINK_API_KEY || "1", // value must not be empty
      "etherlink-mainnet": process.env.ETHERLINK_API_KEY || "1", // value must not be empty
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com/",
        },
      },
      {
        network: "etherlink-testnet",
        chainId: 128123,
        urls: {
          apiURL: "https://testnet.explorer.etherlink.com/api",
          browserURL: "https://testnet.explorer.etherlink.com",
        },
      },
    ],
  },
  gasReporter: {
    currency: "USD",
    enabled: true,
    excludeContracts: [],
    src: "./contracts",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    token: "ETH",
    gasPriceApi: "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
    showTimeSpent: true,
    showMethodSig: true,
    noColors: true,
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: MNEMONIC,
      },
      chainId: chainIds.hardhat,
    },
    ganache: {
      accounts: {
        mnemonic: MNEMONIC,
      },
      chainId: chainIds.ganache,
      url: "http://localhost:8545",
    },
    arbitrum: getChainConfig("arbitrum-mainnet"),
    avalanche: getChainConfig("avalanche"),
    bsc: getChainConfig("bsc"),
    ethereum: getChainConfig("ethereum"),
    optimism: getChainConfig("optimism-mainnet"),
    "polygon-mainnet": getChainConfig("polygon-mainnet"),
    "polygon-mumbai": getChainConfig("polygon-mumbai"),
    sepolia: getChainConfig("sepolia"),
    "etherlink-testnet": getChainConfig("etherlink-testnet"),
    "etherlink-mainnet": getChainConfig("etherlink-mainnet"),
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.20",
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/hardhat-template/issues/31
        bytecodeHash: "none",
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
    },
  },

  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
};

export default config;
