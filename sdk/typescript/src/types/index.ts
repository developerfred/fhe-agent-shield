/**
 * CoFHE-supported host chains. Fhenix CoFHE is a coprocessor that runs on
 * existing EVM chains rather than a dedicated L1/L2. The legacy Fhenix L2
 * testnets (Helium, Nitrogen) have been retired.
 *
 * @see https://cofhe-docs.fhenix.zone/get-started/introduction/compatibility
 */
export type NetworkName = 'ethereum-sepolia' | 'arbitrum-sepolia' | 'base-sepolia';

export interface NetworkConfig {
  name: NetworkName;
  rpcUrl: string;
  chainId: number;
  explorerUrl: string;
}

export const NETWORKS: Record<NetworkName, NetworkConfig> = {
  'ethereum-sepolia': {
    name: 'ethereum-sepolia',
    rpcUrl: 'https://rpc.sepolia.org',
    chainId: 11155111,
    explorerUrl: 'https://sepolia.etherscan.io',
  },
  'arbitrum-sepolia': {
    name: 'arbitrum-sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    chainId: 421614,
    explorerUrl: 'https://sepolia.arbiscan.io',
  },
  'base-sepolia': {
    name: 'base-sepolia',
    rpcUrl: 'https://sepolia.base.org',
    chainId: 84532,
    explorerUrl: 'https://sepolia.basescan.org',
  },
};

export interface ContractAddresses {
  agentVault: `0x${string}`;
  agentMemory: `0x${string}`;
  skillRegistry: `0x${string}`;
  actionSealer: `0x${string}`;
}

export interface CredentialResult {
  handle: `0x${string}`;
  success: boolean;
}

export interface CredentialEntry {
  key: string;
  handle: `0x${string}`;
  threshold: number;
}

export interface ActionResult {
  actionId: `0x${string}`;
  success: boolean;
}

export interface ActionStatus {
  status: 0 | 1 | 2 | 3;
  statusText: 'Sealed' | 'Approved' | 'Released' | 'Cancelled';
}

export interface ContextResult {
  length: bigint;
  success: boolean;
}
