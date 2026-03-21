import { describe, it, expect, beforeEach } from 'vitest';
import {
  MockFHEClient,
  getMockFHEClient,
  createMockPermit,
  resetMockHandleCounter,
} from './mocks';

let mockClient: MockFHEClient;

const TEST_VAULT_ADDRESS = '0x' + '11'.repeat(20);
const TEST_MEMORY_ADDRESS = '0x' + '22'.repeat(20);
const TEST_AGENT_ID = '0x' + '33'.repeat(20);
const TEST_SKILL_ID = '0x' + '44'.repeat(20);

describe('MockFHEClient', () => {
  beforeEach(() => {
    mockClient = getMockFHEClient();
    mockClient.clear();
  });

  describe('encryptForStorage', () => {
    it('should encrypt string data and return handle', async () => {
      const data = 'test-api-key-123';
      const result = await mockClient.encryptForStorage(data);

      expect(result.handle).toBeDefined();
      expect(result.handle.startsWith('0x')).toBe(true);
      expect(result.type).toBe('euint256');
    });

    it('should store encrypted data for later decryption', async () => {
      const data = 'sensitive-credential';
      const encrypted = await mockClient.encryptForStorage(data);

      const decrypted = await mockClient.decryptFromStorage(encrypted.handle);

      expect(decrypted.success).toBe(true);
      expect(decrypted.data).toBe(data);
    });

    it('should generate unique handles for different data', async () => {
      const encrypted1 = await mockClient.encryptForStorage('unique_data_1');
      const encrypted2 = await mockClient.encryptForStorage('unique_data_2');

      expect(encrypted1.handle).not.toBe(encrypted2.handle);
    });
  });

  describe('encryptValue', () => {
    it('should encrypt bigint values', async () => {
      const value = 123456789n;
      const result = await mockClient.encryptValue(value);

      expect(result.handle).toBeDefined();
      expect(result.type).toBe('euint256');
    });

    it('should handle large values', async () => {
      const value = BigInt('123456789012345678901234567890');
      const encrypted = await mockClient.encryptValue(value);

      const decrypted = await mockClient.requestDecryption(encrypted.handle);

      expect(decrypted.success).toBe(true);
      expect(decrypted.data).toBe(value);
    });
  });

  describe('verifyPermission', () => {
    it('should return true for valid non-expired permit', async () => {
      const permit = createMockPermit({
        expiresAt: BigInt(Math.floor(Date.now() / 1000)) + 3600n,
      });

      const isValid = await mockClient.verifyPermission(permit);

      expect(isValid).toBe(true);
    });

    it('should return false for expired permit', async () => {
      const permit = createMockPermit({
        expiresAt: BigInt(Math.floor(Date.now() / 1000)) - 3600n,
      });

      const isValid = await mockClient.verifyPermission(permit);

      expect(isValid).toBe(false);
    });
  });

  describe('generatePermission', () => {
    it('should generate permission with expiry and nonce', async () => {
      const signer = '0x' + '11'.repeat(20);
      const user = '0x' + '22'.repeat(20);
      const resource = '0x' + '33'.repeat(20);

      const result = await mockClient.generatePermission(signer, user, resource);

      expect(result.expiresAt).toBeGreaterThan(BigInt(Math.floor(Date.now() / 1000)));
      expect(result.nonce).toBe(0n);
    });

    it('should increment nonce on repeated calls', async () => {
      const resource = '0x' + '33'.repeat(20);

      const result1 = await mockClient.generatePermission(
        '0x' + '11'.repeat(20),
        '0x' + '22'.repeat(20),
        resource
      );
      const result2 = await mockClient.generatePermission(
        '0x' + '11'.repeat(20),
        '0x' + '22'.repeat(20),
        resource
      );

      expect(result2.nonce).toBe(result1.nonce + 1n);
    });
  });

  describe('decryptFromStorage', () => {
    it('should return error for non-existent handle', async () => {
      const result = await mockClient.decryptFromStorage('0x' + 'ff'.repeat(32));

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
});

describe('createMockPermit', () => {
  it('should create permit with defaults', () => {
    const permit = createMockPermit();

    expect(permit.signer).toMatch(/^0x[a-f0-9]{40}$/);
    expect(permit.user).toMatch(/^0x[a-f0-9]{40}$/);
    expect(permit.resource).toMatch(/^0x[a-f0-9]{40}$/);
    expect(permit.expiresAt).toBeGreaterThan(0n);
    expect(permit.nonce).toBe(0n);
    expect(permit.v).toBe(27);
  });

  it('should override defaults with provided values', () => {
    const customSigner = '0x' + 'aa'.repeat(20);
    const permit = createMockPermit({
      signer: customSigner,
      nonce: 5n,
    });

    expect(permit.signer).toBe(customSigner);
    expect(permit.nonce).toBe(5n);
  });
});

describe('FHESkillDecorator Integration Patterns', () => {
  beforeEach(() => {
    mockClient = getMockFHEClient();
    mockClient.clear();
  });

  it('should demonstrate input encryption flow', async () => {
    const inputData = 'user-provided sensitive data';
    const encrypted = await mockClient.encryptForStorage(inputData);

    expect(encrypted.handle).toBeDefined();

    const decrypted = await mockClient.decryptFromStorage(encrypted.handle);
    expect(decrypted.success).toBe(true);
    expect(decrypted.data).toBe(inputData);
  });

  it('should demonstrate credential storage flow', async () => {
    const apiKey = 'sk-1234567890abcdef';
    const encryptedApiKey = await mockClient.encryptForStorage(apiKey);

    const retrieved = await mockClient.decryptFromStorage(encryptedApiKey.handle);
    expect(retrieved.success).toBe(true);
    expect(retrieved.data).toBe(apiKey);
  });

  it('should demonstrate permission-based access control', async () => {
    const data = 'confidential-document';
    const encrypted = await mockClient.encryptForStorage(data);

    const permit = createMockPermit({
      resource: TEST_VAULT_ADDRESS,
    });

    const isAuthorized = await mockClient.verifyPermission(permit);
    expect(isAuthorized).toBe(true);

    const retrieved = await mockClient.decryptFromStorage(encrypted.handle, permit);
    expect(retrieved.success).toBe(true);
    expect(retrieved.data).toBe(data);
  });

  it('should demonstrate sealed action pattern', async () => {
    const sealedPayload = JSON.stringify({
      to: '0x' + '99'.repeat(20),
      value: '1000',
      operation: 'transfer',
    });

    const encrypted = await mockClient.encryptForStorage(sealedPayload);

    const permit = createMockPermit({
      resource: TEST_VAULT_ADDRESS,
    });

    const isAuthorized = await mockClient.verifyPermission(permit);
    expect(isAuthorized).toBe(true);

    const released = await mockClient.decryptFromStorage(encrypted.handle, permit);
    expect(released.success).toBe(true);
    expect(JSON.parse(released.data as string)).toEqual(JSON.parse(sealedPayload));
  });
});

describe('OpenClaw Skill Integration Patterns', () => {
  beforeEach(() => {
    mockClient = getMockFHEClient();
    mockClient.clear();
  });

  it('should demonstrate email skill with encrypted inputs', async () => {
    const emailData = JSON.stringify({
      to: 'recipient@example.com',
      subject: 'Encrypted Message',
      body: 'This is a secret message',
    });

    const encryptedEmail = await mockClient.encryptForStorage(emailData);
    expect(encryptedEmail.handle).toBeDefined();

    const decrypted = await mockClient.decryptFromStorage(encryptedEmail.handle);
    expect(decrypted.success).toBe(true);
    expect(JSON.parse(decrypted.data as string)).toEqual(JSON.parse(emailData));
  });

  it('should demonstrate browser skill with encrypted session', async () => {
    const sessionData = JSON.stringify({
      sessionId: 'session-123',
      cookies: ['auth=abc123', 'session=xyz789'],
      url: 'https://secure-bank.com',
    });

    const encryptedSession = await mockClient.encryptForStorage(sessionData);

    const decrypted = await mockClient.decryptFromStorage(encryptedSession.handle);
    expect(decrypted.success).toBe(true);
    expect(JSON.parse(decrypted.data as string)).toEqual(JSON.parse(sessionData));
  });

  it('should demonstrate file skill with encrypted content', async () => {
    const fileData = JSON.stringify({
      path: '/secure/documents/contract.pdf',
      operation: 'read',
      permissions: ['owner-only'],
    });

    const encryptedFile = await mockClient.encryptForStorage(fileData);

    const decrypted = await mockClient.decryptFromStorage(encryptedFile.handle);
    expect(decrypted.success).toBe(true);
    expect(JSON.parse(decrypted.data as string)).toEqual(JSON.parse(fileData));
  });

  it('should demonstrate multi-skill credential access', async () => {
    const emailCredential = 'smtp-password-123';
    const browserCredential = 'browser-session-key-456';

    const encryptedEmail = await mockClient.encryptForStorage(emailCredential);
    const encryptedBrowser = await mockClient.encryptForStorage(browserCredential);

    const emailPermit = createMockPermit({ resource: TEST_VAULT_ADDRESS });
    const browserPermit = createMockPermit({ resource: TEST_VAULT_ADDRESS });

    const emailAccess = await mockClient.decryptFromStorage(encryptedEmail.handle, emailPermit);
    const browserAccess = await mockClient.decryptFromStorage(encryptedBrowser.handle, browserPermit);

    expect(emailAccess.success).toBe(true);
    expect(emailAccess.data).toBe(emailCredential);
    expect(browserAccess.success).toBe(true);
    expect(browserAccess.data).toBe(browserCredential);
  });
});

describe('Error Handling', () => {
  beforeEach(() => {
    mockClient = getMockFHEClient();
    mockClient.clear();
  });

  it('should handle decryption of non-existent data', async () => {
    const fakeHandle = '0x' + '00'.repeat(32);
    const result = await mockClient.decryptFromStorage(fakeHandle);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle empty string encryption', async () => {
    const encrypted = await mockClient.encryptForStorage('');
    const decrypted = await mockClient.decryptFromStorage(encrypted.handle);

    expect(decrypted.success).toBe(true);
    expect(decrypted.data).toBe('');
  });

  it('should handle unicode data', async () => {
    const unicodeData = '你好世界 🌍 مرحبا';
    const encrypted = await mockClient.encryptForStorage(unicodeData);
    const decrypted = await mockClient.decryptFromStorage(encrypted.handle);

    expect(decrypted.success).toBe(true);
    expect(decrypted.data).toBe(unicodeData);
  });

  it('should handle large data encryption', async () => {
    const largeData = 'x'.repeat(100000);
    const encrypted = await mockClient.encryptForStorage(largeData);
    const decrypted = await mockClient.decryptFromStorage(encrypted.handle);

    expect(decrypted.success).toBe(true);
    expect(decrypted.data).toBe(largeData);
  });
});