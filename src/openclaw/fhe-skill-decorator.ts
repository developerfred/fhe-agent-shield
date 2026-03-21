import type {
  FHESkillDecoratorConfig,
  ProtectedSkill,
  Permit,
  address,
  bytes32,
} from '../utils/types';
import { getFHEClient } from '../hooks/useFHEClient';

interface BaseSkill {
  id: string;
  name: string;
  execute: (input: any) => Promise<any>;
  validate?: (input: any) => boolean;
}

export class FHESkillDecorator {
  private baseSkill: BaseSkill;
  private config: FHESkillDecoratorConfig;
  private protectedSkill: ProtectedSkill;
  private executionCount: bigint = 0n;

  constructor(baseSkill: BaseSkill, config: FHESkillDecoratorConfig) {
    this.baseSkill = baseSkill;
    this.config = config;
    this.protectedSkill = {
      originalSkillId: baseSkill.id,
      protectedSkillId: '0x' + '00'.repeat(20) as address,
      config,
      executionCount: 0n,
    };
  }

  async execute(input: any, permit?: Permit): Promise<any> {
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

  private async encryptInput(input: string): Promise<bytes32> {
    const client = getFHEClient();
    const encrypted = await client.encryptForStorage(input);
    return encrypted.handle as bytes32;
  }

  private async encryptOutput(output: any): Promise<bytes32> {
    const client = getFHEClient();
    const serialized = JSON.stringify(output);
    const encrypted = await client.encryptForStorage(serialized);
    return encrypted.handle as bytes32;
  }

  private async validateThreshold(permit?: Permit): Promise<void> {
    if (!permit) {
      throw new Error('Threshold validation requires permit');
    }
    const client = getFHEClient();
    const isValid = await client.verifyPermission(permit);
    if (!isValid) {
      throw new Error('Invalid permit for threshold');
    }
  }

  static wrap(skill: BaseSkill, config: FHESkillDecoratorConfig): FHESkillDecorator {
    return new FHESkillDecorator(skill, config);
  }

  static createEmailSkill(config: FHESkillDecoratorConfig): FHESkillDecorator {
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
    return new FHESkillDecorator(emailSkill, config);
  }

  static createBrowserSkill(config: FHESkillDecoratorConfig): FHESkillDecorator {
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
    return new FHESkillDecorator(browserSkill, config);
  }

  static createFileSkill(config: FHESkillDecoratorConfig): FHESkillDecorator {
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
    return new FHESkillDecorator(fileSkill, config);
  }
}

export function wrapWithFHE<T extends BaseSkill>(
  skill: T,
  config: FHESkillDecoratorConfig
): FHESkillDecorator {
  return FHESkillDecorator.wrap(skill, config);
}
