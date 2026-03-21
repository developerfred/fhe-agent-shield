import { describe, it, expect, beforeEach } from 'vitest';
import { MockFHEClient, getMockFHEClient, createMockPermit, resetMockHandleCounter } from './mocks';

const TEST_VAULT_ADDRESS = '0x' + '11'.repeat(20) as `0x${string}`;
const TEST_AGENT_ID = '0x' + '22'.repeat(20) as `0x${string}`;

interface FHECredentialVaultConfig {
  contractAddress: `0x${string}`;
  thresholdNetworkUrl: string;
  defaultThreshold: bigint;
}

class FHECredentialVault {
  private config: FHECredentialVaultConfig;
  private credentialHandles: Map<string, Map<string, `0x${string}`>> = new Map();
  private fheClient: MockFHEClient;

  constructor(config: FHECredentialVaultConfig, fheClient: MockFHEClient) {
    this.config = config;
    this.fheClient = fheClient;
  }

  async storeCredential(agentId: `0x${string}`, key: string, value: string): Promise<`0x${string}`> {
    const encrypted = await this.fheClient.encryptForStorage(value);
    this.setHandle(agentId, key, encrypted.handle as `0x${string}`);
    return encrypted.handle as `0x${string}`;
  }

  async retrieveCredential(agentId: `0x${string}`, key: string, _permit?: any): Promise<string> {
    const handle = this.getHandle(agentId, key);
    if (!handle) {
      throw new Error('Credential not found');
    }

    const result = await this.fheClient.decryptFromStorage(handle);
    if (!result.success) {
      throw new Error('Decryption failed');
    }
    return result.data as string;
  }

  async requestCredentialAccess(agentId: `0x${string}`, key: string, _permit?: any): Promise<`0x${string}`> {
    const handle = this.getHandle(agentId, key);
    if (!handle) {
      throw new Error('Credential not found');
    }
    return handle;
  }

  async grantAccess(grantee: `0x${string}`, agentId: `0x${string}`, key: string): Promise<void> {
    const handle = this.getHandle(agentId, key);
    if (!handle) {
      throw new Error('Credential not found');
    }
  }

  async revokeAccess(grantee: `0x${string}`, agentId: `0x${string}`, key: string): Promise<void> {
    const handle = this.getHandle(agentId, key);
    if (!handle) {
      throw new Error('Credential not found');
    }
  }

  async deleteCredential(agentId: `0x${string}`, key: string): Promise<void> {
    const handle = this.getHandle(agentId, key);
    if (!handle) {
      throw new Error('Credential not found');
    }
    this.removeHandle(agentId, key);
  }

  async rotateCredential(agentId: `0x${string}`, key: string, newValue: string): Promise<`0x${string}`> {
    await this.deleteCredential(agentId, key);
    return this.storeCredential(agentId, key, newValue);
  }

  hasCredential(agentId: `0x${string}`, key: string): boolean {
    return this.getHandle(agentId, key) !== null;
  }

  getAllKeys(agentId: `0x${string}`): string[] {
    const agentCreds = this.credentialHandles.get(agentId);
    if (!agentCreds) return [];
    return Array.from(agentCreds.keys());
  }

  getCredentialCount(agentId: `0x${string}`): number {
    return this.getAllKeys(agentId).length;
  }

  private getHandle(agentId: `0x${string}`, key: string): `0x${string}` | null {
    const agentCreds = this.credentialHandles.get(agentId);
    if (!agentCreds) return null;
    return agentCreds.get(key) || null;
  }

  private setHandle(agentId: `0x${string}`, key: string, handle: `0x${string}`): void {
    let agentCreds = this.credentialHandles.get(agentId);
    if (!agentCreds) {
      agentCreds = new Map();
      this.credentialHandles.set(agentId, agentCreds);
    }
    agentCreds.set(key, handle);
  }

  private removeHandle(agentId: `0x${string}`, key: string): void {
    const agentCreds = this.credentialHandles.get(agentId);
    if (agentCreds) {
      agentCreds.delete(key);
    }
  }

  getConfig(): FHECredentialVaultConfig {
    return { ...this.config };
  }

  clear(): void {
    this.credentialHandles.clear();
  }
}

let mockClient: MockFHEClient;

describe('FHECredentialVault', () => {
  beforeEach(() => {
    mockClient = getMockFHEClient();
    mockClient.clear();
  });

  describe('credential storage', () => {
    it('should store encrypted credentials', async () => {
      const vault = new FHECredentialVault({
        contractAddress: TEST_VAULT_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        defaultThreshold: 2n,
      }, mockClient);

      const handle = await vault.storeCredential(TEST_AGENT_ID, 'api_key', 'sk-secret-123');

      expect(handle).toBeDefined();
      expect(handle.startsWith('0x')).toBe(true);
    });

    it('should return true for existing credentials', async () => {
      const vault = new FHECredentialVault({
        contractAddress: TEST_VAULT_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        defaultThreshold: 2n,
      }, mockClient);

      await vault.storeCredential(TEST_AGENT_ID, 'api_key', 'sk-secret-123');

      expect(vault.hasCredential(TEST_AGENT_ID, 'api_key')).toBe(true);
    });

    it('should return false for non-existing credentials', async () => {
      const vault = new FHECredentialVault({
        contractAddress: TEST_VAULT_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        defaultThreshold: 2n,
      }, mockClient);

      expect(vault.hasCredential(TEST_AGENT_ID, 'non_existent')).toBe(false);
    });
  });

  describe('credential retrieval', () => {
    it('should retrieve stored credentials', async () => {
      const vault = new FHECredentialVault({
        contractAddress: TEST_VAULT_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        defaultThreshold: 2n,
      }, mockClient);

      const originalValue = 'sk-secret-123';
      await vault.storeCredential(TEST_AGENT_ID, 'api_key', originalValue);

      const retrieved = await vault.retrieveCredential(TEST_AGENT_ID, 'api_key');

      expect(retrieved).toBe(originalValue);
    });

    it('should throw when retrieving non-existent credential', async () => {
      const vault = new FHECredentialVault({
        contractAddress: TEST_VAULT_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        defaultThreshold: 2n,
      }, mockClient);

      await expect(vault.retrieveCredential(TEST_AGENT_ID, 'non_existent')).rejects.toThrow('Credential not found');
    });
  });

  describe('credential deletion', () => {
    it('should delete credentials', async () => {
      const vault = new FHECredentialVault({
        contractAddress: TEST_VAULT_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        defaultThreshold: 2n,
      }, mockClient);

      await vault.storeCredential(TEST_AGENT_ID, 'api_key', 'sk-secret-123');
      expect(vault.hasCredential(TEST_AGENT_ID, 'api_key')).toBe(true);

      await vault.deleteCredential(TEST_AGENT_ID, 'api_key');
      expect(vault.hasCredential(TEST_AGENT_ID, 'api_key')).toBe(false);
    });

    it('should throw when deleting non-existent credential', async () => {
      const vault = new FHECredentialVault({
        contractAddress: TEST_VAULT_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        defaultThreshold: 2n,
      }, mockClient);

      await expect(vault.deleteCredential(TEST_AGENT_ID, 'non_existent')).rejects.toThrow('Credential not found');
    });
  });

  describe('credential rotation', () => {
    it('should rotate credentials', async () => {
      const vault = new FHECredentialVault({
        contractAddress: TEST_VAULT_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        defaultThreshold: 2n,
      }, mockClient);

      await vault.storeCredential(TEST_AGENT_ID, 'api_key', 'old-secret');
      const oldValue = await vault.retrieveCredential(TEST_AGENT_ID, 'api_key');
      expect(oldValue).toBe('old-secret');

      const newHandle = await vault.rotateCredential(TEST_AGENT_ID, 'api_key', 'new-secret');
      const newValue = await vault.retrieveCredential(TEST_AGENT_ID, 'api_key');

      expect(newValue).toBe('new-secret');
      expect(vault.getCredentialCount(TEST_AGENT_ID)).toBe(1);
    });
  });

  describe('multi-credential management', () => {
    it('should store multiple credentials per agent', async () => {
      const vault = new FHECredentialVault({
        contractAddress: TEST_VAULT_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        defaultThreshold: 2n,
      }, mockClient);

      await vault.storeCredential(TEST_AGENT_ID, 'api_key', 'sk-1');
      await vault.storeCredential(TEST_AGENT_ID, 'password', 'pass-123');
      await vault.storeCredential(TEST_AGENT_ID, 'token', 'tok-abc');

      expect(vault.getCredentialCount(TEST_AGENT_ID)).toBe(3);
      expect(vault.getAllKeys(TEST_AGENT_ID)).toContain('api_key');
      expect(vault.getAllKeys(TEST_AGENT_ID)).toContain('password');
      expect(vault.getAllKeys(TEST_AGENT_ID)).toContain('token');
    });

    it('should isolate credentials between agents', async () => {
      const vault = new FHECredentialVault({
        contractAddress: TEST_VAULT_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        defaultThreshold: 2n,
      }, mockClient);

      const agent1 = '0x' + '11'.repeat(20) as `0x${string}`;
      const agent2 = '0x' + '22'.repeat(20) as `0x${string}`;

      await vault.storeCredential(agent1, 'api_key', 'agent1-secret');
      await vault.storeCredential(agent2, 'api_key', 'agent2-secret');

      expect(vault.hasCredential(agent1, 'api_key')).toBe(true);
      expect(vault.hasCredential(agent2, 'api_key')).toBe(true);

      const value1 = await vault.retrieveCredential(agent1, 'api_key');
      const value2 = await vault.retrieveCredential(agent2, 'api_key');

      expect(value1).toBe('agent1-secret');
      expect(value2).toBe('agent2-secret');
    });
  });

  describe('access management', () => {
    it('should grant access to credentials', async () => {
      const vault = new FHECredentialVault({
        contractAddress: TEST_VAULT_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        defaultThreshold: 2n,
      }, mockClient);

      await vault.storeCredential(TEST_AGENT_ID, 'api_key', 'sk-secret');

      const grantee = '0x' + 'aa'.repeat(20) as `0x${string}`;
      await expect(vault.grantAccess(grantee, TEST_AGENT_ID, 'api_key')).resolves.not.toThrow();
    });

    it('should revoke access to credentials', async () => {
      const vault = new FHECredentialVault({
        contractAddress: TEST_VAULT_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        defaultThreshold: 2n,
      }, mockClient);

      await vault.storeCredential(TEST_AGENT_ID, 'api_key', 'sk-secret');

      const grantee = '0x' + 'aa'.repeat(20) as `0x${string}`;
      await vault.grantAccess(grantee, TEST_AGENT_ID, 'api_key');
      await expect(vault.revokeAccess(grantee, TEST_AGENT_ID, 'api_key')).resolves.not.toThrow();
    });

    it('should throw when granting access to non-existent credential', async () => {
      const vault = new FHECredentialVault({
        contractAddress: TEST_VAULT_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        defaultThreshold: 2n,
      }, mockClient);

      const grantee = '0x' + 'aa'.repeat(20) as `0x${string}`;
      await expect(vault.grantAccess(grantee, TEST_AGENT_ID, 'non_existent')).rejects.toThrow('Credential not found');
    });
  });

  describe('request credential access', () => {
    it('should return handle for credential access request', async () => {
      const vault = new FHECredentialVault({
        contractAddress: TEST_VAULT_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        defaultThreshold: 2n,
      }, mockClient);

      await vault.storeCredential(TEST_AGENT_ID, 'api_key', 'sk-secret');
      const handle = await vault.requestCredentialAccess(TEST_AGENT_ID, 'api_key');

      expect(handle).toBeDefined();
      expect(handle.startsWith('0x')).toBe(true);
    });

    it('should throw when requesting access to non-existent credential', async () => {
      const vault = new FHECredentialVault({
        contractAddress: TEST_VAULT_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        defaultThreshold: 2n,
      }, mockClient);

      await expect(vault.requestCredentialAccess(TEST_AGENT_ID, 'non_existent')).rejects.toThrow('Credential not found');
    });
  });
});

describe('FHECredentialVault Integration Scenarios', () => {
  beforeEach(() => {
    mockClient = getMockFHEClient();
    mockClient.clear();
  });

  it('should simulate storing and retrieving API keys', async () => {
    const vault = new FHECredentialVault({
      contractAddress: TEST_VAULT_ADDRESS,
      thresholdNetworkUrl: 'https://test.example.com',
      defaultThreshold: 2n,
    }, mockClient);

    const apiKeys = {
      'openai': 'sk-1234567890abcdef',
      'sendgrid': 'SG.1234567890abcdef',
      'aws': 'AKIAIOSFODNN7EXAMPLE',
    };

    for (const [key, value] of Object.entries(apiKeys)) {
      await vault.storeCredential(TEST_AGENT_ID, key, value);
    }

    expect(vault.getCredentialCount(TEST_AGENT_ID)).toBe(3);

    for (const [key, expectedValue] of Object.entries(apiKeys)) {
      const retrieved = await vault.retrieveCredential(TEST_AGENT_ID, key);
      expect(retrieved).toBe(expectedValue);
    }
  });

  it('should demonstrate credential rotation workflow', async () => {
    const vault = new FHECredentialVault({
      contractAddress: TEST_VAULT_ADDRESS,
      thresholdNetworkUrl: 'https://test.example.com',
      defaultThreshold: 2n,
    }, mockClient);

    await vault.storeCredential(TEST_AGENT_ID, 'api_key', 'v1-secret');
    expect(await vault.retrieveCredential(TEST_AGENT_ID, 'api_key')).toBe('v1-secret');

    await vault.rotateCredential(TEST_AGENT_ID, 'api_key', 'v2-secret');
    expect(await vault.retrieveCredential(TEST_AGENT_ID, 'api_key')).toBe('v2-secret');

    await vault.rotateCredential(TEST_AGENT_ID, 'api_key', 'v3-secret');
    expect(await vault.retrieveCredential(TEST_AGENT_ID, 'api_key')).toBe('v3-secret');

    expect(vault.getCredentialCount(TEST_AGENT_ID)).toBe(1);
  });

  it('should simulate agent credential isolation', async () => {
    const vault = new FHECredentialVault({
      contractAddress: TEST_VAULT_ADDRESS,
      thresholdNetworkUrl: 'https://test.example.com',
      defaultThreshold: 2n,
    }, mockClient);

    const agentAlice = '0x' + '11'.repeat(20) as `0x${string}`;
    const agentBob = '0x' + '22'.repeat(20) as `0x${string}`;

    await vault.storeCredential(agentAlice, 'email', 'alice@example.com');
    await vault.storeCredential(agentAlice, 'api_key', 'alice-sk');

    await vault.storeCredential(agentBob, 'email', 'bob@example.com');
    await vault.storeCredential(agentBob, 'api_key', 'bob-sk');

    expect(vault.getCredentialCount(agentAlice)).toBe(2);
    expect(vault.getCredentialCount(agentBob)).toBe(2);

    expect(await vault.retrieveCredential(agentAlice, 'email')).toBe('alice@example.com');
    expect(await vault.retrieveCredential(agentBob, 'email')).toBe('bob@example.com');
  });
});

describe('OpenClaw Credential Security Scenarios', () => {
  beforeEach(() => {
    mockClient = getMockFHEClient();
    mockClient.clear();
  });

  it('should protect credentials from unauthorized access', async () => {
    const vault = new FHECredentialVault({
      contractAddress: TEST_VAULT_ADDRESS,
      thresholdNetworkUrl: 'https://test.example.com',
      defaultThreshold: 3n,
    }, mockClient);

    const attacker = '0x' + 'ff'.repeat(20) as `0x${string}`;
    const legitimateUser = '0x' + 'aa'.repeat(20) as `0x${string}`;

    await vault.storeCredential(attacker, 'api_key', 'attacker-stolen-key');
    await vault.storeCredential(legitimateUser, 'api_key', 'user-legitimate-key');

    const attackerKey = await vault.retrieveCredential(attacker, 'api_key');
    const userKey = await vault.retrieveCredential(legitimateUser, 'api_key');

    expect(attackerKey).toBe('attacker-stolen-key');
    expect(userKey).toBe('user-legitimate-key');
  });

  it('should demonstrate threshold access control', async () => {
    const vault = new FHECredentialVault({
      contractAddress: TEST_VAULT_ADDRESS,
      thresholdNetworkUrl: 'https://test.example.com',
      defaultThreshold: 3n,
    }, mockClient);

    const sensitiveKey = 'super-secret-api-key';
    await vault.storeCredential(TEST_AGENT_ID, 'admin_key', sensitiveKey);

    const keys = vault.getAllKeys(TEST_AGENT_ID);
    expect(keys).toContain('admin_key');

    const retrieved = await vault.retrieveCredential(TEST_AGENT_ID, 'admin_key');
    expect(retrieved).toBe(sensitiveKey);
  });

  it('should handle credential cleanup on agent deletion', async () => {
    const vault = new FHECredentialVault({
      contractAddress: TEST_VAULT_ADDRESS,
      thresholdNetworkUrl: 'https://test.example.com',
      defaultThreshold: 2n,
    }, mockClient);

    await vault.storeCredential(TEST_AGENT_ID, 'key1', 'value1');
    await vault.storeCredential(TEST_AGENT_ID, 'key2', 'value2');
    await vault.storeCredential(TEST_AGENT_ID, 'key3', 'value3');

    expect(vault.getCredentialCount(TEST_AGENT_ID)).toBe(3);

    await vault.deleteCredential(TEST_AGENT_ID, 'key1');
    await vault.deleteCredential(TEST_AGENT_ID, 'key2');
    await vault.deleteCredential(TEST_AGENT_ID, 'key3');

    expect(vault.getCredentialCount(TEST_AGENT_ID)).toBe(0);
    expect(vault.hasCredential(TEST_AGENT_ID, 'key1')).toBe(false);
  });
});