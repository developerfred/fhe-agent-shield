export type NetworkName = 'fhenix-helium' | 'fhenix-nitrogen' | 'arbitrum-sepolia' | 'base-sepolia';

export interface NetworkConfig {
  name: NetworkName;
  rpcUrl: string;
  chainId: number;
  explorerUrl: string;
}

export const NETWORKS: Record<NetworkName, NetworkConfig> = {
  'fhenix-helium': {
    name: 'fhenix-helium',
    rpcUrl: 'https://api.helium.fhenix.zone',
    chainId: 8008135,
    explorerUrl: 'https://explorer.helium.fhenix.zone',
  },
  'fhenix-nitrogen': {
    name: 'fhenix-nitrogen',
    rpcUrl: 'https://api.nitrogen.fhenix.zone',
    chainId: 8008148,
    explorerUrl: 'https://explorer.nitrogen.fhenix.zone',
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
