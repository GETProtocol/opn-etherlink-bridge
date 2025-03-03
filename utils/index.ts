import { CHAIN_CONFIG, NETWORK_NAMES } from "../constants";

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
