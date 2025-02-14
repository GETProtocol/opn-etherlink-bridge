export const LZ_ENDPOINTS = {
  // Testnet endpoints
  SEPOLIA: "0x6EDCE65403992e310A62460808c4b910D972f10f",
  ETHERLINK: "0xec28645346D781674B4272706D8a938dB2BAA2C6",
} as const;

// Chain IDs for LayerZero
export const LZ_CHAIN_IDS = {
  SEPOLIA: 40161,
  ETHERLINK: 40162,
} as const;

// Network names as used in hardhat config
export const NETWORK_NAMES = {
  SEPOLIA: "sepolia",
  ETHERLINK: "etherlink",
} as const;

// Helper function to get LZ endpoint by network name
export function getLzEndpoint(network: string): string {
  switch (network.toLowerCase()) {
    case NETWORK_NAMES.SEPOLIA:
      return LZ_ENDPOINTS.SEPOLIA;
    case NETWORK_NAMES.ETHERLINK:
      return LZ_ENDPOINTS.ETHERLINK;
    default:
      throw new Error(`No LayerZero endpoint found for network: ${network}`);
  }
}

// Helper function to get LZ chain ID by network name
export function getLzChainId(network: string): number {
  switch (network.toLowerCase()) {
    case NETWORK_NAMES.SEPOLIA:
      return LZ_CHAIN_IDS.SEPOLIA;
    case NETWORK_NAMES.ETHERLINK:
      return LZ_CHAIN_IDS.ETHERLINK;
    default:
      throw new Error(`No LayerZero chain ID found for network: ${network}`);
  }
}
