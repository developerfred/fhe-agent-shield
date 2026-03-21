/**
 * TypeScript types for FHE-Agent Shield Moltworker
 */

export interface Env {
  /** Fhenix network (helium or nitrogen) */
  FHENIX_NETWORK?: string;
  /** FHE Contract address on Fhenix */
  FHE_CONTRACT_ADDRESS?: string;
  /** Cloudflare KV for credential storage */
  CREDENTIAL_KV?: KVNamespace;
}

export interface FHEProxyConfig {
  network: 'helium' | 'nitrogen';
  rpcUrl: string;
  contractAddress: string;
}

export interface Credential {
  id: string;
  encryptedKey: string;
  encryptedValue: string;
  threshold: number;
  owner: string;
  createdAt: number;
}

export interface ProxyRequest {
  action: 'encrypt' | 'decrypt' | 'compute';
  data: string;
  threshold?: number;
  permits?: number;
}

export interface ProxyResponse {
  success: boolean;
  result?: string;
  error?: string;
}
