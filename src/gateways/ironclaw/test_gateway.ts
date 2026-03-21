/**
 * Tests for FHE Gateway for IronClaw/ZeroClaw
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FHEVaultProxy, FHEMemoryProxy, FHESkillWrapper } from './plugin';

describe('FHEVaultProxy', () => {
  let vault: FHEVaultProxy;

  beforeEach(() => {
    vault = new FHEVaultProxy({
      network: 'helium',
      vaultAddress: '0x' + '0'.repeat(40),
      memoryAddress: '0x' + '0'.repeat(40),
      threshold: 2,
      rpcUrl: 'http://localhost:8545',
    });
  });

  it('should store and retrieve credentials', async () => {
    const id = await vault.store('api_key', 'secret123');
    expect(id).toContain('fhe_api_key_');

    const value = await vault.retrieve(id, 2);
    expect(value).toContain('decrypted_');
  });

  it('should require permits for retrieval', async () => {
    const id = await vault.store('key', 'value');

    await expect(vault.retrieve(id, 1)).rejects.toThrow('Insufficient permits');
  });

  it('should list credentials', async () => {
    await vault.store('key1', 'value1');
    await vault.store('key2', 'value2');

    const list = vault.list();
    expect(list).toHaveLength(2);
  });
});

describe('FHEMemoryProxy', () => {
  let memory: FHEMemoryProxy;

  beforeEach(() => {
    memory = new FHEMemoryProxy({
      network: 'helium',
      vaultAddress: '0x' + '0'.repeat(40),
      memoryAddress: '0x' + '0'.repeat(40),
      threshold: 2,
      rpcUrl: 'http://localhost:8545',
    });
  });

  it('should append memory', async () => {
    const id = await memory.append('agent-1', 'context');
    expect(id).toContain('mem_agent-1_');
  });

  it('should get memory', async () => {
    await memory.append('agent-1', 'context1');
    await memory.append('agent-1', 'context2');

    const contexts = await memory.get('agent-1', 10);
    expect(contexts).toHaveLength(2);
  });

  it('should create snapshot', async () => {
    const snapshotId = await memory.snapshot('agent-1');
    expect(snapshotId).toContain('snap_agent-1_');
  });
});

describe('FHESkillWrapper', () => {
  it('should wrap skill with FHE', async () => {
    const vault = new FHEVaultProxy({
      network: 'helium',
      vaultAddress: '0x' + '0'.repeat(40),
      memoryAddress: '0x' + '0'.repeat(40),
      threshold: 2,
      rpcUrl: 'http://localhost:8545',
    });

    const memory = new FHEMemoryProxy({
      network: 'helium',
      vaultAddress: '0x' + '0'.repeat(40),
      memoryAddress: '0x' + '0'.repeat(40),
      threshold: 2,
      rpcUrl: 'http://localhost:8545',
    });

    const wrapper = new FHESkillWrapper(vault, memory);

    const originalSkill = {
      name: 'test_skill',
      description: 'A test skill',
      parameters: ['input'],
      execute: async (input: unknown) => `result_${input}`,
    };

    const wrapped = wrapper.wrapSkill(originalSkill);

    const result = await wrapped.execute('test_input');
    expect(result).toContain('result_');
  });
});
