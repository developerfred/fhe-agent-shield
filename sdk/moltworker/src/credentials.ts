/**
 * FHE Credential Store for Cloudflare Workers
 * 
 * Stores FHE-encrypted credentials in Cloudflare KV with threshold authorization.
 */

import type { Env, Credential } from './types.js';

interface CredentialStoreConfig {
  network: 'helium' | 'nitrogen';
  contractAddress: string;
  kv?: KVNamespace;
}

export class FHECredentialStore {
  private config: CredentialStoreConfig;
  private credentials: Map<string, Credential> = new Map();

  constructor(config: CredentialStoreConfig) {
    this.config = config;
  }

  /**
   * Store an FHE-encrypted credential
   */
  async store(key: string, value: string, threshold = 2): Promise<string> {
    const id = `cred_${key}_${Date.now()}`;
    
    const credential: Credential = {
      id,
      encryptedKey: this.fheEncrypt(key),
      encryptedValue: this.fheEncrypt(value),
      threshold,
      owner: this.config.contractAddress,
      createdAt: Date.now(),
    };

    this.credentials.set(id, credential);

    // Persist to KV if available
    if (this.config.kv) {
      await this.config.kv.put(id, JSON.stringify(credential));
    }

    return id;
  }

  /**
   * Retrieve credential with threshold authorization
   */
  async retrieve(id: string, permits = 2): Promise<string | null> {
    const credential = this.credentials.get(id) || await this.loadFromKV(id);
    
    if (!credential) {
      return null;
    }

    if (permits < credential.threshold) {
      throw new Error(`Insufficient permits: need ${credential.threshold}, got ${permits}`);
    }

    // In production, threshold decryption via Fhenix CoFHE
    // Mock: return mock decrypted value
    return `decrypted_${id}`;
  }

  /**
   * List all credentials
   */
  async list(): Promise<Array<{ id: string; threshold: number }>> {
    const list: Array<{ id: string; threshold: number }> = [];
    
    for (const [id, cred] of this.credentials) {
      list.push({ id, threshold: cred.threshold });
    }

    return list;
  }

  /**
   * Delete a credential
   */
  async delete(id: string): Promise<void> {
    this.credentials.delete(id);
    
    if (this.config.kv) {
      await this.config.kv.delete(id);
    }
  }

  /**
   * Load credential from KV
   */
  private async loadFromKV(id: string): Promise<Credential | null> {
    if (!this.config.kv) return null;

    const data = await this.config.kv.get(id);
    if (!data) return null;

    return JSON.parse(data) as Credential;
  }

  /**
   * Mock FHE encryption
   * In production, uses Fhenix CoFHE
   */
  private fheEncrypt(data: string): string {
    const hash = data.split('').reduce((acc, c) => {
      return ((acc << 5) - acc + c.charCodeAt(0)) | 0;
    }, 0);
    return `0x${Math.abs(hash).toString(16).padStart(64, '0')}`;
  }
}
