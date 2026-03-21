import { describe, it, expect } from 'vitest';
import { NETWORKS, type NetworkName, type ContractAddresses } from '../../src/types/index.js';
import {
  NetworkNameSchema,
  NetworkConfigSchema,
  ContractAddressesSchema,
  CredentialResultSchema,
  CredentialEntrySchema,
  ActionResultSchema,
  validateNetworkConfig,
  validateContractAddresses,
  validateCredentialEntry,
} from '../../src/types/schemas.js';

describe('TypeScript SDK', () => {
  describe('Network Configuration', () => {
    it('should have all 4 networks configured', () => {
      expect(Object.keys(NETWORKS)).toHaveLength(4);
      expect(NETWORKS['fhenix-helium']).toBeDefined();
      expect(NETWORKS['fhenix-nitrogen']).toBeDefined();
      expect(NETWORKS['arbitrum-sepolia']).toBeDefined();
      expect(NETWORKS['base-sepolia']).toBeDefined();
    });

    it('should have correct chain IDs', () => {
      expect(NETWORKS['fhenix-helium'].chainId).toBe(8008135);
      expect(NETWORKS['fhenix-nitrogen'].chainId).toBe(8008148);
      expect(NETWORKS['arbitrum-sepolia'].chainId).toBe(421614);
      expect(NETWORKS['base-sepolia'].chainId).toBe(84532);
    });

    it('should have correct RPC URLs', () => {
      expect(NETWORKS['fhenix-helium'].rpcUrl).toContain('api.helium.fhenix.zone');
      expect(NETWORKS['fhenix-nitrogen'].rpcUrl).toContain('api.nitrogen.fhenix.zone');
      expect(NETWORKS['arbitrum-sepolia'].rpcUrl).toContain('sepolia-rollup.arbitrum.io');
      expect(NETWORKS['base-sepolia'].rpcUrl).toContain('sepolia.base.org');
    });
  });

  describe('Contract Addresses', () => {
    it('should accept valid contract addresses', () => {
      const contracts: ContractAddresses = {
        agentVault: '0x818eA3862861e82586A4D6E1A78A1a657FC615aa',
        agentMemory: '0x6D31CEaaa0588A62fFb99eCa3Bde0F22Bd7DBb7B',
        skillRegistry: '0xaA19aff541ed6eBF528f919592576baB138370DC',
        actionSealer: '0x76f18Cc5F9DB41905a285866B9277Ac451F3f75B',
      };
      expect(contracts.agentVault).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });
});

describe('Zod Runtime Validation', () => {
  describe('NetworkNameSchema', () => {
    it('should validate valid network names', () => {
      expect(NetworkNameSchema.parse('fhenix-helium')).toBe('fhenix-helium');
      expect(NetworkNameSchema.parse('fhenix-nitrogen')).toBe('fhenix-nitrogen');
      expect(NetworkNameSchema.parse('arbitrum-sepolia')).toBe('arbitrum-sepolia');
      expect(NetworkNameSchema.parse('base-sepolia')).toBe('base-sepolia');
    });

    it('should reject invalid network names', () => {
      expect(() => NetworkNameSchema.parse('ethereum')).toThrow();
      expect(() => NetworkNameSchema.parse('mainnet')).toThrow();
      expect(() => NetworkNameSchema.parse('')).toThrow();
    });
  });

  describe('NetworkConfigSchema', () => {
    it('should validate correct network config', () => {
      const config = {
        name: 'fhenix-helium',
        rpcUrl: 'https://api.helium.fhenix.zone',
        chainId: 8008135,
        explorerUrl: 'https://explorer.helium.fhenix.zone',
      };
      const result = NetworkConfigSchema.parse(config);
      expect(result.name).toBe('fhenix-helium');
      expect(result.chainId).toBe(8008135);
    });

    it('should reject invalid chain ID', () => {
      const config = {
        name: 'fhenix-helium',
        rpcUrl: 'https://api.helium.fhenix.zone',
        chainId: -1,
        explorerUrl: 'https://explorer.helium.fhenix.zone',
      };
      expect(() => NetworkConfigSchema.parse(config)).toThrow();
    });

    it('should reject invalid RPC URL', () => {
      const config = {
        name: 'fhenix-helium',
        rpcUrl: 'not-a-url',
        chainId: 8008135,
        explorerUrl: 'https://explorer.helium.fhenix.zone',
      };
      expect(() => NetworkConfigSchema.parse(config)).toThrow();
    });
  });

  describe('ContractAddressesSchema', () => {
    it('should validate correct contract addresses', () => {
      const addresses = {
        agentVault: '0x818eA3862861e82586A4D6E1A78A1a657FC615aa',
        agentMemory: '0x6D31CEaaa0588A62fFb99eCa3Bde0F22Bd7DBb7B',
        skillRegistry: '0xaA19aff541ed6eBF528f919592576baB138370DC',
        actionSealer: '0x76f18Cc5F9DB41905a285866B9277Ac451F3f75B',
      };
      const result = ContractAddressesSchema.parse(addresses);
      expect(result.agentVault).toBe(addresses.agentVault);
    });

    it('should reject invalid address format', () => {
      const addresses = {
        agentVault: 'invalid',
        agentMemory: '0x6D31CEaaa0588A62fFb99eCa3Bde0F22Bd7DBb7B',
        skillRegistry: '0xaA19aff541ed6eBF528f919592576baB138370DC',
        actionSealer: '0x76f18Cc5F9DB41905a285866B9277Ac451F3f75B',
      };
      expect(() => ContractAddressesSchema.parse(addresses)).toThrow();
    });

    it('should reject non-0x prefix', () => {
      const addresses = {
        agentVault: '1x818eA3862861e82586A4D6E1A78A1a657FC615aa',
        agentMemory: '0x6D31CEaaa0588A62fFb99eCa3Bde0F22Bd7DBb7B',
        skillRegistry: '0xaA19aff541ed6eBF528f919592576baB138370DC',
        actionSealer: '0x76f18Cc5F9DB41905a285866B9277Ac451F3f75B',
      };
      expect(() => ContractAddressesSchema.parse(addresses)).toThrow();
    });
  });

  describe('CredentialResultSchema', () => {
    it('should validate correct credential result', () => {
      const result = {
        handle: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        success: true,
      };
      const parsed = CredentialResultSchema.parse(result);
      expect(parsed.success).toBe(true);
    });

    it('should reject invalid handle (not 64 chars)', () => {
      const result = {
        handle: '0x1234567890abcdef',
        success: true,
      };
      expect(() => CredentialResultSchema.parse(result)).toThrow();
    });
  });

  describe('CredentialEntrySchema', () => {
    it('should validate correct credential entry', () => {
      const entry = {
        key: 'api-key',
        handle: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        threshold: 3,
      };
      const parsed = CredentialEntrySchema.parse(entry);
      expect(parsed.key).toBe('api-key');
      expect(parsed.threshold).toBe(3);
    });

    it('should reject threshold > 255', () => {
      const entry = {
        key: 'api-key',
        handle: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        threshold: 300,
      };
      expect(() => CredentialEntrySchema.parse(entry)).toThrow();
    });
  });

  describe('ActionResultSchema', () => {
    it('should validate correct action result', () => {
      const result = {
        actionId: '0x818eA3862861e82586A4D6E1A78A1a657FC615aa',
        success: true,
      };
      const parsed = ActionResultSchema.parse(result);
      expect(parsed.actionId).toBe(result.actionId);
    });

    it('should reject invalid actionId', () => {
      const result = {
        actionId: 'not-an-address',
        success: true,
      };
      expect(() => ActionResultSchema.parse(result)).toThrow();
    });
  });
});

describe('Validation Helper Functions', () => {
  describe('validateNetworkConfig', () => {
    it('should return validated config', () => {
      const config = {
        name: 'fhenix-helium',
        rpcUrl: 'https://api.helium.fhenix.zone',
        chainId: 8008135,
        explorerUrl: 'https://explorer.helium.fhenix.zone',
      };
      const result = validateNetworkConfig(config);
      expect(result).toEqual(config);
    });
  });

  describe('validateContractAddresses', () => {
    it('should return validated addresses', () => {
      const addresses = {
        agentVault: '0x818eA3862861e82586A4D6E1A78A1a657FC615aa',
        agentMemory: '0x6D31CEaaa0588A62fFb99eCa3Bde0F22Bd7DBb7B',
        skillRegistry: '0xaA19aff541ed6eBF528f919592576baB138370DC',
        actionSealer: '0x76f18Cc5F9DB41905a285866B9277Ac451F3f75B',
      };
      const result = validateContractAddresses(addresses);
      expect(result).toEqual(addresses);
    });
  });

  describe('validateCredentialEntry', () => {
    it('should return validated entry', () => {
      const entry = {
        key: 'api-key',
        handle: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        threshold: 2,
      };
      const result = validateCredentialEntry(entry);
      expect(result.key).toBe('api-key');
    });
  });
});
