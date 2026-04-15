/**
 * Tests for FHE-Agent Shield Moltbook SDK
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MoltbookFHEClient } from './client.js';
import { FHECredentialManager } from './credentials.js';
import { FHEMemoryManager } from './memory.js';

describe('FHECredentialManager', () => {
  let manager: FHECredentialManager;

  beforeEach(() => {
    manager = new FHECredentialManager({
      network: 'ethereum-sepolia',
      privateKey: '0x' + 'a'.repeat(64),
      rpcUrl: 'http://localhost:8545',
      contracts: {
        agentVault: '0x' + '0'.repeat(40),
        agentMemory: '0x' + '0'.repeat(40),
      },
    });
  });

  it('should store and retrieve credentials', async () => {
    const id = await manager.store('api_key', 'secret123');
    expect(id).toContain('cred_api_key_');
  });

  it('should list credentials', async () => {
    await manager.store('key1', 'value1');
    await manager.store('key2', 'value2');
    
    const list = manager.list();
    expect(list).toHaveLength(2);
  });

  it('should delete credentials', async () => {
    await manager.store('key', 'value');
    await manager.delete('key');
    
    const list = manager.list();
    expect(list).toHaveLength(0);
  });

  it('should require permits for retrieval', async () => {
    await manager.store('key', 'value');
    
    await expect(manager.get('key', 1)).rejects.toThrow('Insufficient permits');
  });
});

describe('FHEMemoryManager', () => {
  let manager: FHEMemoryManager;

  beforeEach(() => {
    manager = new FHEMemoryManager({
      network: 'ethereum-sepolia',
      privateKey: '0x' + 'a'.repeat(64),
      rpcUrl: 'http://localhost:8545',
      contracts: {
        agentVault: '0x' + '0'.repeat(40),
        agentMemory: '0x' + '0'.repeat(40),
      },
    });
  });

  it('should append context', async () => {
    const id = await manager.appendContext('test context', 'agent1');
    expect(id).toContain('mem_');
  });

  it('should get context', async () => {
    await manager.appendContext('context 1', 'agent1');
    await manager.appendContext('context 2', 'agent1');
    
    const context = await manager.getContext('agent1', 10);
    expect(context).toHaveLength(2);
  });

  it('should create and restore snapshots', async () => {
    await manager.appendContext('context', 'agent1');
    
    const snapshotId = await manager.snapshot('agent1');
    expect(snapshotId).toContain('snap_');
    
    await manager.clear();
    await manager.restore(snapshotId);
    
    const context = await manager.getContext('agent1', 10);
    expect(context).toHaveLength(1);
  });
});

describe('MoltbookFHEClient', () => {
  it('should create client with config', () => {
    const client = new MoltbookFHEClient({
      network: 'ethereum-sepolia',
      privateKey: '0x' + 'a'.repeat(64),
      rpcUrl: 'http://localhost:8545',
      contracts: {
        agentVault: '0x' + '0'.repeat(40),
        agentMemory: '0x' + '0'.repeat(40),
      },
    });

    expect(client).toBeDefined();
    expect(client.getCredentials()).toBeDefined();
    expect(client.getMemory()).toBeDefined();
  });
});
