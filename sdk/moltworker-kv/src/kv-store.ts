/**
 * FHE KV Store for Moltworker
 * 
 * Cloudflare KV with FHE encryption layer.
 */

export interface FHEKVConfig {
  network: 'sepolia' | 'arbitrum-sepolia';
  kvNamespace: KVNamespace;
  threshold: number;
  vaultAddress: string;
}

export interface FHEKVEntry {
  key: string;
  encryptedValue: string;
  timestamp: number;
}

export class FHEKVStore {
  private config: FHEKVConfig;
  private cache: Map<string, string>;

  constructor(config: FHEKVConfig) {
    this.config = config;
    this.cache = new Map();
  }

  /**
   * Put value with FHE encryption
   */
  async put(key: string, value: string, permits: number = 2): Promise<void> {
    if (permits < this.config.threshold) {
      throw new Error(`Insufficient permits: need ${this.config.threshold}, got ${permits}`);
    }

    const encrypted = this.encrypt(value);
    const entry: FHEKVEntry = {
      key: `fhe_${key}`,
      encryptedValue: encrypted,
      timestamp: Date.now(),
    };

    await this.config.kvNamespace.put(
      `fhe_${key}`,
      JSON.stringify(entry)
    );

    this.cache.set(key, encrypted);
  }

  /**
   * Get value with threshold decryption
   */
  async get(key: string, permits: number = 2): Promise<string | null> {
    if (permits < this.config.threshold) {
      throw new Error(`Insufficient permits: need ${this.config.threshold}, got ${permits}`);
    }

    // Check cache first
    const cached = this.cache.get(key);
    if (cached) {
      return this.decrypt(cached);
    }

    const data = await this.config.kvNamespace.get(`fhe_${key}`);
    if (!data) return null;

    const entry: FHEKVEntry = JSON.parse(data);
    return this.decrypt(entry.encryptedValue);
  }

  /**
   * Delete key
   */
  async delete(key: string): Promise<void> {
    await this.config.kvNamespace.delete(`fhe_${key}`);
    this.cache.delete(key);
  }

  /**
   * List all keys
   */
  async list(): Promise<string[]> {
    const keys: string[] = [];
    const list = await this.config.kvNamespace.list({ prefix: 'fhe_' });
    
    for (const key of list.keys) {
      if (key.name.startsWith('fhe_')) {
        keys.push(key.name.slice(4)); // Remove 'fhe_' prefix
      }
    }

    return keys;
  }

  /**
   * Mock FHE encryption
   */
  private encrypt(data: string): string {
    return `fhe_${btoa(data)}`;
  }

  /**
   * Mock FHE decryption
   */
  private decrypt(encrypted: string): string {
    if (encrypted.startsWith('fhe_')) {
      return atob(encrypted.slice(4));
    }
    return encrypted;
  }
}

/**
 * Create FHE KV Store from environment
 */
export function createFHEKVStore(env: { FHE_KV?: KVNamespace }): FHEKVStore {
  return new FHEKVStore({
    network: 'sepolia',
    kvNamespace: env.FHE_KV!,
    threshold: 2,
    vaultAddress: '0x' + '0'.repeat(40),
  });
}
