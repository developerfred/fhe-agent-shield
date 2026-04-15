# FHE-Agent Shield -- STRIDE Threat Model

> **Version:** 1.0 **Date:** April 15, 2026 **Status:** Initial assessment -- pre-audit **Scope:** All four Shield smart
> contracts, the CoFHE boundary, the OpenClaw integration layer, and cross-cutting concerns.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Decomposition (Data Flow Diagram)](#2-system-decomposition)
3. [STRIDE Matrix per Component](#3-stride-matrix-per-component)
4. [Cross-Cutting Threats](#4-cross-cutting-threats)
5. [Prioritized Mitigation Backlog](#5-prioritized-mitigation-backlog)
6. [References](#6-references)

---

## 1. Introduction

### 1.1 Purpose and Scope

This document enumerates threats against the FHE-Agent Shield system using the STRIDE methodology (Spoofing, Tampering,
Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege). It covers:

- The four on-chain contracts: **AgentVault**, **AgentMemory**, **SkillRegistry**, **ActionSealer**.
- The trust boundary between Shield contracts and the **Fhenix CoFHE coprocessor** (FheOS Server, Threshold Network,
  Task Manager, Ciphertext Registry).
- The off-chain integration layer: **FHESkillDecorator**, **FHEAgentMemoryProvider**, **FHECredentialVault**, and their
  interaction with the OpenClaw runtime.
- Cross-cutting concerns: prompt injection, supply chain, cross-chain replay, MEV, key rotation, RPC observability.

It deliberately does **not** duplicate the existing `docs/security-model.md`, which covers defense-layer descriptions,
invariant listings, and incident response. This document focuses on _attack enumeration_ and _gap analysis_.

### 1.2 Trust Model

**Trusted:**

| Entity                                                                   | Trust Basis                                                                                                                                                                     |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host chain validators (Ethereum Sepolia, Arbitrum Sepolia, Base Sepolia) | Consensus guarantees of the respective L1/L2. Finality assumed after chain-specific confirmation depth.                                                                         |
| CoFHE Threshold Network key-holders (up to M-of-N)                       | Honest-majority assumption: fewer than M key-holders collude. Threshold parameter is set by Fhenix.                                                                             |
| Developer who deploys contracts                                          | Deployer controls initial configuration (threshold values, contract addresses). Deployer key compromise is out of scope for runtime threat model but noted as a bootstrap risk. |
| FHE.sol library (`@fhenixprotocol/contracts/FHE.sol`)                    | Assumed correct. Bugs in FHE.sol are catastrophic but outside our control surface.                                                                                              |
| EVM execution semantics                                                  | Opcodes behave per specification.                                                                                                                                               |

**Untrusted:**

| Entity                        | Rationale                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| Agent operators               | May run modified agent runtimes, attempt unauthorized decryption, exfiltrate ciphertext handles.        |
| Skill authors / publishers    | May register malicious skills, embed backdoors, submit sybil ratings.                                   |
| End users                     | May craft prompt injections, supply malformed encrypted inputs, attempt replay attacks.                 |
| Host chain RPC provider       | Sees all transaction calldata (encrypted payloads as raw bytes), can delay/reorder/censor transactions. |
| Other dapps on the same chain | May call Shield contracts directly, attempt reentrancy or griefing.                                     |
| Network-level observers       | Can correlate transaction metadata (sender, gas, timing) even though payloads are encrypted.            |

### 1.3 Assumptions

1. **CoFHE coprocessor honesty**: The FheOS Server and Threshold Network operate correctly under the M-of-N
   honest-majority assumption. If M or more key-holders collude, all confidentiality guarantees fail.
2. **Host chain finality**: Once a transaction is finalized on the host chain, it cannot be reverted. Pre-finality
   reorgs are addressed under cross-cutting threats (Section 4).
3. **EVM correctness**: Solidity semantics, ABI encoding, and opcode behavior are as specified.
4. **FHE.sol correctness**: The `FHE.asEuint256()` conversion, ciphertext storage, and homomorphic operations are
   implemented correctly in the Fhenix library.
5. **Cryptographic soundness**: The TFHE scheme underlying CoFHE provides IND-CPA security for the chosen parameter set.
6. **Block timestamp accuracy**: `block.timestamp` is within the EVM-allowed drift window (~15 seconds on Ethereum,
   variable on L2s).

---

## 2. System Decomposition

### 2.1 Data Flow Diagram (ASCII)

```
 +-----------------+          +---------------------+
 |   End User /    |  prompts |   OpenClaw Runtime  |
 |  Agent Operator |--------->|  (off-chain)        |
 +-----------------+          |                     |
        |                     |  +---------------+  |        +-------------------+
        |  EIP-712            |  | FHESkill      |  | HTTP   | External Skill    |
        |  permits            |  | Decorator     |--|------->| APIs (untrusted)  |
        |                     |  +---------------+  |        +-------------------+
        |                     |  +---------------+  |
        |                     |  | FHEAgent      |  |
        |                     |  | MemoryProvider|  |
        |                     |  +---------------+  |
        |                     |  +---------------+  |
        |                     |  | FHECredential |  |
        |                     |  | Vault         |  |
        |                     |  +---------------+  |
        |                     +--------+------------+
        |                              |
        |    signed txs (calldata      | JSON-RPC (eth_sendRawTransaction)
        |    contains inEuint256)      |
        |                              v
        |                     +---------------------+
        |                     |  Host Chain RPC     |
        |                     |  (untrusted relay)  |
        |                     +--------+------------+
        |                              |
        v                              v
 +--------------------------------------------------------------+
 |            Host EVM Chain (Sepolia / Arb / Base)              |
 |                                                                |
 |  +-------------+  +--------------+  +--------------+          |
 |  | AgentVault  |  | AgentMemory  |  | SkillRegistry|          |
 |  | .sol        |  | .sol         |  | .sol         |          |
 |  | L46-233     |  | L42-340      |  | L34-224      |          |
 |  +------+------+  +------+-------+  +------+-------+          |
 |         |                |                 |                   |
 |  +------+-------+       |                 |                   |
 |  | ActionSealer |       |                 |                   |
 |  | .sol         |       |                 |                   |
 |  | L9-323       |       |                 |                   |
 |  +--------------+       |                 |                   |
 |         |               |                 |                   |
 +---------|---------------|-----------------|-------------------+
           |               |                 |
           v               v                 v
 +--------------------------------------------------------------+
 |              CoFHE Coprocessor (Trust Boundary)               |
 |                                                                |
 |  +----------+  +------------------+  +---------------------+  |
 |  | FHE.sol  |  | Task Manager     |  | Threshold Network   |  |
 |  | (on-chain|  | (off-chain       |  | (off-chain MPC;     |  |
 |  | library) |  |  orchestrator)   |  |  M-of-N key-holders)|  |
 |  +----------+  +------------------+  +---------------------+  |
 |                                                                |
 |  +---------------------+                                      |
 |  | Ciphertext Registry |                                      |
 |  | (on-chain store)    |                                      |
 |  +---------------------+                                      |
 +--------------------------------------------------------------+
```

### 2.2 Data Flow Summary

| #    | Flow                              | Data                                                     | Trust Boundary Crossing     |
| ---- | --------------------------------- | -------------------------------------------------------- | --------------------------- |
| DF-1 | User -> OpenClaw                  | Plaintext prompts, commands                              | None (both untrusted)       |
| DF-2 | OpenClaw -> FHESkillDecorator     | Plaintext skill inputs                                   | None (same process)         |
| DF-3 | FHESkillDecorator -> Host Chain   | `inEuint256` calldata in signed tx                       | Client -> Chain (encrypted) |
| DF-4 | Host Chain -> CoFHE               | `euint256` handles for FHE ops                           | Contract -> Coprocessor     |
| DF-5 | CoFHE Threshold Network -> Client | Decrypted plaintext (after M-of-N)                       | Coprocessor -> Client       |
| DF-6 | OpenClaw -> External Skill APIs   | Skill-specific HTTP calls                                | Trusted -> Untrusted        |
| DF-7 | RPC Provider -> Host Chain        | Transaction relay                                        | Untrusted relay             |
| DF-8 | ActionSealer event log            | `encryptedPayload` bytes emitted in `ActionSealed` event | On-chain -> Public          |

---

## 3. STRIDE Matrix per Component

### 3.1 AgentVault

Source: `src/contracts/AgentVault.sol` (233 lines)

| Threat                          | Attack Scenario                                                                                                                                                                                                                      | Likelihood | Impact   | Current Mitigation                                                                                                                                          | Gap / Follow-up                                                                                                                                                                                                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S -- Spoofing**               | Attacker calls `storeCredential()` impersonating a legitimate agent. The handle is derived from `msg.sender` (L77), so the attacker becomes the owner of a new, separate credential -- not the victim's.                             | Low        | Low      | `msg.sender` binding on L77 prevents impersonation of existing credentials. Owner check on L106 for retrieval.                                              | No gap for credential storage. However, there is no on-chain registry of "legitimate agents" -- any address can store credentials. Consider allowlisting agent addresses if needed.                                                                                                               |
| **S -- Spoofing**               | Attacker calls `grantRetrievePermission()` for a handle they do not own, attempting to grant themselves access.                                                                                                                      | Low        | High     | Owner check on L157: `_credentialOwners[handle] != msg.sender` reverts with `NotCredentialOwner`.                                                           | Adequate.                                                                                                                                                                                                                                                                                         |
| **T -- Tampering**              | Attacker modifies the `inEuint256` calldata between the client and the chain (e.g., via a compromised RPC). The ciphertext would be replaced with attacker-controlled ciphertext.                                                    | Medium     | High     | Transaction is signed by the sender -- calldata tampering invalidates the signature.                                                                        | Adequate against calldata tampering. However, if the user's signing key is compromised, the attacker can submit arbitrary ciphertexts. This is a key-management concern, not a contract concern.                                                                                                  |
| **T -- Tampering**              | Attacker front-runs a `deleteCredential()` call with a `retrieveCredential()` call to exfiltrate the credential before deletion.                                                                                                     | Medium     | Medium   | Retrieval returns `euint256` (ciphertext), not plaintext. Front-running retrieval only yields a ciphertext handle that still requires threshold decryption. | Low residual risk. The attacker would still need M-of-N threshold cooperation to decrypt.                                                                                                                                                                                                         |
| **R -- Repudiation**            | Agent owner denies having stored or accessed a credential.                                                                                                                                                                           | Low        | Medium   | Events: `CredentialStored` (L91), `CredentialAccessed` (L114), `CredentialDeleted` (L133). All indexed by `agentId` and `handle`.                           | Events are adequate for audit trail. However, events are not signed by the caller -- they are emitted by the contract. A chain reorg could remove events. For high-assurance repudiation resistance, consider checkpointing event hashes.                                                         |
| **I -- Information Disclosure** | An observer reads the `_encryptedCredentials` mapping from chain state (via `eth_getStorageAt`) to recover plaintext.                                                                                                                | Low        | Critical | Values are `euint256` -- FHE ciphertext. Reading storage yields ciphertext, not plaintext.                                                                  | Adequate, assuming FHE.sol and CoFHE are correct.                                                                                                                                                                                                                                                 |
| **I -- Information Disclosure** | The `CredentialAccessed` event (L114) leaks the `handle`, `accessor`, and `timestamp`, revealing _who_ accessed _which_ credential and _when_, even though the credential value remains encrypted.                                   | High       | Medium   | No mitigation. Events are public by design.                                                                                                                 | **GAP**: Metadata leakage. An observer can build an access-pattern graph. Consider emitting only a hash of the handle, or using encrypted event fields (requires CoFHE support). M9.1 item: zero-knowledge audit trail.                                                                           |
| **I -- Information Disclosure** | The `_permissions` mapping is publicly readable via `hasRetrievePermission()` (L186). An observer can enumerate all grantees for a known handle.                                                                                     | High       | Low      | View function is public.                                                                                                                                    | **GAP**: Permission graph is public. Low impact because knowing _who has permission_ does not reveal _what the credential is_, but it reveals organizational structure.                                                                                                                           |
| **D -- Denial of Service**      | Attacker spams `storeCredential()` to bloat storage. Each call creates a new mapping entry.                                                                                                                                          | Medium     | Low      | No rate limiting. Gas cost is the only deterrent.                                                                                                           | Low risk on testnets. On mainnet, gas cost provides natural rate limiting. Consider a deposit/stake mechanism for production.                                                                                                                                                                     |
| **D -- Denial of Service**      | Attacker calls `grantRetrievePermission()` on their own credential to many addresses, bloating the `_permissions` mapping.                                                                                                           | Low        | Low      | Only the owner can grant permissions on their own credentials. Self-inflicted.                                                                              | Not a concern.                                                                                                                                                                                                                                                                                    |
| **E -- Elevation of Privilege** | Attacker exploits the lack of a "revoke all" function. After revoking individual permissions, a race condition could allow a previously-permitted address to call `retrieveCredential()` before the revocation transaction is mined. | Medium     | Medium   | Revocation is per-address per-handle (L170). Transaction ordering is non-deterministic.                                                                     | **GAP**: No batch revocation. A compromised grantee could front-run individual revocation transactions. Consider adding `revokeAllPermissions(handle)`.                                                                                                                                           |
| **E -- Elevation of Privilege** | Threshold value stored per-agent (L55) defaults to 1 (L84). An agent that never calls `updateThreshold()` operates with threshold=1, meaning a single approval suffices for any threshold-gated operation downstream.                | Medium     | High     | Default threshold is 1 (L84, L218).                                                                                                                         | **GAP**: The default threshold of 1 is insecure for production. The threshold value is stored but not enforced anywhere in AgentVault itself -- it is informational. If other contracts or off-chain systems rely on this value, the default of 1 is dangerous. M9.1: permit lifecycle hardening. |

### 3.2 AgentMemory

Source: `src/contracts/AgentMemory.sol` (340 lines)

| Threat                          | Attack Scenario                                                                                                                                                                                                                                | Likelihood | Impact   | Current Mitigation                                                                                                                                                                                                              | Gap / Follow-up                                                                                                                                                                                                                                                    |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **S -- Spoofing**               | Attacker calls `appendContext()` for an agent they do not own.                                                                                                                                                                                 | Low        | High     | Owner check on L128: `_agents[agentId].owner != msg.sender` reverts with `NotAgentOwner`.                                                                                                                                       | Adequate.                                                                                                                                                                                                                                                          |
| **S -- Spoofing**               | Attacker calls `initializeAgent()` and the generated `agentId` collides with an existing agent due to hash collision.                                                                                                                          | Negligible | Critical | Collision check on L80: `AgentAlreadyExists` revert. The ID space is 160 bits (address), making collision astronomically unlikely.                                                                                              | Adequate.                                                                                                                                                                                                                                                          |
| **T -- Tampering**              | Attacker replaces encrypted context chunks by calling `appendContext()` with attacker-controlled ciphertext.                                                                                                                                   | Low        | High     | Only the owner can append (L128).                                                                                                                                                                                               | Adequate. However, there is no mechanism to _remove_ or _overwrite_ individual context chunks. Once appended, a chunk is permanent unless a snapshot restore overwrites the entire context. This is a design decision, not a vulnerability.                        |
| **T -- Tampering**              | Attacker creates a snapshot of another agent's context and restores it to their own agent, poisoning their context with the victim's data.                                                                                                     | Low        | Medium   | `restoreFromSnapshot()` (L250) checks that `msg.sender` is the owner of the agent referenced in the snapshot (L259). Cross-agent restore is blocked.                                                                            | Adequate. Note: the check on L264 (`_snapshots[snapshotId].agentId != agentId`) is redundant with L256-259 but harmless.                                                                                                                                           |
| **R -- Repudiation**            | Agent owner denies having appended a specific context chunk.                                                                                                                                                                                   | Low        | Medium   | `ContextAppended` event (L137) with `agentId`, `owner`, `chunkIndex`, `timestamp`.                                                                                                                                              | Adequate.                                                                                                                                                                                                                                                          |
| **I -- Information Disclosure** | Observer reads `getContextSlice()` (L149) to access encrypted context chunks of any agent.                                                                                                                                                     | High       | Low      | The function is `view` and returns `euint256[]`. Any caller can read ciphertext handles, but decryption requires CoFHE threshold. **However**, the function has no access control -- any address can call it for any `agentId`. | **GAP**: `getContextSlice()` has no access control (L149). While it returns ciphertext, an attacker who obtains ciphertext handles may use them as inputs to other FHE operations (depending on CoFHE ACL). Consider restricting to owner or permitted addresses.  |
| **I -- Information Disclosure** | `getContextLength()` (L191) reveals the number of context chunks for any agent, leaking information about agent activity volume.                                                                                                               | High       | Low      | No access control on the view function.                                                                                                                                                                                         | **GAP**: Context length is metadata leakage. An observer can track agent activity over time. Low severity but worth noting.                                                                                                                                        |
| **I -- Information Disclosure** | `computeOnContext()` (L296) is a `view` function with no access control. Any caller can trigger FHE computation on any agent's context.                                                                                                        | High       | Medium   | Currently a demo placeholder (L319-331) that returns the first chunk.                                                                                                                                                           | **GAP**: No access control on `computeOnContext()`. In production, this must be restricted to authorized callers, or the CoFHE coprocessor must enforce ACL on the returned ciphertext handle.                                                                     |
| **D -- Denial of Service**      | Attacker who owns an agent calls `appendContext()` in a loop, growing the `context` array unboundedly. Subsequent `snapshotContext()` calls iterate the entire array (L231-234), consuming O(n) gas and potentially exceeding block gas limit. | Medium     | Medium   | No cap on context length.                                                                                                                                                                                                       | **GAP**: Unbounded array growth. `snapshotContext()` and `restoreFromSnapshot()` are O(n) and will eventually hit the block gas limit. Consider adding a maximum context length or paginated snapshot/restore.                                                     |
| **D -- Denial of Service**      | Attacker calls `snapshotContext()` repeatedly, creating many snapshots that each copy the entire context array. Storage costs grow quadratically.                                                                                              | Medium     | Low      | Only the owner can snapshot (L218). Self-inflicted storage cost.                                                                                                                                                                | Low risk -- owner bears gas cost.                                                                                                                                                                                                                                  |
| **E -- Elevation of Privilege** | Attacker exploits `computeOnContext()` to perform unauthorized FHE computations on another agent's encrypted data, potentially learning information through the result.                                                                        | Medium     | High     | Demo placeholder -- returns first chunk, not a real computation.                                                                                                                                                                | **GAP**: When real FHE operations are implemented, `computeOnContext()` must enforce access control. An attacker performing `FHE.add()` on two encrypted values and comparing the ciphertext handle to known values could leak information in certain FHE schemes. |

### 3.3 SkillRegistry

Source: `src/contracts/SkillRegistry.sol` (224 lines)

| Threat                          | Attack Scenario                                                                                                                                   | Likelihood | Impact   | Current Mitigation                                                                                                                                        | Gap / Follow-up                                                                                                                                                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **S -- Spoofing**               | Attacker registers a skill impersonating a trusted publisher. The skill appears to come from a reputable source.                                  | Medium     | High     | `registerSkill()` (L71) records `msg.sender` as publisher. There is no identity verification beyond the Ethereum address.                                 | **GAP**: No publisher identity verification. A well-known publisher's address can be impersonated if users identify publishers by name rather than address. Consider a publisher registry with ENS or attestation binding.                                                                 |
| **S -- Spoofing**               | Attacker calls `verifySkill()` on their own malicious skill, self-certifying it as "verified".                                                    | High       | Critical | `verifySkill()` (L122) only requires `msg.sender == publisher`. The publisher can verify their own skill. There is no independent verification authority. | **GAP (CRITICAL)**: Self-verification is meaningless from a security perspective. The publisher who registered the skill can verify it themselves (L129). This provides zero assurance to users. Verification should require an independent auditor role or DAO vote.                      |
| **T -- Tampering**              | Attacker modifies skill code after registration. The `codeHash` (L81) is set at registration time but never re-verified at execution time.        | High       | Critical | `codeHash` is stored (L81) but `executeSkill()` (L202) does not check that the currently-deployed skill code matches `codeHash`.                          | **GAP (CRITICAL)**: No runtime code hash verification. The `codeHash` is stored for reference but never enforced. A publisher could register a skill with a benign code hash, get it "verified", then deploy different code. `executeSkill()` must verify the code hash at execution time. |
| **T -- Tampering**              | Attacker submits a sybil rating to inflate or deflate a skill's reputation. Multiple addresses controlled by the same entity each rate the skill. | High       | Medium   | `_hasRated[skillId][msg.sender]` (L164) prevents double-rating from the same address.                                                                     | **GAP**: Sybil resistance is address-level only. An attacker with multiple addresses can submit multiple ratings. Consider requiring a minimum stake, proof-of-humanity, or reputation-weighted ratings.                                                                                   |
| **T -- Tampering**              | Attacker submits an encrypted rating outside the valid range (e.g., `FHE.asEuint256(999999)` instead of 1-5).                                     | High       | Medium   | `rateSkill()` (L157) accepts any `inEuint256` without range validation. The comment on L155 says "encrypted rating (1-5)" but this is not enforced.       | **GAP**: No range validation on encrypted ratings. FHE range checks (e.g., `FHE.lte(rating, FHE.asEuint256(5))`) should be enforced on-chain.                                                                                                                                              |
| **R -- Repudiation**            | Publisher denies having registered a malicious skill.                                                                                             | Low        | Medium   | `SkillRegistered` event (L89) with `skillId`, `publisher`, `timestamp`.                                                                                   | Adequate. Event log provides attribution.                                                                                                                                                                                                                                                  |
| **I -- Information Disclosure** | Observer reads `getSkill()` (L101) to see publisher address, verification status, and rating count for any skill.                                 | High       | Low      | View function is public. Rating count is plaintext (L173: `_skills[skillId].ratingCount++`).                                                              | **GAP**: `ratingCount` is plaintext (L173), leaking the number of raters. The rating _sum_ is stored as `euint256` (L41) but the count is not encrypted. This partially undermines the privacy goal of encrypted ratings.                                                                  |
| **I -- Information Disclosure** | `_hasRated` mapping (L186) is queryable, revealing which addresses rated which skills.                                                            | High       | Low      | `hasUserRated()` is public.                                                                                                                               | **GAP**: Rating participation is public. An observer can build a graph of who rated what, even though individual rating values are encrypted.                                                                                                                                              |
| **D -- Denial of Service**      | Attacker registers thousands of skills to bloat the `_publisherSkills` array (L87) and the `_skills` mapping.                                     | Medium     | Low      | Gas cost is the only deterrent.                                                                                                                           | Low risk. `getPublisherSkills()` (L110) returns the full array, which could become expensive to read. Consider pagination.                                                                                                                                                                 |
| **D -- Denial of Service**      | Attacker calls `executeSkill()` with a very large `inEuint256` payload to consume gas.                                                            | Low        | Low      | FHE conversion (`FHE.asEuint256`) has fixed cost regardless of input value.                                                                               | Adequate.                                                                                                                                                                                                                                                                                  |
| **E -- Elevation of Privilege** | Attacker calls `executeSkill()` on a verified skill without any additional authorization. Any address can execute any verified skill.             | High       | High     | `executeSkill()` (L202) checks only that the skill exists and is verified. There is no caller authorization.                                              | **GAP**: No execution authorization. Any address can execute any verified skill. Consider requiring a permit or caller allowlist for skill execution.                                                                                                                                      |

### 3.4 ActionSealer

Source: `src/contracts/ActionSealer.sol` (323 lines)

| Threat                          | Attack Scenario                                                                                                                                                                     | Likelihood | Impact   | Current Mitigation                                                                                                                                                                                     | Gap / Follow-up                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S -- Spoofing**               | Attacker calls `approveRelease()` to approve an action they should not be able to approve.                                                                                          | High       | Critical | **No approver authorization**. `approveRelease()` (L181) allows ANY address to approve ANY sealed action. The only check is that the action exists, is sealed, and the caller hasn't already approved. | **GAP (CRITICAL)**: No approver allowlist. Any address can approve any action. An attacker can create N sybil addresses and approve their own action to meet the threshold. `registerReleaseCondition()` must also register a set of authorized approvers.                                                                                          |
| **S -- Spoofing**               | Attacker calls `releaseAction()` for an action they do not own.                                                                                                                     | Medium     | High     | `releaseAction()` (L243) does not check `msg.sender`. Any address can trigger release if conditions are met.                                                                                           | **GAP**: No caller restriction on `releaseAction()`. While the threshold check provides some protection, combined with the approver gap above, any attacker can both approve and release.                                                                                                                                                           |
| **T -- Tampering**              | Attacker modifies the `encryptedPayload` after sealing.                                                                                                                             | Low        | Critical | The payload is stored at seal time (L105) and never modified. There is no function to update it.                                                                                                       | Adequate. Immutable after sealing.                                                                                                                                                                                                                                                                                                                  |
| **T -- Tampering**              | Attacker front-runs a `cancelAction()` with a `releaseAction()`, releasing the action before the owner can cancel it.                                                               | Medium     | High     | Both functions check `status == Sealed` (L188, L299). Transaction ordering determines which executes first.                                                                                            | **GAP**: Race condition between cancel and release. If the threshold is already met, an attacker can call `releaseAction()` in the same block as the owner's `cancelAction()`. Consider adding a time delay between threshold-met and release-eligible, or requiring the owner to call release.                                                     |
| **R -- Repudiation**            | Approver denies having approved an action release.                                                                                                                                  | Low        | Medium   | `ReleaseApproval` event (L203) with `actionId`, `approver`, `approvalCount`, `timestamp`.                                                                                                              | Adequate.                                                                                                                                                                                                                                                                                                                                           |
| **R -- Repudiation**            | Owner denies having sealed an action.                                                                                                                                               | Low        | Medium   | `ActionSealed` event (L109) includes `encryptedPayload` in the event data.                                                                                                                             | **GAP**: The `ActionSealed` event (L109) emits the `encryptedPayload` as a public event parameter. This is both an information disclosure issue (see below) and a repudiation aid.                                                                                                                                                                  |
| **I -- Information Disclosure** | The `ActionSealed` event (L109) emits the `encryptedPayload` as a public event parameter (`bytes encryptedPayload`). Any observer can read the encrypted payload from event logs.   | High       | High     | The payload is "encrypted" but stored as raw `bytes`, not as an FHE `euint256`. The encryption is application-level, not CoFHE-level.                                                                  | **GAP (CRITICAL)**: ActionSealer does NOT use FHE for the payload. The `encryptedPayload` is raw bytes (L78, L93) with no FHE type. The encryption quality depends entirely on the caller. If the caller passes plaintext or weakly encrypted data, it is publicly visible in event logs. The `ActionReleased` event (L274) also emits the payload. |
| **I -- Information Disclosure** | `getAction()` (L121) reveals the action owner, status, and creation timestamp for any action.                                                                                       | High       | Low      | Public view function.                                                                                                                                                                                  | Metadata leakage -- an observer can track action lifecycle.                                                                                                                                                                                                                                                                                         |
| **I -- Information Disclosure** | `getReleaseCondition()` (L165) reveals threshold, timeout, and active status for any action.                                                                                        | High       | Medium   | Public view function.                                                                                                                                                                                  | **GAP**: Revealing the threshold tells an attacker exactly how many sybil approvals they need.                                                                                                                                                                                                                                                      |
| **D -- Denial of Service**      | Attacker creates many sealed actions without ever setting release conditions, polluting state.                                                                                      | Medium     | Low      | Gas cost is the only deterrent.                                                                                                                                                                        | Low risk.                                                                                                                                                                                                                                                                                                                                           |
| **D -- Denial of Service**      | Attacker approves an action with many sybil addresses, attempting to increase `_approvalCounts` beyond the threshold. This does not cause a revert but wastes gas for the attacker. | Low        | Low      | `AlreadyApproved` check per address (L192).                                                                                                                                                            | Adequate. Extra approvals beyond threshold are harmless.                                                                                                                                                                                                                                                                                            |
| **E -- Elevation of Privilege** | Attacker sets `threshold = 0` in `registerReleaseCondition()` and immediately releases the action.                                                                                  | High       | Critical | `registerReleaseCondition()` (L135) accepts `threshold` as `uint8` with no minimum check. A threshold of 0 means zero approvals are required.                                                          | **GAP (CRITICAL)**: No minimum threshold enforcement. `threshold = 0` allows immediate release by anyone. Must enforce `threshold >= 1`.                                                                                                                                                                                                            |
| **E -- Elevation of Privilege** | Attacker sets `timeout = 0` (no expiry) combined with `threshold = 1`, then approves and releases immediately.                                                                      | Medium     | Medium   | `timeout = 0` is documented as "no expiry" (L260-262). Combined with threshold=1, the action can be released instantly.                                                                                | Low gap -- this is by design, but should be documented as a risk.                                                                                                                                                                                                                                                                                   |

### 3.5 CoFHE Boundary

This section covers threats at the trust boundary between Shield contracts and the Fhenix CoFHE coprocessor.

| Threat                          | Attack Scenario                                                                                                                                                                         | Likelihood | Impact   | Current Mitigation                                                                                                           | Gap / Follow-up                                                                                                                                                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S -- Spoofing**               | Attacker impersonates the CoFHE Task Manager, submitting fake decryption results to the threshold network.                                                                              | Low        | Critical | CoFHE uses authenticated channels between components.                                                                        | Outside our control surface. Depends on CoFHE security. Document as an assumption.                                                                                                                                                  |
| **S -- Spoofing**               | Attacker deploys a fake `FHE.sol` library that returns predictable ciphertext, allowing them to decrypt by reversing the "encryption".                                                  | Low        | Critical | Contract imports `@fhenixprotocol/contracts/FHE.sol` at compile time. The library is part of the deployed bytecode.          | Adequate at deploy time. Verify the compiler output matches expected bytecode hash. Risk if using upgradeable proxies (not currently the case).                                                                                     |
| **T -- Tampering**              | Attacker modifies ciphertext handles in the Ciphertext Registry to point to different encrypted values.                                                                                 | Low        | Critical | Ciphertext Registry is on-chain and immutable (write-once per handle).                                                       | Outside our control surface. Depends on CoFHE Registry contract.                                                                                                                                                                    |
| **T -- Tampering**              | A compromised threshold network node submits an incorrect partial decryption share, causing decryption to produce wrong plaintext.                                                      | Low        | High     | M-of-N scheme: a single incorrect share can be detected and excluded if the scheme supports verifiable secret sharing (VSS). | **GAP**: We do not verify whether CoFHE's threshold scheme uses VSS. If it does not, a single malicious node could corrupt decryption. Document this dependency.                                                                    |
| **R -- Repudiation**            | Threshold network nodes deny having participated in a decryption.                                                                                                                       | Low        | Medium   | CoFHE logs decryption requests and participation.                                                                            | Outside our control surface.                                                                                                                                                                                                        |
| **I -- Information Disclosure** | Threshold network nodes observe plaintext during the decryption process. Each node sees its partial share, and M colluding nodes can reconstruct plaintext.                             | Medium     | Critical | M-of-N threshold: fewer than M nodes cannot reconstruct.                                                                     | This is the fundamental trust assumption. If M or more nodes collude, all confidentiality is lost. M9.1 item: threshold network M-of-N analysis.                                                                                    |
| **I -- Information Disclosure** | CoFHE Task Manager logs or caches plaintext results after decryption.                                                                                                                   | Low        | Critical | Depends on CoFHE implementation.                                                                                             | **GAP**: We have no assurance that CoFHE does not log plaintext. Require documentation or attestation from Fhenix.                                                                                                                  |
| **D -- Denial of Service**      | Threshold network nodes go offline, preventing decryption. Fewer than M nodes available means no decryption is possible.                                                                | Medium     | High     | CoFHE operates its own node set.                                                                                             | **GAP**: We have no SLA from the threshold network. On testnets, availability is best-effort. For production, require an SLA or fallback mechanism. M9.1: threshold network analysis.                                               |
| **D -- Denial of Service**      | Attacker floods the CoFHE Task Manager with decryption requests, saturating the threshold network.                                                                                      | Medium     | Medium   | CoFHE may have rate limiting.                                                                                                | **GAP**: No documentation on CoFHE rate limiting. If Shield contracts emit many decryption requests, they could be throttled or blocked.                                                                                            |
| **E -- Elevation of Privilege** | Attacker obtains a ciphertext handle from a public view function (e.g., `getContextSlice()`) and submits it directly to CoFHE for decryption, bypassing Shield contract access control. | High       | Critical | Depends on CoFHE ACL: does CoFHE enforce that only the original contract can request decryption of its ciphertexts?          | **GAP (CRITICAL)**: If CoFHE does not enforce per-contract ACL on decryption requests, any party with a ciphertext handle can request decryption. This would bypass all Shield access control. Verify CoFHE's access control model. |

---

## 4. Cross-Cutting Threats

These threats span multiple components and cannot be mitigated within a single contract.

### 4.1 Prompt Injection from User Content in OpenClaw

**Threat**: Malicious content embedded in user prompts or website content processed by the OpenClaw runtime is
interpreted as agent instructions.

**Attack vector**: DF-1 (User -> OpenClaw). The FHE layer encrypts data _after_ the OpenClaw runtime processes it. If
injection occurs before encryption, the encrypted payload contains the injected command.

**Likelihood**: High (91% success rate cited in SPEC.md Section 1).

**Impact**: High. Agent performs unauthorized actions with its credentials.

**Current mitigation**: FHESkillDecorator encrypts skill inputs before processing, which prevents skills from reading
injected content in plaintext. However, the OpenClaw runtime itself processes the prompt in plaintext before the FHE
layer is involved.

**Gap**: The FHE layer does not protect against injection that occurs _before_ encryption. The OpenClaw runtime's prompt
processing happens in plaintext. Mitigation requires input sanitization at the OpenClaw layer, which is outside
FHE-Agent Shield's scope. Document this as a boundary limitation.

### 4.2 Malicious Skill at Runtime (ClawHavoc Supply Chain)

**Threat**: A malicious skill registered in SkillRegistry executes harmful code when invoked through FHESkillDecorator.

**Attack vector**: DF-6 (OpenClaw -> External Skill APIs). The skill's off-chain code makes HTTP calls to
attacker-controlled endpoints.

**Likelihood**: High (1,184+ malicious skills cited in SPEC.md Section 1).

**Impact**: Critical. Data exfiltration, credential theft (if the skill has been granted vault access), unauthorized
actions.

**Current mitigation**: SkillRegistry stores `codeHash` and `metadataHash` at registration time. FHESkillDecorator wraps
execution with encrypted I/O.

**Gap**: (1) `codeHash` is not verified at execution time (see Section 3.3, Tampering). (2) Self-verification means a
malicious publisher can verify their own skill. (3) FHE protects data _in transit to the chain_, but the off-chain skill
code runs in plaintext. A skill with vault access can decrypt credentials via the FHECredentialVault provider and
exfiltrate them via HTTP. Mitigation requires sandboxed skill execution (WASM, TEE) or a skill attestation scheme.

### 4.3 Replay Across Chains

**Threat**: A valid EIP-712 permit signed for one host chain (e.g., Ethereum Sepolia) is replayed on another host chain
(e.g., Base Sepolia) where the same contracts are deployed at the same addresses.

**Attack vector**: The EIP-712 domain separator includes `chainId`, but if the contracts are deployed at the same
addresses on multiple chains (common with CREATE2), the domain separator differs only by `chainId`. If the permit
validation does not check `chainId`, cross-chain replay is possible.

**Likelihood**: Medium. Contracts may be deployed at the same addresses on multiple testnets.

**Impact**: High. Unauthorized access to credentials or actions on a different chain.

**Current mitigation**: EIP-712 domain includes `chainId` (per `docs/security-model.md`). However, the current contracts
(AgentVault, AgentMemory, etc.) do not implement on-chain EIP-712 permit validation -- permits are described in the
security model and SDK but not enforced in the Solidity code reviewed.

**Gap (CRITICAL)**: The four Shield contracts do not implement EIP-712 permit validation on-chain. Access control relies
on `msg.sender` checks only. The EIP-712 permit system described in `docs/security-model.md` is aspirational, not
implemented. This is the highest-priority gap. Until permits are enforced on-chain, cross-chain replay is moot -- but
the access control model is weaker than documented.

### 4.4 Key Rotation Gaps

**Threat**: Long-lived FHE keys used by the CoFHE threshold network are compromised (through side-channel attacks,
insider threat, or cryptanalytic advances). All data encrypted under the compromised key is retroactively decryptable.

**Likelihood**: Low (short-term), Medium (long-term).

**Impact**: Critical. All historical credentials and context are exposed.

**Current mitigation**: None in the Shield contracts. Key rotation is a CoFHE responsibility.

**Gap**: No `rotateCredential()` function exists on AgentVault. M9.1 roadmap item calls for ciphertext rotation for
long-lived credentials. Until implemented, a key compromise affects all historical data. Additionally, there is no
mechanism to re-encrypt existing ciphertexts under a new key without decrypting them first (a fundamental FHE limitation
that requires threshold re-encryption).

### 4.5 Threshold Network Collusion (M-of-N Compromise)

**Threat**: M or more threshold network key-holders collude to decrypt all ciphertexts without authorization.

**Likelihood**: Low (depends on Fhenix's node operator diversity and incentive structure).

**Impact**: Critical. Complete confidentiality breach.

**Current mitigation**: Trust assumption (Section 1.3). CoFHE selects node operators.

**Gap**: We have no visibility into the threshold network's operator set, geographic distribution, legal jurisdiction
diversity, or collusion resistance mechanisms. M9.1 roadmap item: threshold network M-of-N analysis. For production,
require attestation from Fhenix on operator diversity and slashing conditions.

### 4.6 Host Chain Reorg / MEV

**Threat**: A chain reorganization reverts a transaction that stored a credential, appended context, or approved an
action release. The user believes the operation succeeded, but it was reverted.

**Attack vector**: Short reorgs on Ethereum Sepolia (possible), Arbitrum Sepolia (rare, single sequencer), Base Sepolia
(rare, single sequencer).

**Likelihood**: Low on L2s, Medium on L1.

**Impact**: Medium. Data loss or inconsistent state.

**Current mitigation**: Standard Ethereum finality assumptions.

**Gap**: The SDK should wait for sufficient confirmations before treating an operation as final. For ActionSealer, a
reorg that reverts approval transactions could prevent a legitimate release. No specific mitigation in the contracts.

**MEV-specific threat**: A searcher observes a `storeCredential()` transaction in the mempool. While the calldata is
encrypted (`inEuint256`), the transaction metadata (sender, contract, function selector, gas) reveals that a credential
is being stored. A sophisticated attacker could front-run with a `grantRetrievePermission()` call if they can predict
the handle -- but handles are derived from `msg.sender` and `_credentialCounter`, and the counter is private, making
prediction difficult.

### 4.7 Clock Skew Between Permit Expiration and Block Timestamp

**Threat**: A permit with `expiresAt` set to a near-future timestamp is used in a transaction that is included in a
block with a `block.timestamp` that exceeds the expiration, causing an unexpected revert. Conversely, a permit that
should have expired is accepted because `block.timestamp` is within the allowed drift window.

**Likelihood**: Medium. Block timestamps can drift up to 15 seconds on Ethereum, and L2 sequencers may have different
timestamp semantics.

**Impact**: Low. Operational inconvenience (false rejections) or minor security weakening (false acceptances within
drift window).

**Current mitigation**: Not applicable -- permits are not yet enforced on-chain (see Section 4.3 gap).

**Gap**: When permits are implemented on-chain, use a grace period (e.g., 60 seconds) rather than exact timestamp
comparison. Document the expected clock skew per host chain.

### 4.8 RPC Provider Observability

**Threat**: The host chain RPC provider (e.g., Infura, Alchemy, or a self-hosted node) observes all transaction
calldata, including encrypted payloads as raw bytes. While they cannot decrypt FHE ciphertexts, they can perform traffic
analysis.

**Likelihood**: High (RPC providers see all traffic by design).

**Impact**: Low (confidentiality preserved), Medium (metadata leakage).

**Observable metadata**:

- Which address stores/retrieves credentials and when.
- Which address appends context and how often.
- Ciphertext sizes (correlatable to plaintext lengths in some FHE schemes).
- Transaction timing (correlatable to real-world events).
- Gas consumption (may reveal computational complexity).

**Current mitigation**: None.

**Gap**: Traffic analysis resistance requires mixing (batched transactions, fixed-size ciphertexts, decoy transactions).
This is a known limitation of any blockchain-based system and is not specific to FHE-Agent Shield. Document as a known
limitation. Consider fixed-size ciphertext padding for future versions.

---

## 5. Prioritized Mitigation Backlog

### P0 -- Critical (Must fix before any production deployment)

| #    | Threat                                    | Affected Component                | Mitigation                                                                                                                                                        | Roadmap Reference                    |
| ---- | ----------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| P0-1 | Unrestricted approver set in ActionSealer | ActionSealer L181                 | Add an `authorizedApprovers` mapping set by the action owner during `registerReleaseCondition()`. Only authorized approvers can call `approveRelease()`.          | --                                   |
| P0-2 | Zero threshold allowed in ActionSealer    | ActionSealer L135                 | Enforce `require(threshold >= 1)` in `registerReleaseCondition()`.                                                                                                | --                                   |
| P0-3 | Self-verification in SkillRegistry        | SkillRegistry L122                | Introduce an independent verifier role (separate from publisher). Verification requires a transaction from an address in a `verifiers` set, not the publisher.    | M9.1: formal threat model            |
| P0-4 | No runtime code hash verification         | SkillRegistry L202                | `executeSkill()` must verify that the skill's deployed bytecode hash matches the stored `codeHash` before execution.                                              | --                                   |
| P0-5 | CoFHE ciphertext handle ACL bypass        | CoFHE boundary                    | Verify with Fhenix that CoFHE enforces per-contract ACL on decryption requests. If not, implement a wrapper that checks authorization before forwarding to CoFHE. | M9.1: migrate to `@cofhe/sdk@^0.4.0` |
| P0-6 | ActionSealer payload is not FHE-encrypted | ActionSealer L78, L93, L109, L274 | Replace raw `bytes encryptedPayload` with `euint256` or an FHE-typed field. Do not emit plaintext-capable payloads in events.                                     | --                                   |
| P0-7 | EIP-712 permits not enforced on-chain     | All contracts                     | Implement on-chain EIP-712 permit validation as described in `docs/security-model.md`. Without this, the documented security model is aspirational.               | M9.1: permit lifecycle hardening     |

### P1 -- High (Should fix before testnet goes public)

| #     | Threat                                         | Affected Component      | Mitigation                                                                                                   | Roadmap Reference                       |
| ----- | ---------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| P1-1  | No access control on `getContextSlice()`       | AgentMemory L149        | Restrict to owner or permitted addresses.                                                                    | --                                      |
| P1-2  | No access control on `computeOnContext()`      | AgentMemory L296        | Restrict to owner or permitted addresses.                                                                    | --                                      |
| P1-3  | No range validation on encrypted ratings       | SkillRegistry L157      | Add FHE range check: `FHE.lte(rating, FHE.asEuint256(5))`.                                                   | --                                      |
| P1-4  | No execution authorization on `executeSkill()` | SkillRegistry L202      | Require a valid permit or caller allowlist for skill execution.                                              | M9.1: access-control matrix             |
| P1-5  | Race condition: cancel vs. release             | ActionSealer L243, L287 | Add a time delay between threshold-met and release-eligible, or require the action owner to trigger release. | --                                      |
| P1-6  | No batch revocation in AgentVault              | AgentVault L170         | Add `revokeAllPermissions(bytes32 handle)` to revoke all grantees atomically.                                | --                                      |
| P1-7  | Threshold default of 1 in AgentVault           | AgentVault L84          | Either remove the default (require explicit `updateThreshold()` before first use) or set a higher default.   | M9.1: permit lifecycle hardening        |
| P1-8  | Metadata leakage via events                    | AgentVault L91, L114    | Evaluate emitting hashed handles in events. For ActionSealer, stop emitting payloads in events.              | M9.1: zero-knowledge audit trail        |
| P1-9  | Unbounded context array in AgentMemory         | AgentMemory L133        | Add a configurable maximum context length. Fail `appendContext()` when limit reached.                        | --                                      |
| P1-10 | Threshold network SLA                          | CoFHE boundary          | Obtain SLA documentation from Fhenix. Implement fallback timeout behavior in SDKs.                           | M9.1: threshold network M-of-N analysis |

### P2 -- Medium (Address in M9 or later milestones)

| #     | Threat                               | Affected Component       | Mitigation                                                                                         | Roadmap Reference                |
| ----- | ------------------------------------ | ------------------------ | -------------------------------------------------------------------------------------------------- | -------------------------------- |
| P2-1  | Sybil ratings                        | SkillRegistry L164       | Implement reputation-weighted or stake-weighted ratings.                                           | --                               |
| P2-2  | Rating count plaintext leakage       | SkillRegistry L173       | Encrypt `ratingCount` as `euint256`.                                                               | --                               |
| P2-3  | Permission graph public              | AgentVault L186          | Evaluate encrypting permission state. May require CoFHE-level ACL on view functions.               | --                               |
| P2-4  | Context length metadata leakage      | AgentMemory L191         | Restrict `getContextLength()` to owner.                                                            | --                               |
| P2-5  | Ciphertext rotation                  | AgentVault               | Implement `rotateCredential()` with threshold re-encryption.                                       | M9.1: ciphertext rotation        |
| P2-6  | VSS verification for CoFHE threshold | CoFHE boundary           | Document whether CoFHE uses verifiable secret sharing. Escalate to P1 if it does not.              | M9.1: threshold network analysis |
| P2-7  | RPC traffic analysis                 | Cross-cutting            | Document as known limitation. Consider fixed-size ciphertext padding.                              | --                               |
| P2-8  | Key rotation mechanism               | CoFHE boundary           | Coordinate with Fhenix on key rotation schedule and re-encryption support.                         | M9.1: ciphertext rotation        |
| P2-9  | Prompt injection pre-encryption      | Cross-cutting (OpenClaw) | Document as out of scope. Recommend OpenClaw-layer sanitization.                                   | --                               |
| P2-10 | Weak randomness for ID generation    | All contracts            | Accepted risk (Aderyn H-1). IDs are non-security-critical. For production, evaluate Chainlink VRF. | --                               |

---

## 6. References

### 6.1 Source Files Examined

| File                              | Lines | Key Findings                                                                                                                                                                                                  |
| --------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/contracts/AgentVault.sol`    | 1-233 | `msg.sender` ownership (L77, L106, L124, L157, L170). Default threshold of 1 (L84). No on-chain permit validation. Events leak access metadata (L91, L114).                                                   |
| `src/contracts/AgentMemory.sol`   | 1-340 | Owner-only writes (L128, L218, L259). Unrestricted `getContextSlice()` (L149) and `computeOnContext()` (L296). Unbounded context array (L133). Demo placeholder computation (L319-331).                       |
| `src/contracts/SkillRegistry.sol` | 1-224 | Self-verification (L122-137). No runtime code hash check in `executeSkill()` (L202). Unencrypted `ratingCount` (L173). No range validation on ratings (L157). Unrestricted execution (L202).                  |
| `src/contracts/ActionSealer.sol`  | 1-323 | Unrestricted `approveRelease()` (L181). No minimum threshold (L135). Raw `bytes` payload, not FHE-typed (L78, L93). Payload emitted in events (L109, L274). Race condition cancel/release (L243 vs L287).     |
| `docs/security-model.md`          | 1-783 | Documents EIP-712 permits, threshold decryption, access control layers. Permit system described but not enforced on-chain in contracts. Aderyn H-1 (weak randomness) accepted.                                |
| `SPEC.md`                         | 1-461 | Architecture overview, component descriptions, design decisions. CoFHE coprocessor model, BFV/CKKS scheme selection. OpenClaw integration pattern (decorator/wrapper).                                        |
| `ROADMAP.md`                      | 1-430 | M9.1 items referenced throughout this document: threat model, permit hardening, ciphertext rotation, threshold network analysis, CoFHE SDK migration, zero-knowledge audit trail, plaintext-fallback cleanup. |

### 6.2 External References

- STRIDE methodology: Microsoft SDL Threat Modeling Tool documentation.
- EIP-712: Ethereum Improvement Proposal 712 -- Typed Structured Data Hashing and Signing.
- Fhenix CoFHE: `https://cofhe-docs.fhenix.zone` -- coprocessor architecture, threshold network, FHE.sol API.
- TFHE: Chillotti et al., "TFHE: Fast Fully Homomorphic Encryption over the Torus" (2016).
- OpenClaw security analysis: Referenced in SPEC.md, Section 1 (91% prompt injection success rate, 1,184+ malicious
  skills).

### 6.3 Threat Count Summary

| Category                     | Count  |
| ---------------------------- | ------ |
| AgentVault STRIDE threats    | 11     |
| AgentMemory STRIDE threats   | 10     |
| SkillRegistry STRIDE threats | 11     |
| ActionSealer STRIDE threats  | 12     |
| CoFHE boundary threats       | 10     |
| Cross-cutting threats        | 8      |
| **Total threats enumerated** | **62** |
| Critical gaps (P0)           | 7      |
| High gaps (P1)               | 10     |
| Medium gaps (P2)             | 10     |

---

_This document should be reviewed and updated after each milestone. Gaps marked P0 must be resolved before any
deployment beyond private testnets._
