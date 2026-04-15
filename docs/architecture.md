# FHE-Agent Shield — Architecture Documentation

> **Technical architecture of the privacy layer for AI agents using Fully Homomorphic Encryption**

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Smart Contract Architecture](#smart-contract-architecture)
4. [FHE Encryption Layer](#fhe-encryption-layer)
5. [React Integration Architecture](#react-integration-architecture)
6. [OpenClaw Integration Architecture](#openclaw-integration-architecture)
7. [Data Flow](#data-flow)
8. [Deployment Topology](#deployment-topology)
9. [Security Architecture](#security-architecture)

---

## System Overview

FHE-Agent Shield is a privacy-preserving middleware layer that protects AI agents (specifically OpenClaw agents) from credential theft, prompt injection, and data exfiltration attacks using Fully Homomorphic Encryption (FHE).

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FHE-AGENT SHIELD STACK                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         OpenClaw Runtime                                │   │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │   │  Encrypted  │  │    FHE      │  │   Sealed    │  │   Private   │  │   │
│  │   │   Agent     │  │   Skill     │  │   Action    │  │  Message    │  │   │
│  │   │   Memory    │  │  Decorator  │  │   Queue     │  │  Passport   │  │   │
│  │   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │   │
│  └──────────┼─────────────────┼─────────────────┼────────────────┼──────────┘   │
│             │                 │                 │                │              │
│  ┌──────────▼─────────────────▼─────────────────▼────────────────▼──────────┐   │
│  │                          CoFHE Layer                                   │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  FHE.sol  │  Threshold Network  │  Ciphertext Registry  │      │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│  ┌───────────────────────────────────▼─────────────────────────────────────┐   │
│  │                      Smart Contracts (L2/L1)                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │  AgentVault  │  │ AgentMemory  │  │SkillRegistry │  │ActionSealer│  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Core Components

| Component | Purpose | Technology |
|-----------|---------|------------|
| **AgentVault** | Encrypted credential storage with threshold decryption | Solidity + FHE |
| **AgentMemory** | Encrypted agent context with snapshot/restore | Solidity + FHE |
| **SkillRegistry** | FHE-verified skill marketplace | Solidity + FHE |
| **ActionSealer** | Threshold-released sealed actions | Solidity + FHE |
| **FHESkillDecorator** | OpenClaw skill wrapper with FHE protection | TypeScript |
| **FHEAgentMemoryProvider** | OpenClaw memory provider with encryption | TypeScript |
| **FHECredentialVault** | OpenClaw credential manager | TypeScript |

### Supporting Components

| Component | Purpose | Technology |
|-----------|---------|------------|
| **useFHEClient** | Core FHE encryption/decryption client | TypeScript/React |
| **useEncryptedAgent** | Encrypted agent state management hook | React |
| **useAgentVault** | Credential storage hook | React |
| **useSealedAction** | Sealed action management hook | React |

---

## Smart Contract Architecture

### AgentVault.sol

Encrypted credential storage with threshold-based access control.

```
┌─────────────────────────────────────────────────────────────┐
│                      AgentVault                             │
├─────────────────────────────────────────────────────────────┤
│  Storage:                                                   │
│  - encryptedCredentials: mapping(address => euint256)       │
│  - credentialOwners: mapping(bytes32 => address)           │
│  - permissions: mapping(bytes32 => AccessControl)          │
│  - thresholds: mapping(address => uint8)                   │
│  - credentialHandles: mapping(address => mapping(bytes32 => bytes32)) │
│                                                             │
│  Core Functions:                                            │
│  + storeCredential(inEuint256) → bytes32                    │
│  + retrieveCredential(bytes32) → encryptedValue (permit)    │
│  + grantRetrievePermission(address, bytes32)                │
│  + revokePermission(address, bytes32)                       │
│  + updateThreshold(address, uint8)                          │
│  + credentialExists(bytes32) → bool                        │
│  + getCredentialOwner(bytes32) → address                     │
│                                                             │
│  Events:                                                    │
│  - CredentialStored(agentId, handle, timestamp)             │
│  - CredentialAccessed(agentId, accessor, timestamp)        │
│  - PermissionUpdated(agentId, permissions)                 │
│  - ThresholdUpdated(agentId, newThreshold)                 │
└─────────────────────────────────────────────────────────────┘
```

**Key Security Properties:**
- All credentials stored as encrypted values (euint256)
- Access requires valid EIP-712 permit
- Threshold decryption prevents single-point-of-failure
- Credential handles are non-linkable to original data

### AgentMemory.sol

Encrypted agent state with snapshot/restore capabilities.

```
┌─────────────────────────────────────────────────────────────┐
│                      AgentMemory                            │
├─────────────────────────────────────────────────────────────┤
│  Storage:                                                   │
│  - agents: mapping(address => Agent)                        │
│  - contexts: mapping(address => euint256[])                 │
│  - snapshots: mapping(bytes32 => Snapshot)                  │
│  - contextLengths: mapping(address => uint256)             │
│                                                             │
│  Core Functions:                                            │
│  + initializeAgent() → address                              │
│  + appendContext(inEuint256) → uint256                      │
│  + getContextSlice(uint256, uint256) → encryptedChunk[]     │
│  + snapshotContext() → bytes32                              │
│  + restoreFromSnapshot(bytes32)                             │
│  + getContextLength() → uint256                            │
│  + getAgentOwner() → address                                │
│                                                             │
│  Events:                                                    │
│  - AgentInitialized(agentId, owner, timestamp)              │
│  - ContextAppended(agentId, newLength)                     │
│  - SnapshotCreated(agentId, snapshotId, contextLength)      │
│  - SnapshotRestored(agentId, snapshotId)                    │
└─────────────────────────────────────────────────────────────┘
```

**Key Security Properties:**
- Context never leaves encrypted form on-chain
- Snapshots preserve encrypted state
- Only threshold-decrypted with proper permits
- No plaintext data exposure during agent operations

### SkillRegistry.sol

FHE-verified marketplace for AI agent skills.

```
┌─────────────────────────────────────────────────────────────┐
│                     SkillRegistry                           │
├─────────────────────────────────────────────────────────────┤
│  Storage:                                                   │
│  - skills: mapping(address => Skill)                        │
│  - skillRatings: mapping(address => euint256[])            │
│  - verifiedPublishers: mapping(address => bool)             │
│  - skillCount: uint256                                      │
│                                                             │
│  Core Functions:                                            │
│  + registerSkill(bytes32, bytes32) → address                │
│  + verifySkill(address)                                     │
│  + rateSkill(address, inEuint256)                           │
│  + executeSkill(address, bytes) → bytes                      │
│  + getSkill(address) → SkillInfo                            │
│  + isVerified(address) → bool                               │
│                                                             │
│  Events:                                                    │
│  - SkillRegistered(skillId, publisher, metadataHash)        │
│  - SkillVerified(skillId, verifier)                         │
│  - SkillRated(skillId, rater, encryptedRating)             │
└─────────────────────────────────────────────────────────────┘
```

**Key Security Properties:**
- All skill metadata encrypted until verification
- Ratings aggregated on-chain without plaintext exposure
- Reputation computed without revealing individual votes
- Verified publishers are permissioned

### ActionSealer.sol

Sealed actions with threshold release conditions.

```
┌─────────────────────────────────────────────────────────────┐
│                     ActionSealer                            │
├─────────────────────────────────────────────────────────────┤
│  Storage:                                                   │
│  - sealedActions: mapping(address => SealedAction)         │
│  - releaseConditions: mapping(address => ReleaseCondition)  │
│  - actionCount: uint256                                     │
│                                                             │
│  Core Functions:                                            │
│  + sealAction(address, bytes) → address                     │
│  + registerReleaseCondition(address, uint8, uint256)        │
│  + approveRelease(address)                                  │
│  + releaseAction(bytes) → bytes                             │
│  + cancelAction(address)                                    │
│  + getActionStatus(address) → ActionStatus                  │
│  + getReleaseCondition(address) → ReleaseCondition          │
│                                                             │
│  ActionStatus:                                              │
│  - Sealed: Initial state, awaiting approvals               │
│  - Approved: Threshold met, ready for release              │
│  - Released: Action executed                                │
│  - Cancelled: Action cancelled by owner                    │
│  - Expired: Timeout reached without release                │
└─────────────────────────────────────────────────────────────┘
```

**Key Security Properties:**
- Actions sealed until threshold approvals
- Timeout prevents indefinite pending actions
- Owner can cancel before threshold met
- Only approved actions can be released

---

## FHE Encryption Layer

### FHE Types

```solidity
// FHE encrypted integer types
type euint256 is uint256;
type euint128 is uint128;
type euint64 is uint64;
type euint32 is uint32;
type euint16 is uint16;
type euint8 is uint8;

// FHE encrypted boolean
type ebool is bool;

// Input types for function parameters
type inEuint256 is bytes;
```

### Supported Operations

| Operation | Description | Example |
|-----------|-------------|---------|
| `FHE.asEuint256()` | Create encrypted uint256 | `euint256 val = FHE.asEuint256(encryptedInput);` |
| `FHE.add()` | Add two encrypted values | `euint256 result = FHE.add(a, b);` |
| `FHE.sub()` | Subtract encrypted values | `euint256 result = FHE.sub(a, b);` |
| `FHE.eq()` | Compare encrypted equality | `ebool result = FHE.eq(a, b);` |
| `FHE.gt()` | Compare encrypted greater than | `ebool result = FHE.gt(a, b);` |
| `FHE.lt()` | Compare encrypted less than | `ebool result = FHE.lt(a, b);` |
| `FHE.and()` | Bitwise AND | `euint256 result = FHE.and(a, b);` |
| `FHE.or()` | Bitwise OR | `euint256 result = FHE.or(a, b);` |
| `FHE.decrypt()` | Threshold decryption | `uint256 result = FHE.decrypt(encrypted);` |

### Input/Output Handling

```solidity
// Input: Encrypted parameter (calldata)
function storeCredential(inEuint256 calldata encryptedValue) 
    external 
    returns (bytes32)
{
    // Convert to internal encrypted type
    euint256 value = FHE.asEuint256(encryptedValue);
    // Process encrypted data
    // Return handle to encrypted credential
}

// Output: Events with encrypted data (viewable by threshold network)
event CredentialStored(
    address indexed agentId,
    bytes32 indexed handle,
    uint256 timestamp
);
```

---

## React Integration Architecture

### Hook Layer

```
┌─────────────────────────────────────────────────────────────┐
│                    React Application                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Hooks Layer                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ useEncrypted    │  │   useAgent      │  │useSealed    │ │
│  │ Agent           │  │   Vault         │  │Action       │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘ │
│           │                    │                    │        │
│           └────────────────────┼────────────────────┘        │
│                                │                              │
│                    ┌───────────▼───────────┐                  │
│                    │    useFHEClient      │                  │
│                    │  (Core FHE Client)   │                  │
│                    └───────────┬───────────┘                  │
└────────────────────────────────┼─────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   Contract Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ AgentVault   │  │ AgentMemory  │  │ActionSealer  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Hook Responsibilities

| Hook | Responsibility | Key Methods |
|------|----------------|-------------|
| **useFHEClient** | Core encryption/decryption, FHE client management | `encrypt()`, `decrypt()`, `verifyPermission()` |
| **useEncryptedAgent** | Agent state management, context operations | `initialize()`, `appendContext()`, `snapshot()`, `restore()` |
| **useAgentVault** | Credential storage and retrieval | `store()`, `retrieve()`, `grantAccess()`, `revokeAccess()` |
| **useSealedAction** | Sealed action lifecycle | `seal()`, `approve()`, `release()`, `cancel()` |

---

## OpenClaw Integration Architecture

### Integration Pattern

FHE-Agent Shield uses the **Decorator Pattern** to wrap OpenClaw skills with FHE protection without modifying the underlying OpenClaw runtime.

```
┌─────────────────────────────────────────────────────────────┐
│                   OpenClaw Runtime                           │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Gateway (Node.js)                                       ││
│  │  ┌───────────────────────────────────────────────────┐  ││
│  │  │           Agent Runtime (ReAct Loop)               │  ││
│  │  │  ┌─────────────────────────────────────────────┐   │  ││
│  │  │  │         FHESkillDecorator                    │   │  ││
│  │  │  │  • Encrypts inputs before skill execution  │   │  ││
│  │  │  │  • Decrypts outputs after execution         │   │  ││
│  │  │  │  • Manages credential access via permits    │   │  ││
│  │  │  └─────────────────────────────────────────────┘   │  ││
│  │  └───────────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### FHESkillDecorator

The `FHESkillDecorator` wraps any OpenClaw skill with FHE protection:

```typescript
interface FHESkillDecoratorConfig {
  inputEncryption: boolean;      // Encrypt skill inputs
  outputEncryption: boolean;     // Encrypt skill outputs
  credentialVault?: string;      // Vault contract address
  requirePermits?: string[];      // Required permit types
  flags?: {
    sealInput?: boolean;
    sealOutput?: boolean;
    requireThreshold?: boolean;
    thresholdValue?: bigint;
  };
}
```

### FHEAgentMemoryProvider

Memory provider that stores agent context encrypted on-chain:

```typescript
interface FHEAgentMemoryProviderConfig {
  contractAddress: string;       // AgentMemory.sol address
  thresholdNetworkUrl: string;   // Threshold RPC
  minApprovals: bigint;          // Minimum approvals for decryption
}
```

### FHECredentialVault

Credential manager that stores API keys encrypted:

```typescript
interface FHECredentialVaultConfig {
  contractAddress: string;       // AgentVault.sol address
  thresholdNetworkUrl: string;   // Threshold RPC
  defaultThreshold: bigint;       // Default threshold for access
}
```

---

## Data Flow

### Credential Storage Flow

```
1. User/Agent                    2. FHE Client                 3. AgentVault Contract
     │                              │                              │
     │  storeCredential(key, val)   │                              │
     │─────────────────────────────▶│                              │
     │                              │  encrypt(value)              │
     │                              │──────────┐                   │
     │                              │          │                   │
     │                              │◀─────────┘                   │
     │                              │                              │
     │  encryptedValue              │                              │
     │─────────────────────────────▶│                              │
     │                              │  storeCredential(encrypted)  │
     │                              │─────────────────────────────▶│
     │                              │                              │
     │                              │           handle            │
     │                              │◀─────────────────────────────│
     │                              │                              │
     │         handle              │                              │
     │◀─────────────────────────────│                              │
```

### Protected Skill Execution Flow

```
User Input (possibly malicious)
         │
         ▼
┌─────────────────────────┐
│   FHESkillDecorator     │
│   1. Encrypt Input      │◀── Prevents prompt injection
│   2. Check Permits      │
│   3. Execute Skill      │
│   4. Encrypt Output     │
└─────────────────────────┘
         │
         ▼
Encrypted Result
         │
         ▼
┌─────────────────────────┐
│   Threshold Network     │◀── M-of-N decryption
│   Decrypt for viewer    │
└─────────────────────────┘
```

### Snapshot/Restore Flow

```
Agent Memory Operations:
                                                    
┌─────────────┐     appendContext()      ┌─────────────┐
│   Agent     │────────────────────────▶│  AgentMem   │
│   Runtime   │◀─────────────────────────│    ory      │
└─────────────┘     encrypted handle     └─────────────┘
                                                    
                    snapshotContext()                  ┌─────────────┐
┌─────────────┐────────────────────────▶│  AgentMem   │────▶│  Snapshot   │
│   Agent     │◀─────────────────────────│    ory      │◀────│   Stored    │
└─────────────┘         snapshotId       └─────────────┘     └─────────────┘
                                                    
                    restoreFromSnapshot()               ┌─────────────┐
┌─────────────┐────────────────────────▶│  AgentMem   │────▶│  Context    │
│   Agent     │◀─────────────────────────│    ory      │◀────│  Restored   │
└─────────────┘     encrypted context    └─────────────┘     └─────────────┘
```

---

## Deployment Topology

### Development Environment

```
┌─────────────────────────────────────────────────────────────┐
│                    Local Development                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   Foundry   │     │  Local Node  │     │    FHE      │   │
│  │   Anvil     │────▶│  (Optional)  │     │   Mock      │   │
│  │             │     │             │     │   Network    │   │
│  └─────────────┘     └─────────────┘     └─────────────┘   │
│                                                             │
│  Fhenix Contracts (lib/fhenix-contracts)                    │
│  OpenZeppelin Contracts (lib/openzeppelin-contracts)         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Testnet Environment

```
┌─────────────────────────────────────────────────────────────┐
│   CoFHE-supported host chain (Sepolia / Arb-Sepolia / Base) │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  RPC: $SEPOLIA_RPC (or arbitrumSepolia / baseSepolia)       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Deployed Contracts                      │   │
│  │  • AgentVault:     0x...                            │   │
│  │  • AgentMemory:    0x...                            │   │
│  │  • SkillRegistry:  0x...                            │   │
│  │  • ActionSealer:   0x...                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │     Fhenix CoFHE Coprocessor (off-chain)             │   │
│  │  • Off-chain FHE computation                         │   │
│  │  • Threshold decryption network                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### OpenClaw Integration Deployment

```
┌─────────────────────────────────────────────────────────────┐
│              OpenClaw + FHE-Agent Shield                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              OpenClaw Gateway                         │   │
│  │  Port: 18789                                         │   │
│  │  Environment Variables:                              │   │
│  │  • FHE_VAULT_ADDRESS                                 │   │
│  │  • FHE_MEMORY_ADDRESS                                │   │
│  │  • THRESHOLD_RPC                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                               │
│                            ▼                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              FHE-Agent Shield Contracts             │   │
│  │  (On a CoFHE-supported host chain —                 │   │
│  │   Ethereum Sepolia / Arbitrum Sepolia / Base Sepolia)│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

### Defense Layers

```
┌─────────────────────────────────────────┐
│         1. Permit Authentication        │ ← On-chain EIP-712 permit validation
├─────────────────────────────────────────┤
│         2. Threshold Decryption         │ ← M-of-N key holders required
├─────────────────────────────────────────┤
│         3. FHE Access Control            │ ← Contract-level ACL on encrypted data
├─────────────────────────────────────────┤
│         4. Selective Disclosure         │ ← Only reveal what's explicitly permitted
└─────────────────────────────────────────┘
```

### Threat Mitigation Matrix

| Threat | Without FHE-Agent Shield | With FHE-Agent Shield |
|--------|--------------------------|----------------------|
| Credential Theft | API keys in plaintext env files | Encrypted in AgentVault, threshold decryption required |
| Prompt Injection | Direct execution of injected commands | Input encrypted, cannot be interpreted as commands |
| Data Exfiltration | Agent reads local files, sends to attacker | AgentMemory encrypted, requires permit + threshold |
| Malicious Skills | Skills can access any credential | Skills via FHESkillDecorator, permits required |
| Replay Attacks | No protection | Permits have expiration and nonces |

### Access Control Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Access Request Flow                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Requester sends access request with EIP-712 permit               │
│                          │                                           │
│                          ▼                                           │
│  2. Contract validates:                                              │
│     • Permit signature (signer, user, resource match)                │
│     • Permit expiration (not expired)                                │
│     • Permit nonce (no replay)                                       │
│     • Caller address matches permit.user                             │
│                          │                                           │
│                          ▼                                           │
│  3. If validation passes:                                            │
│     • Threshold network initiates decryption                          │
│     • M-of-N key holders approve                                    │
│     • Encrypted data decrypted to requester                          │
│                                                                      │
│  4. If validation fails:                                            │
│     • Transaction reverts                                            │
│     • Event emitted for monitoring                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Contract Interactions

### Cross-Contract Dependencies

```
                    ┌─────────────────────────────────────┐
                    │           OpenClaw Agent             │
                    └─────────────────┬───────────────────┘
                                      │
                                      │ uses
                                      ▼
                    ┌─────────────────────────────────────┐
                    │       FHESkillDecorator             │
                    │   (TypeScript OpenClaw wrapper)     │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────┼───────────────────┐
                    │                 │                   │
          ┌─────────▼─────────┐ ┌─────▼───────┐ ┌────────▼────────┐
          │    AgentVault    │ │ AgentMemory │ │  SkillRegistry   │
          │ (Credentials)    │ │  (Context)  │ │   (Marketplace)  │
          └─────────┬─────────┘ └─────┬───────┘ └────────┬────────┘
                    │                 │                   │
                    └─────────────────┼───────────────────┘
                                      │ uses
                                      ▼
                    ┌─────────────────────────────────────┐
                    │          ActionSealer                │
                    │     (Sealed Actions Queue)           │
                    └─────────────────────────────────────┘
```

### Integration with Fhenix CoFHE

```
┌─────────────────────────────────────────────────────────────┐
│                   Fhenix CoFHE Layer                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 FHE Precompiles                      │   │
│  │  • tfhe_add, tfhe_sub, tfhe_mul                     │   │
│  │  • tfhe_eq, tfhe_gt, tfhe_lt                        │   │
│  │  • tfhe_and, tfhe_or, tfhe_xor                      │   │
│  │  • tfhe_rotate, tfhe_shift                          │   │
│  │  • tfhe_encrypt, tfhe_decrypt                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                               │
│  ┌───────────────────────────▼───────────────────────────┐  │
│  │              Threshold Network                         │  │
│  │  • Distributed key generation (DKG)                  │  │
│  │  • Threshold decryption protocol                      │  │
│  │  • M-of-N signature scheme                           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Gas Optimization Considerations

### On-Chain vs Off-Chain Computation

| Operation | Location | Gas Cost | Notes |
|-----------|----------|----------|-------|
| FHE Storage | On-chain | High | Minimize encrypted data stored |
| FHE Comparison | On-chain | Medium | Use for access control only |
| FHE Arithmetic | On-chain | High | Batch operations when possible |
| Decryption | Off-chain | N/A | Threshold network handles |
| Context Append | On-chain | Medium | Depends on ciphertext size |

### Best Practices

1. **Batch Operations**: Aggregate multiple FHE operations into single transactions
2. **Minimize Storage**: Store handles, not full ciphertexts on-chain
3. **Off-Chain Computation**: Perform complex operations off-chain, verify on-chain
4. **Event Logging**: Use events for decrypted data visibility (threshold network only)

---

## Project Structure

```
fhe-agent-shield/
├── src/
│   ├── contracts/
│   │   ├── AgentVault.sol
│   │   ├── AgentMemory.sol
│   │   ├── SkillRegistry.sol
│   │   └── ActionSealer.sol
│   ├── hooks/
│   │   ├── useFHEClient.ts
│   │   ├── useEncryptedAgent.ts
│   │   ├── useAgentVault.ts
│   │   ├── useSealedAction.ts
│   │   └── index.ts
│   ├── openclaw/
│   │   ├── fhe-skill-decorator.ts
│   │   ├── fhe-memory-provider.ts
│   │   ├── fhe-credential-vault.ts
│   │   └── index.ts
│   └── utils/
│       └── types.ts
├── test/
│   ├── AgentVault.t.sol
│   ├── AgentMemory.t.sol
│   ├── SkillRegistry.t.sol
│   ├── ActionSealer.t.sol
│   └── fork/
├── skills/
│   ├── email/
│   ├── browser/
│   ├── file/
│   ├── solidity-fhe/
│   ├── react-hooks/
│   └── openclaw-integration/
├── docs/
│   ├── architecture.md (this file)
│   ├── api-reference.md
│   └── security-model.md
├── script/
│   ├── Deploy.s.sol
│   ├── DeployAll.s.sol
│   └── Demo.s.sol
└── foundry.toml
```

---

## References

- [Fhenix CoFHE Documentation](https://docs.fhenix.zone)
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [Solidity FHE Contracts](https://github.com/fhenixprotocol/fhenix-contracts)
- [EIP-712: Typed Structure Signing](https://eips.ethereum.org/EIPS/eip-712)

---

*Last Updated: March 2026*
*Version: 1.0*