/**
 * FHE KV Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FHEKVStore, FHEKVConfig } from './kv-store';

describe('FHEKVStore', () => {
  // Mock KVNamespace
  const createMockKV = () => {
    const store = new Map<string, string>();
    return {
      put: async (key: string, value: string) => { store.set(key, value); },
      get: async (key: string) => store.get(key) || null,
      delete: async (key: string) => { store.delete(key); },
      list: async (opts?: { prefix?: string }) => {
        const keys = Array.from(store.keys())
          .filter(k => !opts?.prefix || k.startsWith(opts.prefix))
          .map(k => ({ name: k }));
        return { keys };
      },
    };
  };

  let store: FHEKVStore;
  let mockKV: ReturnType<typeof createMockKV>;

  beforeEach(() => {
    mockKV = createMockKV();
    const config: FHEKVConfig = {
      network: 'helium',
      kvNamespace: mockKV as unknown as KVNamespace,
      threshold: 2,
      vaultAddress: '0x' + '0'.repeat(40),
    };
    store = new FHEKVStore(config);
  });

  it('should put and get value', async () => {
    await store.put('key1', 'value1');
    const value = await store.get('key1', 2);
    expect(value).toBe('value1');
  });

  it('should require permits for put', async () => {
    await expect(store.put('key', 'value', 1)).rejects.toThrow('Insufficient permits');
  });

  it('should require permits for get', async () => {
    await store.put('key', 'value');
    await expect(store.get('key', 1)).rejects.toThrow('Insufficient permits');
  });

  it('should delete key', async () => {
    await store.put('key', 'value');
    await store.delete('key');
    const value = await store.get('key', 2);
    expect(value).toBeNull();
  });

  it('should list keys', async () => {
    await store.put('key1', 'value1');
    await store.put('key2', 'value2');
    const keys = await store.list();
    expect(keys).toContain('key1');
    expect(keys).toContain('key2');
  });

  it('should cache values', async () => {
    await store.put('key', 'value');
    const value1 = await store.get('key', 2);
    const value2 = await store.get('key', 2);
    expect(value1).toBe(value2);
  });
});
