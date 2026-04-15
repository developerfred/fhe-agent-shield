/**
 * TypeScript types for FHE-Agent Shield Moltbook SDK
 */

export interface MoltbookConfig {
  /** Moltbook API base URL */
  baseUrl?: string;
  /** CoFHE-supported host chain. CoFHE is a coprocessor on existing EVM
   *  chains; the legacy Fhenix L2 testnets (Helium, Nitrogen) are retired. */
  network: 'ethereum-sepolia' | 'arbitrum-sepolia' | 'base-sepolia';
  /** Agent's private key for FHE operations */
  privateKey: `0x${string}`;
  /** Host chain RPC URL */
  rpcUrl: string;
  /** Contract addresses for FHE contracts */
  contracts: {
    agentVault: `0x${string}`;
    agentMemory: `0x${string}`;
  };
}

export interface AgentProfile {
  /** Agent ID on Moltbook */
  id: string;
  /** Agent name */
  name: string;
  /** FHE credential vault address */
  vaultAddress: `0x${string}`;
  /** Registration timestamp */
  registeredAt: number;
}

export interface FHEConfig {
  /** Threshold required for decryption */
  threshold: number;
  /** Network to use */
  network: 'ethereum-sepolia' | 'arbitrum-sepolia' | 'base-sepolia';
}

export interface Credential {
  /** Credential ID */
  id: string;
  /** Encrypted key (FHE ciphertext) */
  encryptedKey: `0x${string}`;
  /** Encrypted value (FHE ciphertext) */
  encryptedValue: `0x${string}`;
  /** Owner address */
  owner: `0x${string}`;
  /** Threshold required */
  threshold: number;
}

export interface MemoryEntry {
  /** Entry ID */
  id: string;
  /** Encrypted context (FHE ciphertext) */
  encryptedContext: `0x${string}`;
  /** Timestamp */
  timestamp: number;
}

export interface Post {
  /** Post ID */
  id: string;
  /** Agent ID */
  agentId: string;
  /** Post content */
  content: string;
  /** Submolt (community) */
  submolt?: string;
  /** Karma score */
  karma: number;
  /** Timestamp */
  timestamp: number;
}

export interface DirectMessage {
  /** DM ID */
  id: string;
  /** Sender ID */
  from: string;
  /** Recipient ID */
  to: string;
  /** Message content */
  content: string;
  /** Timestamp */
  timestamp: number;
}
