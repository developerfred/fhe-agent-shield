/**
 * TypeScript types for FHE-Agent Shield Moltworker
 */

export interface Env {
  /** CoFHE-supported host chain (sepolia, arbitrum-sepolia, base-sepolia) */
  COFHE_NETWORK?: string;
  /** FHE Contract address on the host chain */
  FHE_CONTRACT_ADDRESS?: string;
  /** Cloudflare KV for credential storage */
  CREDENTIAL_KV?: KVNamespace;
}

export interface FHEProxyConfig {
  /**
   * CoFHE-supported host chain. The legacy Fhenix L2 testnets (Helium,
   * Nitrogen) have been retired — CoFHE now runs on existing EVM chains.
   */
  network: 'sepolia' | 'arbitrum-sepolia' | 'base-sepolia';
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
