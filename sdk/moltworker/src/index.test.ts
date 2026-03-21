/**
 * Tests for FHE-Agent Shield Moltworker
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FHECredentialStore } from './credentials.js';
import { FHEProxy } from './fhe-proxy.js';

describe('FHECredentialStore', () => {
  let store: FHECredentialStore;

  beforeEach(() => {
    store = new FHECredentialStore({
      network: 'helium',
      contractAddress: '0x' + '0'.repeat(40),
    });
  });

  it('should store credentials', async () => {
    const id = await store.store('api_key', 'secret123');
    expect(id).toContain('cred_api_key_');
  });

  it('should retrieve credentials', async () => {
    await store.store('key', 'value');
    const id = (await store.list())[0].id;
    
    const retrieved = await store.retrieve(id, 2);
    expect(retrieved).toContain('decrypted_');
  });

  it('should require permits', async () => {
    await store.store('key', 'value');
    const id = (await store.list())[0].id;
    
    await expect(store.retrieve(id, 1)).rejects.toThrow('Insufficient permits');
  });

  it('should list credentials', async () => {
    await store.store('key1', 'value1');
    await store.store('key2', 'value2');
    
    const list = await store.list();
    expect(list).toHaveLength(2);
  });

  it('should delete credentials', async () => {
    await store.store('key', 'value');
    const id = (await store.list())[0].id;
    
    await store.delete(id);
    
    const list = await store.list();
    expect(list).toHaveLength(0);
  });
});

describe('FHEProxy', () => {
  let proxy: FHEProxy;

  beforeEach(() => {
    proxy = new FHEProxy({
      network: 'helium',
      rpcUrl: 'https://api.helium.fhenix.zone',
      contractAddress: '0x' + '0'.repeat(40),
    });
  });

  it('should route encrypt action', async () => {
    const result = await proxy.route('encrypt', { data: 'hello' });
    expect(result.success).toBe(true);
    expect(result.result).toContain('fhe_');
  });

  it('should route decrypt action', async () => {
    const result = await proxy.route('decrypt', { data: 'fhe_aGVsbG8=', permits: 2 });
    expect(result.success).toBe(true);
  });

  it('should route compute action', async () => {
    const result = await proxy.route('compute', { data: 'data' });
    expect(result.success).toBe(true);
    expect(result.result).toContain('computed_');
  });

  it('should reject unknown action', async () => {
    const result = await proxy.route('unknown', { data: 'data' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown action');
  });

  it('should require permits for decrypt', async () => {
    const result = await proxy.route('decrypt', { data: 'data', permits: 1 });
    expect(result.success).toBe(false);
  });
});
