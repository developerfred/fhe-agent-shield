/**
 * FHE-Agent Shield - Type Definitions
 * Privacy layer for AI agents using Fully Homomorphic Encryption
 */

// =============================================================================
// Core FHE Types
// =============================================================================

/**
 * Encrypted value as handled by Fhenix CoFHE
 */
export interface EncryptedValue {
  /** Ciphertext handle */
  handle: string;
  /** Type of encrypted value */
  type: 'euint256' | 'euint128' | 'euint64' | 'euint32' | 'euint16' | 'euint8' | 'ebool';
}

/**
 * Input parameter for encrypted operations
 */
export interface InEuint256 {
  handle: string;
}

export interface InEuint128 {
  handle: string;
}

export interface InEuint64 {
  handle: string;
}

// =============================================================================
// Contract Types
// =============================================================================

/**
 * Credential stored in AgentVault
 */
export interface Credential {
  handle: bytes32;
  owner: address;
  exists: boolean;
}

/**
 * Agent registered in AgentMemory
 */
export interface Agent {
  id: address;
  owner: address;
  contextLength: bigint;
  snapshotCounter: bigint;
  isInitialized: boolean;
}

/**
 * Skill registered in SkillRegistry
 */
export interface Skill {
  id: address;
  publisher: address;
  metadataHash: bytes32;
  codeHash: bytes32;
  isVerified: boolean;
  ratingCount: bigint;
  totalRating: bigint;
}

/**
 * Sealed action in ActionSealer
 */
export interface SealedAction {
  id: address;
  agentId: address;
  owner: address;
  encryptedPayload: string;
  status: ActionStatus;
  createdAt: bigint;
  conditionId: address | null;
}

/**
 * Action status enum
 */
export type ActionStatus = 'Sealed' | 'Approved' | 'Released' | 'Cancelled' | 'Expired';

/**
 * Release condition for sealed actions
 */
export interface ReleaseCondition {
  id: address;
  actionId: address;
  threshold: bigint;
  timeout: bigint;
  approvalCount: bigint;
  approvals: address[];
  isMet: boolean;
}

// =============================================================================
// Permission Types
// =============================================================================

/**
 * EIP-712 permission structure
 */
export interface Permit {
  /** Owner of the permit */
  signer: address;
  /** User approving the permit */
  user: address;
  /** Resource being accessed */
  resource: address;
  /** Expiration timestamp */
  expiresAt: bigint;
  /** Nonce for replay protection */
  nonce: bigint;
  /** V of signature */
  v: number;
  /** R of signature */
  r: string;
  /** S of signature */
  s: string;
}

/**
 * Permission level for credential access
 */
export type PermissionLevel = 'none' | 'read' | 'write' | 'admin';

// =============================================================================
// Hook Return Types
// =============================================================================

/**
 * State for encrypted agent
 */
export interface EncryptedAgentState {
  agentId: string;
  isInitialized: boolean;
  contextHandle: string | null;
  credentialCount: number;
  lastActivity: Date | null;
}

/**
 * Result of encrypted context operation
 */
export interface EncryptedContextResult {
  newLength: bigint;
  transactionHash: string;
}

/**
 * Snapshot information
 */
export interface Snapshot {
  id: address;
  agentId: address;
  contextLength: bigint;
  createdAt: bigint;
}

// =============================================================================
// Skill Decorator Types
// =============================================================================

/**
 * Configuration for FHE skill decorator
 */
export interface FHESkillDecoratorConfig {
  /** Encrypt skill inputs */
  inputEncryption: boolean;
  /** Encrypt skill outputs */
  outputEncryption: boolean;
  /** Credential vault address */
  credentialVault?: address;
  /** Required permissions to use skill */
  requirePermits?: string[];
  /** Additional encryption flags */
  flags?: {
    sealInput?: boolean;
    sealOutput?: boolean;
    requireThreshold?: boolean;
    thresholdValue?: bigint;
  };
}

/**
 * Protected skill wrapper
 */
export interface ProtectedSkill {
  /** Original skill ID */
  originalSkillId: string;
  /** Protected skill address */
  protectedSkillId: address;
  /** Configuration used */
  config: FHESkillDecoratorConfig;
  /** Execution counter */
  executionCount: bigint;
}

// =============================================================================
// OpenClaw Integration Types
// =============================================================================

/**
 * Memory provider configuration
 */
export interface FHEAgentMemoryProviderConfig {
  /** AgentMemory contract address */
  contractAddress: address;
  /** Threshold network RPC URL */
  thresholdNetworkUrl: string;
  /** Minimum approvals for decryption */
  minApprovals: bigint;
}

/**
 * Credential vault configuration
 */
export interface FHECredentialVaultConfig {
  /** AgentVault contract address */
  contractAddress: address;
  /** Threshold network RPC URL */
  thresholdNetworkUrl: string;
  /** Default threshold for credential access */
  defaultThreshold: bigint;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Transaction result with events
 */
export interface TransactionResult<T = any> {
  /** Transaction hash */
  hash: string;
  /** Block number */
  blockNumber: bigint;
  /** Decoded events */
  events: T[];
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// ABI Types (for viem/wagmi compatibility)
// =============================================================================

export type address = `0x${string}`;
export type bytes32 = `0x${string}`;
export type bytes = `0x${string}`;
export type uint256 = bigint;
export type uint128 = bigint;
export type uint64 = bigint;
export type uint32 = number;
export type uint16 = number;
export type uint8 = number;
export type bool = boolean;
