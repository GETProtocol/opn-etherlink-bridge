// Chain configuration for LayerZero v2
export const CHAIN_CONFIG = {
  ETHEREUM: {
    lzEndpointOnCurrentChain: "0x1a44076050125825900e736c501f859c50fE728c",
    lzEndpointIdOnCurrentChain: 30101,
    requiredDVNsOnCurrentChain: [
      "0x589dEDbD617e0CBcB916A9223F4d1300c294236b", // LayerZero Labs
    ],
    optionalDVNsOnCurrentChain: [], // if specifying optional DVN, the setConfig tx will get reverted
    sendLibAddressOnCurrentChain: "0xbB2Ea70C9E858123480642Cf96acbcCE1372dCe1",
    receiveLibAddressOnCurrentChain: "0xc02Ab410f0734EFa3F14628780e6e695156024C2",
    confirmationsOnCurrentChain: 0, // will get default confirmations
  },
  SEPOLIA: {
    lzEndpointOnCurrentChain: "0x6EDCE65403992e310A62460808c4b910D972f10f",
    lzEndpointIdOnCurrentChain: 40161,
    requiredDVNsOnCurrentChain: [
      "0x8eebf8b423b73bfca51a1db4b7354aa0bfca9193", // LayerZero Labs
    ],
    optionalDVNsOnCurrentChain: [], // if specifying optional DVN, the setConfig tx will get reverted
    sendLibAddressOnCurrentChain: "0xcc1ae8Cf5D3904Cef3360A9532B477529b177cCE",
    receiveLibAddressOnCurrentChain: "0xdAf00F5eE2158dD58E0d3857851c432E34A3A851",
    confirmationsOnCurrentChain: 0, // will get default confirmations
  },
  "ETHERLINK-TESTNET": {
    lzEndpointOnCurrentChain: "0xec28645346D781674B4272706D8a938dB2BAA2C6",
    lzEndpointIdOnCurrentChain: 40239,
    requiredDVNsOnCurrentChain: [
      "0x4d97186cd94047e285b7cb78fa63c93e69e7aad0", // LayerZero Labs
    ],
    optionalDVNsOnCurrentChain: [], // if specifying optional DVN, the setConfig tx will get reverted
    sendLibAddressOnCurrentChain: "0xE62d066e71fcA410eD48ad2f2A5A860443C04035",
    receiveLibAddressOnCurrentChain: "0x2072a32Df77bAE5713853d666f26bA5e47E54717",
    confirmationsOnCurrentChain: 0, // will get default confirmations
  },
  "ETHERLINK-MAINNET": {
    lzEndpointOnCurrentChain: "0xAaB5A48CFC03Efa9cC34A2C1aAcCCB84b4b770e4",
    lzEndpointIdOnCurrentChain: 30292,
    requiredDVNsOnCurrentChain: [
      "0xc097ab8cd7b053326dfe9fb3e3a31a0cce3b526f", // LayerZero Labs
    ],
    optionalDVNsOnCurrentChain: [], // if specifying optional DVN, the setConfig tx will get reverted
    sendLibAddressOnCurrentChain: "0xc1B621b18187F74c8F6D52a6F709Dd2780C09821",
    receiveLibAddressOnCurrentChain: "0x2072a32Df77bAE5713853d666f26bA5e47E54717",
    confirmationsOnCurrentChain: 0, // will get default confirmations
  },
} as const;

// Some LayerZero error codes
// https://docs.layerzero.network/v2/developers/evm/create-lz-oapp/debugging
export const LZ_ERRORS = {
  "0xf6ff4fb7":
    "NoPeer: Peer is not set. Please make sure to set up the OFT peer first using set-oft-peer and set-oftadapter-peer tasks",
  "0x91ac5e4f": "OnlyEndpoint: Invalid endpoint call",
  "0x0fbdec0a": "InvalidEndpointCall: Invalid endpoint caller",
  "0x9f704120": "NotEnoughNative: Insufficient native gas",
  "0x5373352a": "LzTokenUnavailable: LayerZero token is not available",
  "0x71c4efed": "SlippageExceeded: Token amount is outside slippage tolerance",
  "0x1e9714b0": "InvalidLocalDecimals: Invalid token decimals",
  "0x9a6d49cd": "InvalidOptions: Invalid options provided",
  "0xb5863604": "InvalidDelegate: Invalid delegate address",
  "0xc26bebcc": "OnlyPeer: Only peer can call this function",
} as const;

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
  const key = Object.entries(NETWORK_NAMES).find(([_, value]) => value === network)?.[0];
  if (!key || !CHAIN_CONFIG[key as keyof typeof CHAIN_CONFIG]) {
    throw new Error(`No LayerZero endpoint found for network: ${network}`);
  }
  return CHAIN_CONFIG[key as keyof typeof CHAIN_CONFIG].lzEndpointOnCurrentChain;
}

// Helper function to get LZ EID by network name
export function getLzEId(network: string): number {
  const key = Object.entries(NETWORK_NAMES).find(([_, value]) => value === network)?.[0];
  if (!key || !CHAIN_CONFIG[key as keyof typeof CHAIN_CONFIG]) {
    throw new Error(`No LayerZero EID found for network: ${network}`);
  }
  return CHAIN_CONFIG[key as keyof typeof CHAIN_CONFIG].lzEndpointIdOnCurrentChain;
}

// Helper function to get pathway configuration
export function getPathwayConfig(srcNetwork: string, destNetwork: string) {
  const srcKey = Object.entries(NETWORK_NAMES).find(([_, value]) => value === srcNetwork)?.[0];
  const destKey = Object.entries(NETWORK_NAMES).find(([_, value]) => value === destNetwork)?.[0];

  if (!srcKey || !destKey || !CHAIN_CONFIG[srcKey as keyof typeof CHAIN_CONFIG]) {
    throw new Error(`Invalid network configuration for ${srcNetwork} -> ${destNetwork}`);
  }

  const srcConfig = CHAIN_CONFIG[srcKey as keyof typeof CHAIN_CONFIG];
  const destConfig = CHAIN_CONFIG[destKey as keyof typeof CHAIN_CONFIG];

  return {
    ...srcConfig,
    lzEndpointIdOnRemoteChain: destConfig.lzEndpointIdOnCurrentChain,
  };
}
