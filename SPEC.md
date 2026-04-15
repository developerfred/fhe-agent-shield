# FHE-Agent Shield — Privacy Layer for AI Agents

> **Solving OpenClaw's security crisis with Fully Homomorphic Encryption**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Buildathon: Fhenix Privacy-by-Design](https://img.shields.io/badge/Buildathon-Fhenix-green.svg)](https://fhenix.io)

---

## 1. Problem Statement

OpenClaw (formerly Moltbot/Clawdbot) is the fastest-growing AI agent framework (250K+ GitHub stars), but suffers from
**critical privacy vulnerabilities**:

| Vulnerability              | Impact                                                      | FHE-Agent Shield Solution                                                     |
| -------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Credential Exposure**    | 135K+ instances with plaintext API keys on Shodan           | Encrypted credential vault with threshold decryption                          |
| **Prompt Injection**       | 91% attack success rate; 2.6% of Moltbook posts are attacks | FHE-protected input processing — injection can't read/write encrypted prompts |
| **Data Exfiltration**      | Agent reads local files, exfiltrates to attackers           | Encrypted agent memory — data never plaintext in transit                      |
| **ClawHavoc Supply Chain** | 1,184+ malicious skills in marketplace                      | FHE-verified skill execution + selective disclosure                           |
| **"Naked Agent" Problem**  | Agent operates in plaintext, exposing all data              | Privacy-by-design: everything encrypted by default                            |

---

## 2. Architecture Overview

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
│  │              CoFHE Coprocessor (off-chain + on host chain)             │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  FHE.sol  │  Task Manager  │  Threshold Network  │  Registry  │   │   │
│  │  │  (on-chain library)         (off-chain MPC)     (on-chain)    │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│  ┌───────────────────────────────────▼─────────────────────────────────────┐   │
│  │           Shield Smart Contracts (deployed on host EVM chain)          │   │
│  │           — Ethereum Sepolia / Arbitrum Sepolia / Base Sepolia —        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │   │
│  │  │  AgentVault  │  │ AgentMemory  │  │SkillRegistry │  │ActionSealer│  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Architecture

### 3.1 Smart Contracts

#### `AgentVault.sol` — Encrypted Credential Storage

```
┌─────────────────────────────────────────────────────────────┐
│                      AgentVault                             │
├─────────────────────────────────────────────────────────────┤
│  State:                                                     │
│  - encryptedCredentials: mapping(agentId → euint256)       │
│  - accessControl: mapping(agentId → encryptedPermissions)  │
│  - thresholdRequired: euint8                                │
│                                                             │
│  Functions:                                                 │
│  + storeCredential(encryptedValue) → handle                 │
│  + retrieveCredential(handle) → encryptedValue (requires permit) │
│  + requestDecryption(handle) → decryptionRequest           │
│  + updatePermissions(newPermissions)                        │
│                                                             │
│  Events:                                                    │
│  - CredentialStored(agentId, handle, timestamp)           │
│  - CredentialAccessed(agentId, accessor, timestamp)         │
│  - PermissionUpdated(agentId, newPermissions)               │
└─────────────────────────────────────────────────────────────┘
```

#### `AgentMemory.sol` — Encrypted Agent State

```
┌─────────────────────────────────────────────────────────────┐
│                      AgentMemory                            │
├─────────────────────────────────────────────────────────────┤
│  State:                                                     │
│  - encryptedContext: mapping(agentId → euint256[])          │
│  - contextHash: mapping(agentId → bytes32)                 │
│  - lastUpdate: mapping(agentId → euint64)                   │
│                                                             │
│  Functions:                                                 │
│  + initializeAgent() → agentId                             │
│  + appendContext(encryptedChunk) → newLength               │
│  + getContextSlice(offset, length) → encryptedChunk[]      │
│  + computeOnContext(operation, params) → encryptedResult   │
│  + snapshotContext() → snapshotId                          │
│  + restoreFromSnapshot(snapshotId)                         │
│                                                             │
│  Invariants:                                                │
│  - Context never leaves encrypted form on-chain            │
│  - Only threshold-decrypted with proper permits            │
└─────────────────────────────────────────────────────────────┘
```

#### `SkillRegistry.sol` — FHE-Verified Skill Marketplace

```
┌─────────────────────────────────────────────────────────────┐
│                     SkillRegistry                           │
├─────────────────────────────────────────────────────────────┤
│  State:                                                     │
│  - skills: mapping(skillId → EncryptedSkill)               │
│  - skillRatings: mapping(skillId → euint16[])              │
│  - verifiedPublishers: mapping(publisher → bool)           │
│                                                             │
│  Functions:                                                 │
│  + registerSkill(encryptedMetadata, encryptedCodeHash)      │
│  + verifySkill(skillId) → verificationStatus               │
│  + rateSkill(skillId, encryptedRating)                     │
│  + executeSkill(skillId, encryptedInput) → encryptedOutput │
│  + challengeSkill(skillId) → challengeResult                │
│                                                             │
│  Security:                                                   │
│  - All skill metadata encrypted until verification         │
│  - Ratings aggregated on-chain (no plaintext exposure)    │
│  - Reputation computed without revealing individual votes  │
└─────────────────────────────────────────────────────────────┘
```

#### `ActionSealer.sol` — Sealed Agent Actions

```
┌─────────────────────────────────────────────────────────────┐
│                     ActionSealer                            │
├─────────────────────────────────────────────────────────────┤
│  State:                                                     │
│  - sealedActions: mapping(actionId → EncryptedAction)      │
│  - actionReceipts: mapping(actionId → bytes32)             │
│  - thresholdReleases: mapping(actionId → ReleaseCondition) │
│                                                             │
│  Functions:                                                 │
│  + sealAction(encryptedAction, conditions) → actionId       │
│  + registerReleaseCondition(actionId, threshold, timeout)  │
│  + releaseAction(actionId, decryptionPermit) → plaintext   │
│  + cancelAction(actionId, cancellationPermit)              │
│  + getSealedAction(actionId) → encryptedAction (view)      │
│                                                             │
│  Use Cases:                                                  │
│  - Scheduled trades that execute at preset conditions     │
│  - Multi-sig agent actions requiring threshold approval   │
│  - Timed actions with automatic expiration                │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. React Hooks API

### `useEncryptedAgent(agentId)`

```typescript
interface EncryptedAgentState {
  agentId: string;
  isInitialized: boolean;
  contextHandle: string; // Handle to encrypted context
  credentialCount: number;
  lastActivity: Date;
}

function useEncryptedAgent(agentId: string): {
  state: EncryptedAgentState;
  encryptContext: (data: any) => Promise<string>;
  appendContext: (handle: string, data: any) => Promise<void>;
  getDecryptedContext: (handle: string) => Promise<any>;
  snapshot: () => Promise<string>;
  restore: (snapshotId: string) => Promise<void>;
};
```

### `useAgentVault()`

```typescript
function useAgentVault(): {
  storeCredential: (agentId: string, credential: EncryptedValue) => Promise<string>;
  requestCredential: (handle: string, permit: Permit) => Promise<EncryptedValue>;
  decryptCredential: (handle: string) => Promise<string>; // Only with proper permit
  updatePermissions: (agentId: string, permissions: EncryptedPermissions) => Promise<void>;
  getCredentialHandle: (agentId: string) => Promise<string>;
};
```

### `useSealedAction()`

```typescript
interface SealedAction {
  actionId: string;
  encryptedPayload: string;
  conditions: ReleaseConditions;
  status: "sealed" | "released" | "cancelled" | "expired";
  createdAt: Date;
  expiresAt?: Date;
}

function useSealedAction(): {
  sealAction: (payload: any, conditions: ReleaseConditions) => Promise<SealedAction>;
  registerCondition: (actionId: string, condition: ReleaseCondition) => Promise<void>;
  release: (actionId: string, permit: Permit) => Promise<any>;
  cancel: (actionId: string, permit: Permit) => Promise<void>;
  getStatus: (actionId: string) => Promise<SealedAction>;
};
```

---

## 5. OpenClaw Integration

### FHE Skill Decorator

```typescript
// Wraps any OpenClaw skill with FHE protection
import { FHESkillDecorator } from "@fhe-agent-shield/openclaw";

const secureEmailSkill = FHESkillDecorator.wrap(emailSkill, {
  inputEncryption: true,
  outputEncryption: true,
  credentialVault: "agent-vault-address",
  requirePermit: ["read_email", "send_email"],
});

// Usage in OpenClaw
agent.registerSkill(secureEmailSkill);
```

### Encrypted Memory Provider

```typescript
import { FHEAgentMemoryProvider } from "@fhe-agent-shield/openclaw";

const memoryProvider = new FHEAgentMemoryProvider({
  contractAddress: "agent-memory-address",
  thresholdNetwork: "threshold-rpc-url",
});

agent.useMemoryProvider(memoryProvider);
```

---

## 6. Security Model

### Threat Model

| Threat                                 | Mitigation                                           |
| -------------------------------------- | ---------------------------------------------------- |
| Credential theft                       | Encrypted at rest + threshold decryption             |
| Prompt injection via untrusted content | All prompts encrypted before processing              |
| Malicious skills in marketplace        | FHE-verified execution, ratings aggregated encrypted |
| Data exfiltration                      | Agent memory never plaintext in transit              |
| Timing attacks                         | Decryption timing normalized via threshold network   |
| Replay attacks                         | Permits with expiration and usage counters           |

### Access Control Layers

```
┌─────────────────────────────────────────┐
│         1. Permit Authentication        │ ← On-chain permit validation
├─────────────────────────────────────────┤
│         2. Threshold Decryption         │ ← M-of-N key holders required
├─────────────────────────────────────────┤
│         3. FHE Access Control            │ ← Contract-level ACL on encrypted data
├─────────────────────────────────────────┤
│         4. Selective Disclosure         │ ← Only reveal what's explicitly permitted
└─────────────────────────────────────────┘
```

---

## 7. Project Structure

```
fhe-agent-shield/
├── contracts/
│   ├── AgentVault.sol
│   ├── AgentMemory.sol
│   ├── SkillRegistry.sol
│   ├── ActionSealer.sol
│   └── mocks/
│       └── MockFHE.sol
├── test/
│   ├── AgentVault.test.ts
│   ├── AgentMemory.test.ts
│   ├── SkillRegistry.test.ts
│   └── ActionSealer.test.ts
├── src/
│   ├── hooks/
│   │   ├── useEncryptedAgent.ts
│   │   ├── useAgentVault.ts
│   │   ├── useSealedAction.ts
│   │   └── useFHEClient.ts
│   ├── openclaw/
│   │   ├── fhe-skill-decorator.ts
│   │   ├── fhe-memory-provider.ts
│   │   └── fhe-credential-vault.ts
│   └── utils/
│       ├── encryption.ts
│       ├── permits.ts
│       └── types.ts
├── docs/
│   ├── architecture.md
│   ├── api-reference.md
│   └── security-model.md
├── skills/
│   ├── solidity-fhe/
│   │   └── SKILL.md
│   ├── react-hooks/
│   │   └── SKILL.md
│   └── openclaw-integration/
│       └── SKILL.md
├── README.md
├── SPEC.md (this file)
└── ROADMAP.md
```

---

## 8. Design Decisions

### Decision 1: FHE Scheme Selection

**Choice:** BFV for integer operations, CKKS for approximate computation (future)

**Rationale:**

- BFV: Efficient for encrypted credentials and ratings (discrete values)
- CKKS: Future-proofing for ML inference on encrypted agent context
- Fhenix CoFHE (the FHE coprocessor running alongside the host chain) supports both natively

### Decision 2: Threshold Network Integration

**Choice:** Use Fhenix Threshold Network for all decryption

**Rationale:**

- No single point of failure for key management
- Decryption requires M-of-N consensus
- Already supported on the CoFHE testnets: Ethereum Sepolia, Arbitrum Sepolia, Base Sepolia (no separate Fhenix chain
  required)

### Decision 3: OpenClaw Compatibility

**Choice:** Wrapper/decorator pattern, not fork

**Rationale:**

- Leverages OpenClaw's 250K stars and community momentum
- FHE protection layer is opt-in per skill
- Easier to maintain and update

### Decision 4: TDD Approach

**Choice:** Define test contracts/specs first, implement to pass

**Rationale:**

- FHE is complex — tests clarify expected behavior
- Easier to catch bugs in encrypted operations
- Documentation by example

---

## 9. Testing Strategy

### Unit Tests (per contract)

```typescript
describe("AgentVault", () => {
  describe("storeCredential", () => {
    it("should store encrypted credential and return handle");
    it("should emit CredentialStored event");
    it("should revert if not called by authorized agent");
  });

  describe("retrieveCredential", () => {
    it("should return encrypted value to permitted accessor");
    it("should revert if caller lacks permit");
    it("should handle threshold decryption correctly");
  });
});
```

### Integration Tests (cross-contract)

```typescript
describe("FHE-Agent Shield Integration", () => {
  it("should: initialize agent → store credential → append context → seal action");
  it("should: fail if action released without proper threshold");
  it("should: correctly aggregate encrypted ratings without plaintext exposure");
});
```

### End-to-End Tests (with OpenClaw)

```typescript
describe("OpenClaw Integration", () => {
  it("should execute FHE-decorated skill with encrypted inputs");
  it("should store/retrieve agent memory without plaintext exposure");
  it("should handle credential rotation securely");
});
```

---

## 10. Milestones

| Milestone                | Deliverable                                 | Timeline  |
| ------------------------ | ------------------------------------------- | --------- |
| M1: Foundation           | Project setup, mock contracts, basic tests  | Day 1-2   |
| M2: Core Contracts       | AgentVault + AgentMemory + tests            | Day 3-5   |
| M3: Advanced Contracts   | SkillRegistry + ActionSealer + tests        | Day 6-8   |
| M4: React Integration    | Hooks implementation + storybook            | Day 9-11  |
| M5: OpenClaw Integration | Skill decorator + memory provider           | Day 12-14 |
| M6: Demo                 | Working demo with OpenClaw + FHE protection | Day 15-18 |
| M7: Polish               | README, docs, final testing                 | Day 19-20 |

---

## 11. Success Metrics

| Metric                    | Target                                     |
| ------------------------- | ------------------------------------------ |
| Test Coverage             | >90% on smart contracts                    |
| Encrypted Operations      | All credential/memory ops use FHE          |
| OpenClaw Skills Protected | Demo with 3+ FHE-decorated skills          |
| Hackathon Demo            | Live demo showing prompt injection blocked |
| Documentation             | Complete API reference + quick start       |

---

## 12. References

- [Fhenix CoFHE Documentation](https://cofhe-docs.fhenix.zone)
- [CoFHE Quick Start](https://cofhe-docs.fhenix.zone/fhe-library/introduction/quick-start)
- [OpenClaw Security Analysis](https://www.agentputer.com/blog/15-openclaw-security/)
- [The Naked Agent Problem](https://www.moltbook.com/post/f531bc2a-aab0-4ec5-97ea-186d999fc2f2)
- [AgentCrypt: Privacy in AI Agent Collaboration](https://arxiv.org/html/2512.08104v2)
- [FHE-Agent: Encrypted ML Inference](https://www.arxiv.org/pdf/2511.18653)

---

_FHE-Agent Shield: Building the privacy layer that AI agents deserve._
