import { describe, it, expect, beforeEach } from 'vitest';
import { MockFHEClient, getMockFHEClient, createMockPermit, resetMockHandleCounter } from './mocks';

const TEST_VAULT_ADDRESS = '0x' + '11'.repeat(20) as `0x${string}`;
const TEST_AGENT_ID = '0x' + '22'.repeat(20) as `0x${string}`;

interface BaseSkill {
  id: string;
  name: string;
  execute: (input: any) => Promise<any>;
}

interface FHESkillDecoratorConfig {
  inputEncryption: boolean;
  outputEncryption: boolean;
  credentialVault?: `0x${string}`;
  requirePermits?: string[];
  flags?: {
    requireThreshold?: boolean;
    thresholdValue?: bigint;
  };
}

interface ProtectedSkill {
  originalSkillId: string;
  protectedSkillId: `0x${string}`;
  config: FHESkillDecoratorConfig;
  executionCount: bigint;
}

class FHESkillDecorator {
  private baseSkill: BaseSkill;
  private config: FHESkillDecoratorConfig;
  private protectedSkill: ProtectedSkill;
  private executionCount: bigint = 0n;
  private fheClient: MockFHEClient;

  constructor(baseSkill: BaseSkill, config: FHESkillDecoratorConfig, fheClient: MockFHEClient) {
    this.baseSkill = baseSkill;
    this.config = config;
    this.fheClient = fheClient;
    this.protectedSkill = {
      originalSkillId: baseSkill.id,
      protectedSkillId: '0x' + '00'.repeat(20) as `0x${string}`,
      config,
      executionCount: 0n,
    };
  }

  async execute(input: any, permit?: any): Promise<any> {
    if (this.config.requirePermits && !permit) {
      throw new Error('Permit required for this skill');
    }

    let processedInput = input;

    if (this.config.inputEncryption && typeof input === 'string') {
      processedInput = await this.encryptInput(input);
    }

    if (this.config.flags?.requireThreshold && this.config.flags.thresholdValue) {
      await this.validateThreshold(permit);
    }

    let result = await this.baseSkill.execute(processedInput);

    if (this.config.outputEncryption) {
      result = await this.encryptOutput(result);
    }

    this.executionCount++;
    this.protectedSkill.executionCount = this.executionCount;

    return result;
  }

  getProtectedSkill(): ProtectedSkill {
    return { ...this.protectedSkill, executionCount: this.executionCount };
  }

  getConfig(): FHESkillDecoratorConfig {
    return { ...this.config };
  }

  private async encryptInput(input: string): Promise<string> {
    const encrypted = await this.fheClient.encryptForStorage(input);
    return encrypted.handle;
  }

  private async encryptOutput(output: any): Promise<string> {
    const serialized = JSON.stringify(output);
    const encrypted = await this.fheClient.encryptForStorage(serialized);
    return encrypted.handle;
  }

  private async validateThreshold(permit?: any): Promise<void> {
    if (!permit) {
      throw new Error('Threshold validation requires permit');
    }
    const isValid = await this.fheClient.verifyPermission(permit);
    if (!isValid) {
      throw new Error('Invalid permit for threshold');
    }
  }

  static wrap(skill: BaseSkill, config: FHESkillDecoratorConfig, fheClient: MockFHEClient): FHESkillDecorator {
    return new FHESkillDecorator(skill, config, fheClient);
  }

  static createEmailSkill(config: FHESkillDecoratorConfig, fheClient: MockFHEClient): FHESkillDecorator {
    const emailSkill: BaseSkill = {
      id: 'fhe-email-skill',
      name: 'EmailSkill',
      async execute(input: any) {
        return {
          sent: true,
          to: input.to,
          subject: input.subject,
          timestamp: Date.now(),
        };
      },
    };
    return new FHESkillDecorator(emailSkill, config, fheClient);
  }

  static createBrowserSkill(config: FHESkillDecoratorConfig, fheClient: MockFHEClient): FHESkillDecorator {
    const browserSkill: BaseSkill = {
      id: 'fhe-browser-skill',
      name: 'BrowserSkill',
      async execute(input: any) {
        return {
          url: input.url,
          action: input.action,
          result: 'completed',
        };
      },
    };
    return new FHESkillDecorator(browserSkill, config, fheClient);
  }

  static createFileSkill(config: FHESkillDecoratorConfig, fheClient: MockFHEClient): FHESkillDecorator {
    const fileSkill: BaseSkill = {
      id: 'fhe-file-skill',
      name: 'FileSkill',
      async execute(input: any) {
        return {
          path: input.path,
          operation: input.operation,
          success: true,
        };
      },
    };
    return new FHESkillDecorator(fileSkill, config, fheClient);
  }
}

let mockClient: MockFHEClient;

describe('FHESkillDecorator', () => {
  beforeEach(() => {
    mockClient = getMockFHEClient();
    mockClient.clear();
  });

  describe('basic functionality', () => {
    it('should wrap a skill with FHE protection', () => {
      const baseSkill: BaseSkill = {
        id: 'test-skill',
        name: 'TestSkill',
        execute: async (input: any) => ({ result: input }),
      };

      const decorator = FHESkillDecorator.wrap(baseSkill, {
        inputEncryption: false,
        outputEncryption: false,
      }, mockClient);

      expect(decorator).toBeDefined();
      expect(decorator.getProtectedSkill().originalSkillId).toBe('test-skill');
    });

    it('should execute skill without encryption when disabled', async () => {
      const baseSkill: BaseSkill = {
        id: 'test-skill',
        name: 'TestSkill',
        execute: async (input: any) => ({ result: input }),
      };

      const decorator = FHESkillDecorator.wrap(baseSkill, {
        inputEncryption: false,
        outputEncryption: false,
      }, mockClient);

      const result = await decorator.execute('test input');

      expect(result.result).toBe('test input');
    });

    it('should track execution count', async () => {
      const baseSkill: BaseSkill = {
        id: 'test-skill',
        name: 'TestSkill',
        execute: async () => ({ ok: true }),
      };

      const decorator = FHESkillDecorator.wrap(baseSkill, {
        inputEncryption: false,
        outputEncryption: false,
      }, mockClient);

      expect(decorator.getProtectedSkill().executionCount).toBe(0n);

      await decorator.execute({});
      await decorator.execute({});
      await decorator.execute({});

      expect(decorator.getProtectedSkill().executionCount).toBe(3n);
    });
  });

  describe('input encryption', () => {
    it('should encrypt string inputs when enabled', async () => {
      const baseSkill: BaseSkill = {
        id: 'test-skill',
        name: 'TestSkill',
        execute: async (input: any) => ({ received: typeof input, isHandle: typeof input === 'string' && input.startsWith('0x') }),
      };

      const decorator = FHESkillDecorator.wrap(baseSkill, {
        inputEncryption: true,
        outputEncryption: false,
      }, mockClient);

      const result = await decorator.execute('sensitive data');

      expect(result.received).toBe('string');
      expect(result.isHandle).toBe(true);
    });

    it('should not encrypt non-string inputs', async () => {
      const baseSkill: BaseSkill = {
        id: 'test-skill',
        name: 'TestSkill',
        execute: async (input: any) => ({ received: typeof input }),
      };

      const decorator = FHESkillDecorator.wrap(baseSkill, {
        inputEncryption: true,
        outputEncryption: false,
      }, mockClient);

      const result = await decorator.execute({ key: 'value' });

      expect(result.received).toBe('object');
    });
  });

  describe('output encryption', () => {
    it('should encrypt outputs when enabled', async () => {
      const baseSkill: BaseSkill = {
        id: 'test-skill',
        name: 'TestSkill',
        execute: async () => ({ important: 'data' }),
      };

      const decorator = FHESkillDecorator.wrap(baseSkill, {
        inputEncryption: false,
        outputEncryption: true,
      }, mockClient);

      const result = await decorator.execute({});

      expect(typeof result).toBe('string');
      expect(result.startsWith('0x')).toBe(true);
    });

    it('should allow decryption of encrypted output', async () => {
      const baseSkill: BaseSkill = {
        id: 'test-skill',
        name: 'TestSkill',
        execute: async () => ({ sensitive: 'information' }),
      };

      const decorator = FHESkillDecorator.wrap(baseSkill, {
        inputEncryption: false,
        outputEncryption: true,
      }, mockClient);

      const encryptedResult = await decorator.execute({});
      const decrypted = await mockClient.decryptFromStorage(encryptedResult as string);

      expect(decrypted.success).toBe(true);
      expect(JSON.parse(decrypted.data as string)).toEqual({ sensitive: 'information' });
    });
  });

  describe('permit requirements', () => {
    it('should throw when permits required but not provided', async () => {
      const baseSkill: BaseSkill = {
        id: 'test-skill',
        name: 'TestSkill',
        execute: async () => ({ ok: true }),
      };

      const decorator = FHESkillDecorator.wrap(baseSkill, {
        inputEncryption: false,
        outputEncryption: false,
        requirePermits: ['read', 'write'],
      }, mockClient);

      await expect(decorator.execute({})).rejects.toThrow('Permit required for this skill');
    });

    it('should execute when permit provided', async () => {
      const baseSkill: BaseSkill = {
        id: 'test-skill',
        name: 'TestSkill',
        execute: async () => ({ ok: true }),
      };

      const decorator = FHESkillDecorator.wrap(baseSkill, {
        inputEncryption: false,
        outputEncryption: false,
        requirePermits: ['read'],
      }, mockClient);

      const permit = createMockPermit();
      const result = await decorator.execute({}, permit);

      expect(result.ok).toBe(true);
    });
  });

  describe('threshold validation', () => {
    it('should throw when threshold required but no permit', async () => {
      const baseSkill: BaseSkill = {
        id: 'test-skill',
        name: 'TestSkill',
        execute: async () => ({ ok: true }),
      };

      const decorator = FHESkillDecorator.wrap(baseSkill, {
        inputEncryption: false,
        outputEncryption: false,
        flags: {
          requireThreshold: true,
          thresholdValue: 3n,
        },
      }, mockClient);

      await expect(decorator.execute({})).rejects.toThrow('Threshold validation requires permit');
    });

    it('should validate permit for threshold when enabled', async () => {
      const baseSkill: BaseSkill = {
        id: 'test-skill',
        name: 'TestSkill',
        execute: async () => ({ ok: true }),
      };

      const decorator = FHESkillDecorator.wrap(baseSkill, {
        inputEncryption: false,
        outputEncryption: false,
        flags: {
          requireThreshold: true,
          thresholdValue: 3n,
        },
      }, mockClient);

      const expiredPermit = createMockPermit({
        expiresAt: BigInt(Math.floor(Date.now() / 1000)) - 3600n,
      });

      await expect(decorator.execute({}, expiredPermit)).rejects.toThrow('Invalid permit for threshold');
    });

    it('should execute when valid permit provided for threshold', async () => {
      const baseSkill: BaseSkill = {
        id: 'test-skill',
        name: 'TestSkill',
        execute: async () => ({ ok: true }),
      };

      const decorator = FHESkillDecorator.wrap(baseSkill, {
        inputEncryption: false,
        outputEncryption: false,
        flags: {
          requireThreshold: true,
          thresholdValue: 3n,
        },
      }, mockClient);

      const permit = createMockPermit();
      const result = await decorator.execute({}, permit);

      expect(result.ok).toBe(true);
    });
  });

  describe('static factory methods', () => {
    it('should create email skill with FHE protection', () => {
      const emailSkill = FHESkillDecorator.createEmailSkill({
        inputEncryption: true,
        outputEncryption: true,
      }, mockClient);

      expect(emailSkill.getProtectedSkill().originalSkillId).toBe('fhe-email-skill');
      expect(emailSkill.getConfig().inputEncryption).toBe(true);
    });

    it('should create browser skill with FHE protection', () => {
      const browserSkill = FHESkillDecorator.createBrowserSkill({
        inputEncryption: true,
        outputEncryption: false,
      }, mockClient);

      expect(browserSkill.getProtectedSkill().originalSkillId).toBe('fhe-browser-skill');
    });

    it('should create file skill with FHE protection', () => {
      const fileSkill = FHESkillDecorator.createFileSkill({
        inputEncryption: false,
        outputEncryption: true,
      }, mockClient);

      expect(fileSkill.getProtectedSkill().originalSkillId).toBe('fhe-file-skill');
    });

    it('should execute email skill correctly', async () => {
      const emailSkill = FHESkillDecorator.createEmailSkill({
        inputEncryption: true,
        outputEncryption: false,
      }, mockClient);

      const result = await emailSkill.execute({
        to: 'test@example.com',
        subject: 'Hello',
      });

      expect(result.sent).toBe(true);
      expect(result.to).toBeDefined();
    });

    it('should execute browser skill correctly', async () => {
      const browserSkill = FHESkillDecorator.createBrowserSkill({
        inputEncryption: true,
        outputEncryption: false,
      }, mockClient);

      const result = await browserSkill.execute({
        url: 'https://example.com',
        action: 'navigate',
      });

      expect(result.result).toBe('completed');
      expect(result.url).toBeDefined();
    });

    it('should execute file skill correctly', async () => {
      const fileSkill = FHESkillDecorator.createFileSkill({
        inputEncryption: true,
        outputEncryption: false,
      }, mockClient);

      const result = await fileSkill.execute({
        path: '/protected/documents/contract.pdf',
        operation: 'read',
      });

      expect(result.success).toBe(true);
      expect(result.path).toBeDefined();
    });
  });

  describe('config preservation', () => {
    it('should preserve original config', () => {
      const config: FHESkillDecoratorConfig = {
        inputEncryption: true,
        outputEncryption: true,
        credentialVault: TEST_VAULT_ADDRESS,
        requirePermits: ['admin', 'write'],
        flags: {
          requireThreshold: true,
          thresholdValue: 5n,
        },
      };

      const baseSkill: BaseSkill = {
        id: 'test-skill',
        name: 'TestSkill',
        execute: async () => ({}),
      };

      const decorator = FHESkillDecorator.wrap(baseSkill, config, mockClient);
      const retrievedConfig = decorator.getConfig();

      expect(retrievedConfig.inputEncryption).toBe(true);
      expect(retrievedConfig.outputEncryption).toBe(true);
      expect(retrievedConfig.credentialVault).toBe(TEST_VAULT_ADDRESS);
      expect(retrievedConfig.requirePermits).toEqual(['admin', 'write']);
      expect(retrievedConfig.flags?.requireThreshold).toBe(true);
      expect(retrievedConfig.flags?.thresholdValue).toBe(5n);
    });
  });
});

describe('FHESkillDecorator Integration Scenarios', () => {
  beforeEach(() => {
    mockClient = getMockFHEClient();
    mockClient.clear();
  });

  it('should simulate credential-protected email skill', async () => {
    const emailSkill = FHESkillDecorator.createEmailSkill({
      inputEncryption: true,
      outputEncryption: false,
      credentialVault: TEST_VAULT_ADDRESS,
      requirePermits: ['send_email'],
    }, mockClient);

    const permit = createMockPermit({ resource: TEST_VAULT_ADDRESS });
    const result = await emailSkill.execute({
      to: 'recipient@example.com',
      subject: 'Secure Message',
      body: 'Confidential content',
    }, permit);

    expect(result.sent).toBe(true);
    expect(result.to).toBeDefined();
  });

  it('should simulate encrypted file access skill', async () => {
    const fileSkill = FHESkillDecorator.createFileSkill({
      inputEncryption: true,
      outputEncryption: false,
      credentialVault: TEST_VAULT_ADDRESS,
      requirePermits: ['read_files'],
    }, mockClient);

    const permit = createMockPermit({ resource: TEST_VAULT_ADDRESS });
    const result = await fileSkill.execute({
      path: '/protected/documents/contract.pdf',
      operation: 'read',
    }, permit);

    expect(result.success).toBe(true);
    expect(result.path).toBeDefined();
  });

  it('should track multiple skill executions independently', async () => {
    const emailSkill = FHESkillDecorator.createEmailSkill({
      inputEncryption: false,
      outputEncryption: false,
    }, mockClient);

    const browserSkill = FHESkillDecorator.createBrowserSkill({
      inputEncryption: false,
      outputEncryption: false,
    }, mockClient);

    await emailSkill.execute({ to: 'a@test.com', subject: 'A' });
    await emailSkill.execute({ to: 'b@test.com', subject: 'B' });
    await browserSkill.execute({ url: 'https://a.com', action: 'navigate' });
    await browserSkill.execute({ url: 'https://b.com', action: 'navigate' });
    await browserSkill.execute({ url: 'https://c.com', action: 'navigate' });

    expect(emailSkill.getProtectedSkill().executionCount).toBe(2n);
    expect(browserSkill.getProtectedSkill().executionCount).toBe(3n);
  });
});