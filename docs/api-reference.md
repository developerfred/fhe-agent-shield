# FHE-Agent Shield — API Reference

> **Complete API documentation for smart contracts, React hooks, and OpenClaw integration**

---

## Table of Contents

1. [Smart Contracts](#smart-contracts)
2. [React Hooks](#react-hooks)
3. [OpenClaw Integration](#openclaw-integration)
4. [Type Definitions](#type-definitions)
5. [Events](#events)
6. [Errors](#errors)

---

## Smart Contracts

### AgentVault.sol

Encrypted credential storage with threshold-based access control.

#### `storeCredential`

Stores an encrypted credential and returns a handle.

```solidity
function storeCredential(
    address agentId,
    inEuint256 calldata encryptedValue
) external returns (bytes32)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `agentId` | address | The agent ID to store the credential for |
| `encryptedValue` | inEuint256 | Encrypted credential value (ciphertext handle) |

**Returns:** `bytes32` — Handle to the stored credential

**Example:**
```solidity
// Store encrypted API key
bytes32 handle = agentVault.storeCredential(
    agentId,
    encryptedApiKey
);
```

---

#### `retrieveCredential`

Retrieves an encrypted credential using a valid permit.

```solidity
function retrieveCredential(
    bytes32 handle,
    Permission calldata permit
) external view returns (bytes memory)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `handle` | bytes32 | Handle of the credential to retrieve |
| `permit` | Permission | EIP-712 permit for access authorization |

**Returns:** `bytes` — Encrypted credential value

**Requires:** Valid EIP-712 permit from credential owner

---

#### `grantRetrievePermission`

Grants permission for an address to retrieve a credential.

```solidity
function grantRetrievePermission(
    address grantee,
    bytes32 handle
) external
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `grantee` | address | Address to grant permission to |
| `handle` | bytes32 | Handle of the credential |

---

#### `revokePermission`

Revokes permission for an address to retrieve a credential.

```solidity
function revokePermission(
    address grantee,
    bytes32 handle
) external
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `grantee` | address | Address to revoke permission from |
| `handle` | bytes32 | Handle of the credential |

---

#### `updateThreshold`

Updates the threshold required for credential access.

```solidity
function updateThreshold(
    address agentId,
    uint8 newThreshold
) external
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `agentId` | address | Agent ID to update threshold for |
| `newThreshold` | uint8 | New threshold value (1-255) |

---

#### `credentialExists`

Checks if a credential exists.

```solidity
function credentialExists(
    bytes32 handle
) external view returns (bool)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `handle` | bytes32 | Handle to check |

**Returns:** `bool` — True if credential exists

---

#### `getCredentialOwner`

Gets the owner of a credential.

```solidity
function getCredentialOwner(
    bytes32 handle
) external view returns (address)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `handle` | bytes32 | Handle of the credential |

**Returns:** `address` — Owner of the credential

---

### AgentMemory.sol

Encrypted agent context with snapshot/restore capabilities.

#### `initializeAgent`

Initializes a new agent and returns the agent ID.

```solidity
function initializeAgent() external returns (address)
```

**Returns:** `address` — Newly created agent ID

**Example:**
```solidity
address agentId = agentMemory.initializeAgent();
```

---

#### `appendContext`

Appends encrypted context data to an agent's memory.

```solidity
function appendContext(
    address agentId,
    inEuint256 calldata encryptedChunk
) external returns (uint256)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `agentId` | address | Agent to append context to |
| `encryptedChunk` | inEuint256 | Encrypted context chunk |

**Returns:** `uint256` — New context length

---

#### `getContextSlice`

Retrieves a slice of encrypted context chunks.

```solidity
function getContextSlice(
    address agentId,
    uint256 offset,
    uint256 length
) external view returns (bytes[] memory)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `agentId` | address | Agent to get context from |
| `offset` | uint256 | Starting index |
| `length` | uint256 | Number of chunks to retrieve |

**Returns:** `bytes[]` — Array of encrypted context chunks

---

#### `snapshotContext`

Creates a snapshot of the current agent context.

```solidity
function snapshotContext(
    address agentId
) external returns (bytes32)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `agentId` | address | Agent to snapshot |

**Returns:** `bytes32` — Snapshot ID

---

#### `restoreFromSnapshot`

Restores agent context from a snapshot.

```solidity
function restoreFromSnapshot(
    address agentId,
    bytes32 snapshotId
) external
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `agentId` | address | Agent to restore |
| `snapshotId` | bytes32 | Snapshot to restore from |

---

#### `getContextLength`

Gets the current context length for an agent.

```solidity
function getContextLength(
    address agentId
) external view returns (uint256)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `agentId` | address | Agent to query |

**Returns:** `uint256` — Current context length

---

#### `getAgentOwner`

Gets the owner of an agent.

```solidity
function getAgentOwner(
    address agentId
) external view returns (address)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `agentId` | address | Agent to query |

**Returns:** `address` — Owner of the agent

---

### SkillRegistry.sol

FHE-verified marketplace for AI agent skills.

#### `registerSkill`

Registers a new skill in the marketplace.

```solidity
function registerSkill(
    bytes32 metadataHash,
    bytes32 codeHash
) external returns (address)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `metadataHash` | bytes32 | Hash of encrypted skill metadata |
| `codeHash` | bytes32 | Hash of skill code |

**Returns:** `address` — Registered skill ID

---

#### `verifySkill`

Marks a skill as verified.

```solidity
function verifySkill(
    address skillId
) external
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `skillId` | address | Skill to verify |

---

#### `rateSkill`

Rates a skill with an encrypted rating.

```solidity
function rateSkill(
    address skillId,
    inEuint256 calldata encryptedRating
) external
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `skillId` | address | Skill to rate |
| `encryptedRating` | inEuint256 | Encrypted rating value (1-5) |

---

#### `executeSkill`

Executes a skill with encrypted input.

```solidity
function executeSkill(
    address skillId,
    bytes calldata input
) external returns (bytes memory)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `skillId` | address | Skill to execute |
| `input` | bytes | Encoded input data |

**Returns:** `bytes` — Encoded output data

---

#### `getSkill`

Gets skill information.

```solidity
function getSkill(
    address skillId
) external view returns (
    address publisher,
    bool isVerified,
    uint256 ratingCount
)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `skillId` | address | Skill to query |

**Returns:**
| Name | Type | Description |
|------|------|-------------|
| `publisher` | address | Skill publisher |
| `isVerified` | bool | Whether skill is verified |
| `ratingCount` | uint256 | Number of ratings |

---

### ActionSealer.sol

Sealed actions with threshold release conditions.

#### `sealAction`

Seals an action for future release.

```solidity
function sealAction(
    address agentId,
    bytes calldata encryptedPayload
) external returns (address)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `agentId` | address | Agent ID creating the action |
| `encryptedPayload` | bytes | Encrypted action payload |

**Returns:** `address` — Action ID

---

#### `registerReleaseCondition`

Registers a release condition for an action.

```solidity
function registerReleaseCondition(
    address actionId,
    uint8 threshold,
    uint256 timeout
) external
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `actionId` | address | Action to register condition for |
| `threshold` | uint8 | Number of approvals required |
| `timeout` | uint256 | Timeout in seconds |

---

#### `approveRelease`

Approves an action release.

```solidity
function approveRelease(
    address actionId
) external
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `actionId` | address | Action to approve |

---

#### `releaseAction`

Releases and executes a sealed action.

```solidity
function releaseAction(
    bytes calldata permit
) external returns (bytes memory)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `permit` | bytes | Release permit |

**Returns:** `bytes` — Decrypted action payload

---

#### `cancelAction`

Cancels a sealed action.

```solidity
function cancelAction(
    address actionId
) external
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `actionId` | address | Action to cancel |

---

#### `getActionStatus`

Gets the current status of an action.

```solidity
function getActionStatus(
    address actionId
) external view returns (ActionStatus)
```

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| `actionId` | address | Action to query |

**Returns:** `ActionStatus` — Current status (Sealed, Approved, Released, Cancelled, Expired)

---

## React Hooks

### useFHEClient

Core FHE encryption/decryption client.

```typescript
import { useFHEClient } from './hooks/useFHEClient';

function MyComponent() {
  const { 
    client,           // FHE client instance
    encrypt,          // Encrypt data for storage
    decrypt,          // Decrypt data with permit
    verifyPermission, // Verify an EIP-712 permit
    isInitialized     // Client initialization status
  } = useFHEClient();
  
  // ...
}
```

#### Methods

##### `encrypt(data: string): Promise<EncryptedValue>`

Encrypts string data for storage.

```typescript
const encrypted = await encrypt("sensitive data");
// { handle: "0x...", type: "euint256" }
```

##### `decrypt(handle: string, permit?: Permit): Promise<string>`

Decrypts encrypted data with a valid permit.

```typescript
const decrypted = await decrypt(handle, permit);
```

##### `verifyPermission(permit: Permit): Promise<boolean>`

Verifies if an EIP-712 permit is valid.

```typescript
const isValid = await verifyPermission(permit);
```

---

### useEncryptedAgent

Encrypted agent state management.

```typescript
import { useEncryptedAgent } from './hooks/useEncryptedAgent';

function AgentComponent({ agentId }: { agentId: string }) {
  const {
    state,              // EncryptedAgentState
    initialize,         // Initialize agent
    appendContext,      // Append encrypted context
    getDecryptedContext, // Get and decrypt context
    snapshot,           // Create context snapshot
    restore,            // Restore from snapshot
    isInitialized       // Agent initialized status
  } = useEncryptedAgent(agentId);
  
  // ...
}
```

#### State

```typescript
interface EncryptedAgentState {
  agentId: string;
  isInitialized: boolean;
  contextHandle: string | null;
  contextLength: bigint;
  snapshotCount: bigint;
  lastActivity: Date | null;
}
```

#### Methods

##### `initialize(): Promise<void>`

Initializes the agent on-chain.

```typescript
await initialize();
```

##### `appendContext(data: string): Promise<bigint>`

Appends encrypted context data.

```typescript
const newLength = await appendContext("agent context data");
```

##### `getDecryptedContext(offset: number, length: number, permit: Permit): Promise<string[]>`

Retrieves and decrypts context slice.

```typescript
const context = await getDecryptedContext(0, 10, permit);
```

##### `snapshot(): Promise<string>`

Creates a context snapshot.

```typescript
const snapshotId = await snapshot();
```

##### `restore(snapshotId: string): Promise<void>`

Restores context from snapshot.

```typescript
await restore(snapshotId);
```

---

### useAgentVault

Credential storage and retrieval.

```typescript
import { useAgentVault } from './hooks/useAgentVault';

function VaultComponent({ agentId }: { agentId: string }) {
  const {
    storeCredential,     // Store encrypted credential
    retrieveCredential,  // Retrieve and decrypt credential
    grantAccess,         // Grant access to another address
    revokeAccess,        // Revoke access
    hasCredential,       // Check if credential exists
    getCredentialCount   // Get number of credentials
  } = useAgentVault(agentId);
  
  // ...
}
```

#### Methods

##### `storeCredential(key: string, value: string): Promise<string>`

Stores a credential (encrypted automatically).

```typescript
const handle = await storeCredential("OPENAI_API_KEY", "sk-...");
```

##### `retrieveCredential(key: string, permit: Permit): Promise<string>`

Retrieves and decrypts a credential.

```typescript
const apiKey = await retrieveCredential("OPENAI_API_KEY", permit);
```

##### `grantAccess(key: string, grantee: address): Promise<void>`

Grants credential access to another address.

```typescript
await grantAccess("OPENAI_API_KEY", "0x123...");
```

##### `revokeAccess(key: string, grantee: address): Promise<void>`

Revokes credential access.

```typescript
await revokeAccess("OPENAI_API_KEY", "0x123...");
```

---

### useSealedAction

Sealed action lifecycle management.

```typescript
import { useSealedAction } from './hooks/useSealedAction';

function SealedActionComponent() {
  const {
    sealAction,          // Create sealed action
    registerCondition,   // Register release condition
    approve,             // Approve release
    release,             // Release and execute
    cancel,              // Cancel action
    getStatus,           // Get action status
    actions              // List of user's actions
  } = useSealedAction();
  
  // ...
}
```

#### Methods

##### `sealAction(agentId: address, payload: any): Promise<SealedAction>`

Creates a new sealed action.

```typescript
const action = await sealAction(agentId, { to: "0x...", value: 100 });
```

##### `registerCondition(actionId: address, threshold: number, timeout: number): Promise<void>`

Registers a release condition.

```typescript
await registerCondition(actionId, 3, 3600); // 3 approvals, 1 hour timeout
```

##### `approve(actionId: address): Promise<void>`

Approves action release.

```typescript
await approve(actionId);
```

##### `release(actionId: address, permit: Permit): Promise<any>`

Releases and executes sealed action.

```typescript
const result = await release(actionId, permit);
```

##### `cancel(actionId: address): Promise<void>`

Cancels a sealed action.

```typescript
await cancel(actionId);
```

##### `getStatus(actionId: address): Promise<ActionStatus>`

Gets current action status.

```typescript
const status = await getStatus(actionId);
// "Sealed" | "Approved" | "Released" | "Cancelled" | "Expired"
```

---

## OpenClaw Integration

### FHESkillDecorator

Wraps any OpenClaw skill with FHE protection.

```typescript
import { FHESkillDecorator } from './openclaw/fhe-skill-decorator';

const secureSkill = FHESkillDecorator.wrap(baseSkill, {
  inputEncryption: true,
  outputEncryption: true,
  credentialVault: vaultAddress,
  requirePermits: ['read_email', 'send_email'],
  flags: {
    requireThreshold: true,
    thresholdValue: 3n,
  },
});
```

#### Constructor

```typescript
new FHESkillDecorator(baseSkill: BaseSkill, config: FHESkillDecoratorConfig)
```

#### Methods

##### `execute(input: any, permit?: Permit): Promise<any>`

Executes the skill with FHE protection.

##### `getProtectedSkill(): ProtectedSkill`

Returns protected skill info.

##### `getConfig(): FHESkillDecoratorConfig`

Returns decorator configuration.

##### `static wrap(skill: BaseSkill, config: FHESkillDecoratorConfig): FHESkillDecorator`

Static method to wrap a skill.

##### `static createEmailSkill(config: FHESkillDecoratorConfig): FHESkillDecorator`

Creates FHE-protected email skill.

##### `static createBrowserSkill(config: FHESkillDecoratorConfig): FHESkillDecorator`

Creates FHE-protected browser skill.

##### `static createFileSkill(config: FHESkillDecoratorConfig): FHESkillDecorator`

Creates FHE-protected file skill.

#### FHESkillDecoratorConfig

```typescript
interface FHESkillDecoratorConfig {
  inputEncryption: boolean;        // Encrypt skill inputs
  outputEncryption: boolean;       // Encrypt skill outputs
  credentialVault?: address;        // Vault contract address
  requirePermits?: string[];        // Required permit types
  flags?: {
    sealInput?: boolean;            // Seal input ciphertext
    sealOutput?: boolean;           // Seal output ciphertext
    requireThreshold?: boolean;     // Require threshold decryption
    thresholdValue?: bigint;        // Threshold value
  };
}
```

---

### FHEAgentMemoryProvider

Memory provider for OpenClaw with encryption.

```typescript
import { FHEAgentMemoryProvider } from './openclaw/fhe-memory-provider';

const memoryProvider = await FHEAgentMemoryProvider.create({
  contractAddress: agentMemoryAddress,
  thresholdNetworkUrl: 'https://rpc.sepolia.org',
  minApprovals: 2n,
});
```

#### Constructor

```typescript
new FHEAgentMemoryProvider(config: FHEAgentMemoryProviderConfig)
```

#### Methods

##### `initializeAgent(agentId: address): Promise<void>`

Initializes an agent in memory.

##### `appendContext(agentId: address, data: string): Promise<bigint>`

Appends encrypted context.

##### `getContext(agentId: address, permit: Permit): Promise<string>`

Retrieves and decrypts context.

##### `createSnapshot(agentId: address): Promise<Snapshot>`

Creates a context snapshot.

##### `restoreFromSnapshot(agentId: address, snapshotId: address): Promise<void>`

Restores from snapshot.

##### `getSnapshots(agentId: address): Promise<Snapshot[]>`

Lists agent snapshots.

##### `getAgentState(agentId: address): EncryptedAgentState | null`

Gets current agent state.

##### `static async create(config: FHEAgentMemoryProviderConfig): Promise<FHEAgentMemoryProvider>`

Factory method to create and initialize.

---

### FHECredentialVault

Credential manager for OpenClaw.

```typescript
import { FHECredentialVault } from './openclaw/fhe-credential-vault';

const vault = await FHECredentialVault.create({
  contractAddress: agentVaultAddress,
  thresholdNetworkUrl: 'https://rpc.sepolia.org',
  defaultThreshold: 2n,
});
```

#### Constructor

```typescript
new FHECredentialVault(config: FHECredentialVaultConfig)
```

#### Methods

##### `storeCredential(agentId: address, key: string, value: string): Promise<bytes32>`

Stores a credential (encrypted automatically).

##### `retrieveCredential(agentId: address, key: string, permit: Permit): Promise<string>`

Retrieves and decrypts credential.

##### `requestCredentialAccess(agentId: address, key: string, permit: Permit): Promise<bytes32>`

Requests credential access.

##### `grantAccess(grantee: address, agentId: address, key: string): Promise<void>`

Grants access to a credential.

##### `revokeAccess(grantee: address, agentId: address, key: string): Promise<void>`

Revokes access to a credential.

##### `deleteCredential(agentId: address, key: string): Promise<void>`

Deletes a credential.

##### `rotateCredential(agentId: address, key: string, newValue: string): Promise<bytes32>`

Rotates a credential (delete + store new).

##### `hasCredential(agentId: address, key: string): Promise<boolean>`

Checks if credential exists.

##### `getAllKeys(agentId: address): Promise<string[]>`

Lists all credential keys.

##### `static async create(config: FHECredentialVaultConfig): Promise<FHECredentialVault>`

Factory method to create and initialize.

---

## Type Definitions

### FHE Types

```typescript
// Encrypted value types
type address = `0x${string}`;
type bytes32 = `0x${string}`;
type bytes = `0x${string}`;
type uint256 = bigint;
type uint128 = bigint;
type uint64 = bigint;
type uint32 = number;
type uint16 = number;
type uint8 = number;
type bool = boolean;
```

### EncryptedValue

```typescript
interface EncryptedValue {
  handle: string;  // Ciphertext handle
  type: 'euint256' | 'euint128' | 'euint64' | 'euint32' | 'euint16' | 'euint8' | 'ebool';
}
```

### Permit (EIP-712)

```typescript
interface Permit {
  signer: address;      // Permit signer
  user: address;        // User address
  resource: address;    // Resource being accessed
  expiresAt: bigint;    // Expiration timestamp
  nonce: bigint;        // Nonce for replay protection
  v: number;            // Signature v
  r: string;            // Signature r
  s: string;            // Signature s
}
```

### PermissionLevel

```typescript
type PermissionLevel = 'none' | 'read' | 'write' | 'admin';
```

### ActionStatus

```typescript
type ActionStatus = 'Sealed' | 'Approved' | 'Released' | 'Cancelled' | 'Expired';
```

### EncryptedAgentState

```typescript
interface EncryptedAgentState {
  agentId: string;
  isInitialized: boolean;
  contextHandle: string | null;
  credentialCount: number;
  lastActivity: Date | null;
}
```

### Snapshot

```typescript
interface Snapshot {
  id: address;
  agentId: address;
  contextLength: bigint;
  createdAt: bigint;
}
```

### ProtectedSkill

```typescript
interface ProtectedSkill {
  originalSkillId: string;
  protectedSkillId: address;
  config: FHESkillDecoratorConfig;
  executionCount: bigint;
}
```

---

## Events

### AgentVault Events

```solidity
event CredentialStored(
    address indexed agentId,
    bytes32 indexed handle,
    uint256 timestamp
);

event CredentialAccessed(
    address indexed agentId,
    address indexed accessor,
    uint256 timestamp
);

event PermissionUpdated(
    address indexed agentId,
    bytes32 indexed handle,
    address indexed grantee,
    bool granted
);

event ThresholdUpdated(
    address indexed agentId,
    uint8 newThreshold
);
```

### AgentMemory Events

```solidity
event AgentInitialized(
    address indexed agentId,
    address indexed owner,
    uint256 timestamp
);

event ContextAppended(
    address indexed agentId,
    uint256 newLength
);

event SnapshotCreated(
    address indexed agentId,
    bytes32 indexed snapshotId,
    uint256 contextLength
);

event SnapshotRestored(
    address indexed agentId,
    bytes32 indexed snapshotId
);
```

### SkillRegistry Events

```solidity
event SkillRegistered(
    address indexed skillId,
    address indexed publisher,
    bytes32 metadataHash
);

event SkillVerified(
    address indexed skillId,
    address indexed verifier
);

event SkillRated(
    address indexed skillId,
    address indexed rater,
    bytes32 encryptedRating
);
```

### ActionSealer Events

```solidity
event ActionSealed(
    address indexed actionId,
    address indexed agentId,
    uint256 timestamp
);

event ReleaseConditionRegistered(
    address indexed actionId,
    uint8 threshold,
    uint256 timeout
);

event ActionApproved(
    address indexed actionId,
    address indexed approver
);

event ActionReleased(
    address indexed actionId,
    uint256 timestamp
);

event ActionCancelled(
    address indexed actionId,
    address indexed canceller,
    uint256 timestamp
);
```

---

## Errors

### AgentVault Errors

| Error | Signature | Description |
|-------|-----------|-------------|
| `CredentialNotFound` | `0x...` | Credential handle does not exist |
| `NotCredentialOwner` | `0x...` | Caller is not credential owner |
| `PermissionDenied` | `0x...` | Permit validation failed |
| `InvalidThreshold` | `0x...` | Threshold value out of range |

### AgentMemory Errors

| Error | Signature | Description |
|-------|-----------|-------------|
| `AgentNotInitialized` | `0x...` | Agent does not exist |
| `NotAgentOwner` | `0x...` | Caller is not agent owner |
| `SnapshotNotFound` | `0x...` | Snapshot does not exist |
| `InvalidContextSlice` | `0x...` | Offset/length out of range |

### SkillRegistry Errors

| Error | Signature | Description |
|-------|-----------|-------------|
| `SkillNotFound` | `0x...` | Skill does not exist |
| `AlreadyVerified` | `0x...` | Skill already verified |
| `InvalidRating` | `0x...` | Rating out of valid range |
| `PublisherMismatch` | `0x...` | Caller is not skill publisher |

### ActionSealer Errors

| Error | Signature | Description |
|-------|-----------|-------------|
| `ActionNotFound` | `0x...` | Action does not exist |
| `ActionNotSealed` | `0x...` | Action is not in Sealed status |
| `ThresholdNotMet` | `0x...` | Not enough approvals |
| `ActionExpired` | `0x...` | Action timeout reached |
| `AlreadyApproved` | `0x...` | Caller already approved |
| `AlreadyReleased` | `0x...` | Action already released |
| `AlreadyCancelled` | `0x...` | Action already cancelled |

---

## Examples

### Complete Flow: Agent with Credentials

```typescript
import { useEncryptedAgent } from './hooks/useEncryptedAgent';
import { useAgentVault } from './hooks/useAgentVault';
import { FHESkillDecorator } from './openclaw/fhe-skill-decorator';

async function setupSecureAgent(agentId: string) {
  // 1. Initialize agent memory
  const { initialize: initMemory } = useEncryptedAgent(agentId);
  await initMemory();

  // 2. Setup credential vault
  const { storeCredential, retrieveCredential } = useAgentVault(agentId);
  
  // 3. Store encrypted credentials
  await storeCredential('OPENAI_API_KEY', 'sk-...');
  await storeCredential('SENDGRID_KEY', 'SG....');

  // 4. Create FHE-protected email skill
  const secureEmailSkill = FHESkillDecorator.wrap(emailSkill, {
    inputEncryption: true,
    outputEncryption: true,
    credentialVault: vaultAddress,
    requirePermits: ['read_email', 'send_email'],
  });

  return { secureEmailSkill };
}
```

### Complete Flow: Sealed Action

```typescript
import { useSealedAction } from './hooks/useSealedAction';

async function setupTimedTransfer(agentId: string) {
  const { sealAction, registerCondition, approve, release, getStatus } = 
    useSealedAction();

  // 1. Seal a transfer action
  const action = await sealAction(agentId, {
    to: '0x...',
    amount: 1000,
    token: 'USDC',
  });

  // 2. Require 3-of-5 approvals, 1 hour timeout
  await registerCondition(action.id, 3, 3600);

  // 3. Multiple approvers approve
  await approve(action.id); // Approver 1
  await approve(action.id); // Approver 2
  await approve(action.id); // Approver 3 (threshold met)

  // 4. Check status
  const status = await getStatus(action.id);
  console.log(status); // "Approved"

  // 5. Release the action
  const result = await release(action.id, permit);
}
```

---

*Last Updated: March 2026*
*Version: 1.0*