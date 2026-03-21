import { z } from 'zod';

export const NetworkNameSchema = z.enum([
  'fhenix-helium',
  'fhenix-nitrogen', 
  'arbitrum-sepolia',
  'base-sepolia',
]);

export const NetworkConfigSchema = z.object({
  name: NetworkNameSchema,
  rpcUrl: z.string().url(),
  chainId: z.number().int().positive(),
  explorerUrl: z.string().url(),
});

export const ContractAddressesSchema = z.object({
  agentVault: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  agentMemory: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  skillRegistry: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  actionSealer: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export const CredentialResultSchema = z.object({
  handle: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  success: z.boolean(),
});

export const CredentialEntrySchema = z.object({
  key: z.string().min(1),
  handle: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  threshold: z.number().int().min(0).max(255),
});

export const ActionResultSchema = z.object({
  actionId: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  success: z.boolean(),
});

export const ActionStatusSchema = z.object({
  status: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  statusText: z.enum(['Sealed', 'Approved', 'Released', 'Cancelled']),
});

export const ContextResultSchema = z.object({
  length: z.bigint(),
  success: z.boolean(),
});

export const FHEAgentShieldConfigSchema = z.object({
  network: z.union([NetworkNameSchema, NetworkConfigSchema]),
  privateKey: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  contracts: ContractAddressesSchema,
});

export type NetworkName = z.infer<typeof NetworkNameSchema>;
export type NetworkConfig = z.infer<typeof NetworkConfigSchema>;
export type ContractAddresses = z.infer<typeof ContractAddressesSchema>;
export type CredentialResult = z.infer<typeof CredentialResultSchema>;
export type CredentialEntry = z.infer<typeof CredentialEntrySchema>;
export type ActionResult = z.infer<typeof ActionResultSchema>;
export type ActionStatus = z.infer<typeof ActionStatusSchema>;
export type ContextResult = z.infer<typeof ContextResultSchema>;
export type FHEAgentShieldConfig = z.infer<typeof FHEAgentShieldConfigSchema>;

export function validateNetworkConfig(config: unknown): NetworkConfig {
  return NetworkConfigSchema.parse(config);
}

export function validateContractAddresses(addresses: unknown): ContractAddresses {
  return ContractAddressesSchema.parse(addresses);
}

export function validateCredentialEntry(entry: unknown): CredentialEntry {
  return CredentialEntrySchema.parse(entry);
}

export function validateActionResult(result: unknown): ActionResult {
  return ActionResultSchema.parse(result);
}
