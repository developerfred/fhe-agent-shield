export { FHEAgentShield, type FHEAgentShieldConfig } from './client.js';
export { AgentVault } from './contracts/AgentVault.js';
export { AgentMemory } from './contracts/AgentMemory.js';
export { ActionSealer, ActionStatusText, type ActionStatus } from './contracts/ActionSealer.js';
export { SkillRegistry } from './contracts/SkillRegistry.js';
export { 
  NETWORKS, 
  type NetworkName, 
  type NetworkConfig, 
  type ContractAddresses,
  type CredentialResult,
  type CredentialEntry,
  type ActionResult,
  type ContextResult,
} from './types/index.js';
export {
  NetworkNameSchema,
  NetworkConfigSchema,
  ContractAddressesSchema,
  CredentialResultSchema,
  CredentialEntrySchema,
  ActionResultSchema,
  ActionStatusSchema,
  ContextResultSchema,
  FHEAgentShieldConfigSchema,
  validateNetworkConfig,
  validateContractAddresses,
  validateCredentialEntry,
  validateActionResult,
} from './types/schemas.js';
