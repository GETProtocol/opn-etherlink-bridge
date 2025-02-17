export const LZ_ENDPOINTS = {
  SEPOLIA: "0x6EDCE65403992e310A62460808c4b910D972f10f",
  ETHEREUM: "0x1a44076050125825900e736c501f859c50fE728c",
  "ETHERLINK-TESTNET": "0xec28645346D781674B4272706D8a938dB2BAA2C6",
  "ETHERLINK-MAINNET": "0xAaB5A48CFC03Efa9cC34A2C1aAcCCB84b4b770e4",
} as const;

// E(Endpoint)IDs for LayerZero
export const LZ_EID = {
  SEPOLIA: 40161,
  ETHEREUM: 30101,
  "ETHERLINK-TESTNET": 40239,
  "ETHERLINK-MAINNET": 30292,
} as const;

export const LZ_DVN = {
  SEPOLIA: "0x8eebf8b423b73bfca51a1db4b7354aa0bfca9193",
  ETHEREUM: "0x589dedbd617e0cbcb916a9223f4d1300c294236b",
  "ETHERLINK-TESTNET": "0x4d97186cd94047e285b7cb78fa63c93e69e7aad0",
  "ETHERLINK-MAINNET": "0xc097ab8cd7b053326dfe9fb3e3a31a0cce3b526f",
} as const;

// Chain IDs for LayerZero
// export const LZ_CHAIN_IDS = {
//   SEPOLIA: 40161,
//   ETHEREUM: 1,
//   "ETHERLINK-TESTNET": 128123,
// } as const;

// Network names as used in hardhat config
export const NETWORK_NAMES = {
  SEPOLIA: "sepolia",
  ETHEREUM: "ethereum",
  "ETHERLINK-TESTNET": "etherlink-testnet",
  "ETHERLINK-MAINNET": "etherlink-mainnet",
} as const;

// Helper function to determine if a network is mainnet
export function isMainnet(network: string): boolean {
  return network === NETWORK_NAMES.ETHEREUM || network === NETWORK_NAMES["ETHERLINK-MAINNET"];
}

// Helper function to get corresponding network pair
export function getNetworkPair(network: string): { sourceNetwork: string; targetNetwork: string } {
  const mainnet = isMainnet(network);
  return {
    sourceNetwork: mainnet ? NETWORK_NAMES.ETHEREUM : NETWORK_NAMES.SEPOLIA,
    targetNetwork: mainnet ? NETWORK_NAMES["ETHERLINK-MAINNET"] : NETWORK_NAMES["ETHERLINK-TESTNET"],
  };
}

// Helper function to get LZ endpoint by network name
export function getLzEndpoint(network: string): string {
  switch (network.toLowerCase()) {
    case NETWORK_NAMES.ETHEREUM:
      return LZ_ENDPOINTS.ETHEREUM;
    case NETWORK_NAMES.SEPOLIA:
      return LZ_ENDPOINTS.SEPOLIA;
    case NETWORK_NAMES["ETHERLINK-TESTNET"]:
      return LZ_ENDPOINTS["ETHERLINK-TESTNET"];
    case NETWORK_NAMES["ETHERLINK-MAINNET"]:
      return LZ_ENDPOINTS["ETHERLINK-MAINNET"];
    default:
      throw new Error(`No LayerZero endpoint found for network: ${network}`);
  }
}

// Helper function to get LZ  E(Endpoint)ID by network name
export function getLzEId(network: string): number {
  switch (network.toLowerCase()) {
    case NETWORK_NAMES.ETHEREUM:
      return LZ_EID.ETHEREUM;
    case NETWORK_NAMES.SEPOLIA:
      return LZ_EID.SEPOLIA;
    case NETWORK_NAMES["ETHERLINK-TESTNET"]:
      return LZ_EID["ETHERLINK-TESTNET"];
    case NETWORK_NAMES["ETHERLINK-MAINNET"]:
      return LZ_EID["ETHERLINK-MAINNET"];
    default:
      throw new Error(`No LayerZero EID found for network: ${network}`);
  }
}
