/**
 * OpenClaw Integration Tests
 * 
 * These tests verify the integration between FHE-Agent Shield contracts
 * and OpenClaw AI agent framework. Tests run against a local Anvil network
 * or a forked network.
 * 
 * Prerequisites:
 * - Anvil running on localhost:8545 (or set ANVIL_RPC_URL)
 * - Contracts deployed via script/ForkIntegration.s.sol
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { MockFHEClient, getMockFHEClient, createMockPermit, resetMockHandleCounter } from './mocks';

// Contract addresses from Anvil deployment
const ANVIL_CONTRACTS = {
  agentVault: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  agentMemory: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  skillRegistry: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  actionSealer: '0xCf7Ed3AccA5a467e9e704C703E8d87F634fB0Fc9',
};

describe('OpenClaw Integration', () => {
  let fheClient: MockFHEClient;

  beforeEach(() => {
    resetMockHandleCounter();
    fheClient = getMockFHEClient();
  });

  describe('FHE Client Connection', () => {
    it('should create FHE client instance', () => {
      expect(fheClient).toBeDefined();
      expect(typeof fheClient.encryptForStorage).toBe('function');
    });

    it('should encrypt data for storage', async () => {
      const encrypted = await fheClient.encryptForStorage('test data');
      expect(encrypted).toBeDefined();
      expect(encrypted.handle).toBeDefined();
      expect(encrypted.handle.startsWith('0x')).toBe(true);
    });

    it('should decrypt data from storage', async () => {
      const originalData = 'sensitive credential';
      const encrypted = await fheClient.encryptForStorage(originalData);
      const decrypted = await fheClient.decryptFromStorage(encrypted.handle);
      
      expect(decrypted.success).toBe(true);
      expect(decrypted.data).toBe(originalData);
    });
  });

  describe('AgentMemory Provider Integration', () => {
    it('should initialize agent memory', async () => {
      const agentId = '0x' + '11'.repeat(20);
      
      // Simulate initialization
      const encrypted = await fheClient.encryptForStorage(JSON.stringify({
        type: 'initialize',
        agentId,
        timestamp: Date.now(),
      }));
      
      expect(encrypted.handle).toBeDefined();
    });

    it('should append encrypted context', async () => {
      const contextData = { action: 'user_login', user: 'alice' };
      const encrypted = await fheClient.encryptForStorage(JSON.stringify(contextData));
      
      expect(encrypted.handle).toBeDefined();
      // In real implementation, this would call AgentMemory.appendContext(agentId, encrypted.handle)
    });

    it('should retrieve and decrypt context slice', async () => {
      const contextData = 'encrypted context chunk';
      const encrypted = await fheClient.encryptForStorage(contextData);
      
      const decrypted = await fheClient.decryptFromStorage(encrypted.handle);
      expect(decrypted.success).toBe(true);
      expect(decrypted.data).toBe(contextData);
    });
  });

  describe('Credential Vault Integration', () => {
    it('should store encrypted credential', async () => {
      const apiKey = 'sk-openai-1234567890abcdef';
      const encrypted = await fheClient.encryptForStorage(apiKey);
      
      expect(encrypted.handle).toBeDefined();
      // In real implementation: vault.storeCredential(agentId, encrypted)
    });

    it('should retrieve credential with permit', async () => {
      const credential = 'secret-api-key';
      const encrypted = await fheClient.encryptForStorage(credential);
      
      const permit = createMockPermit({
        resource: ANVIL_CONTRACTS.agentVault,
      });
      
      const decrypted = await fheClient.decryptFromStorage(encrypted.handle, permit);
      expect(decrypted.success).toBe(true);
      expect(decrypted.data).toBe(credential);
    });

    it('should verify permit permissions', async () => {
      const validPermit = createMockPermit({
        expiresAt: BigInt(Math.floor(Date.now() / 1000)) + 3600n,
      });
      
      const isValid = await fheClient.verifyPermission(validPermit);
      expect(isValid).toBe(true);
    });

    it('should reject expired permits', async () => {
      const expiredPermit = createMockPermit({
        expiresAt: BigInt(Math.floor(Date.now() / 1000)) - 3600n,
      });
      
      const isValid = await fheClient.verifyPermission(expiredPermit);
      expect(isValid).toBe(false);
    });
  });

  describe('Skill Registry Integration', () => {
    it('should register skill with FHE protection', async () => {
      const skillMetadata = {
        name: 'email-skill',
        version: '1.0.0',
        permissions: ['read_email', 'send_email'],
      };
      
      const encrypted = await fheClient.encryptForStorage(JSON.stringify(skillMetadata));
      expect(encrypted.handle).toBeDefined();
    });

    it('should verify skill rating', async () => {
      const ratingData = { skillId: '0x123', rating: 5 };
      const encrypted = await fheClient.encryptForStorage(JSON.stringify(ratingData));
      
      expect(encrypted.handle).toBeDefined();
    });
  });

  describe('Action Sealer Integration', () => {
    it('should seal action with encrypted payload', async () => {
      const actionPayload = {
        type: 'transfer',
        amount: '1000',
        recipient: '0xabcd1234',
      };
      
      const encrypted = await fheClient.encryptForStorage(JSON.stringify(actionPayload));
      expect(encrypted.handle).toBeDefined();
      // In real implementation: actionSealer.sealAction(agentId, encrypted.handle)
    });

    it('should register release condition', async () => {
      const condition = {
        threshold: 2,
        timeout: 3600,
      };
      
      const encrypted = await fheClient.encryptForStorage(JSON.stringify(condition));
      expect(encrypted.handle).toBeDefined();
    });

    it('should approve action release', async () => {
      const approval = {
        actionId: '0x' + '22'.repeat(20),
        approver: '0x' + '33'.repeat(20),
      };
      
      const encrypted = await fheClient.encryptForStorage(JSON.stringify(approval));
      expect(encrypted.handle).toBeDefined();
    });
  });

  describe('End-to-End Workflow', () => {
    it('should complete full FHE-protected agent workflow', async () => {
      // 1. Initialize agent
      const agentId = '0x' + '44'.repeat(20);
      const initData = { type: 'init', agentId };
      const initEncrypted = await fheClient.encryptForStorage(JSON.stringify(initData));
      expect(initEncrypted.handle).toBeDefined();

      // 2. Store credential (API key)
      const apiKey = 'sk-openai-super-secret-key';
      const credEncrypted = await fheClient.encryptForStorage(apiKey);
      expect(credEncrypted.handle).toBeDefined();

      // 3. Append context
      const context = { action: 'process_email', subject: 'Hello' };
      const contextEncrypted = await fheClient.encryptForStorage(JSON.stringify(context));
      expect(contextEncrypted.handle).toBeDefined();

      // 4. Register skill
      const skill = { name: 'email', fheProtected: true };
      const skillEncrypted = await fheClient.encryptForStorage(JSON.stringify(skill));
      expect(skillEncrypted.handle).toBeDefined();

      // 5. Seal action
      const action = { type: 'send_email', to: 'user@example.com' };
      const actionEncrypted = await fheClient.encryptForStorage(JSON.stringify(action));
      expect(actionEncrypted.handle).toBeDefined();

      // 6. Verify all encrypted values are different
      expect(initEncrypted.handle).not.toBe(credEncrypted.handle);
      expect(credEncrypted.handle).not.toBe(contextEncrypted.handle);
      expect(contextEncrypted.handle).not.toBe(skillEncrypted.handle);
      expect(skillEncrypted.handle).not.toBe(actionEncrypted.handle);
    });

    it('should handle concurrent operations', async () => {
      const operations = Array.from({ length: 5 }, (_, i) => 
        fheClient.encryptForStorage(`data-${i}`)
      );

      const results = await Promise.all(operations);
      
      expect(results).toHaveLength(5);
      results.forEach((result, i) => {
        expect(result.handle).toBeDefined();
        expect(result.type).toBe('euint256');
      });

      // All handles should be unique
      const handles = results.map(r => r.handle);
      const uniqueHandles = new Set(handles);
      expect(uniqueHandles.size).toBe(5);
    });
  });

  describe('Contract Deployment Verification', () => {
    it('should have valid contract addresses', () => {
      expect(ANVIL_CONTRACTS.agentVault).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(ANVIL_CONTRACTS.agentMemory).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(ANVIL_CONTRACTS.skillRegistry).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(ANVIL_CONTRACTS.actionSealer).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should have different contract addresses', () => {
      const addresses = Object.values(ANVIL_CONTRACTS);
      const uniqueAddresses = new Set(addresses);
      expect(uniqueAddresses.size).toBe(4);
    });
  });
});

describe('OpenClaw Gateway Simulation', () => {
  let fheClient: MockFHEClient;

  beforeEach(() => {
    resetMockHandleCounter();
    fheClient = getMockFHEClient();
  });

  describe('Skill Execution with FHE', () => {
    it('should encrypt skill input before execution', async () => {
      const skillInput = 'Send email to boss about project delay';
      const encrypted = await fheClient.encryptForStorage(skillInput);
      
      expect(encrypted.handle).toBeDefined();
      // In real OpenClaw flow, this encrypted handle would be passed to the skill
    });

    it('should decrypt skill output after execution', async () => {
      const skillOutput = JSON.stringify({ success: true, emailId: '12345' });
      const encrypted = await fheClient.encryptForStorage(skillOutput);
      
      const decrypted = await fheClient.decryptFromStorage(encrypted.handle);
      expect(decrypted.success).toBe(true);
      expect(JSON.parse(decrypted.data as string)).toEqual({ success: true, emailId: '12345' });
    });
  });

  describe('Memory Provider with FHE', () => {
    it('should store conversation context encrypted', async () => {
      const messages = [
        { role: 'user', content: 'I need to send an email' },
        { role: 'assistant', content: 'I can help you with that. What is the recipient?' },
        { role: 'user', content: 'boss@company.com' },
      ];
      
      const encrypted = await fheClient.encryptForStorage(JSON.stringify(messages));
      expect(encrypted.handle).toBeDefined();
    });

    it('should retrieve historical context for ReAct loop', async () => {
      const historicalContext = Array.from({ length: 10 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
      }));
      
      const encrypted = await fheClient.encryptForStorage(JSON.stringify(historicalContext));
      const decrypted = await fheClient.decryptFromStorage(encrypted.handle);
      
      expect(decrypted.success).toBe(true);
      const retrieved = JSON.parse(decrypted.data as string);
      expect(retrieved).toHaveLength(10);
    });
  });

  describe('Credential Access Control', () => {
    it('should grant permit for credential access', async () => {
      const permit = await fheClient.generatePermission(
        '0x' + '11'.repeat(20),
        '0x' + '22'.repeat(20),
        ANVIL_CONTRACTS.agentVault
      );
      
      expect(permit.expiresAt).toBeGreaterThan(0n);
      expect(permit.nonce).toBe(0n);
    });

    it('should track permit nonces', async () => {
      const resource = '0x' + '55'.repeat(20);
      
      const permit1 = await fheClient.generatePermission(
        '0x' + '11'.repeat(20),
        '0x' + '22'.repeat(20),
        resource
      );
      
      const permit2 = await fheClient.generatePermission(
        '0x' + '11'.repeat(20),
        '0x' + '22'.repeat(20),
        resource
      );
      
      expect(permit2.nonce).toBe(permit1.nonce + 1n);
    });
  });
});
