# FHE-Agent Shield — Roadmap

> **Timeline: 20-day Buildathon | Goal: Production-ready FHE privacy layer for AI agents**

---

## Overview

```
Buildathon Timeline (March 20 - June 5, 2026)

Week 1: Foundation          Week 2: Core Contracts         Week 3: Advanced + Integration
┌─────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│ Mar 20-21: Setup    │────▶│ Mar 24-28: AgentVault    │────▶│ Mar 31 - Apr 4: OpenClaw│
│ Mar 22-23: TDD Spec │     │ + AgentMemory            │     │ Integration             │
└─────────────────────┘     └─────────────────────────┘     └─────────────────────────┘
                                                                          │
Week 4: Demo + Polish              Week 5-8: Marathon                     │
┌─────────────────────────┐     ┌─────────────────────────────────────────┐
│ Apr 7-11: Demo Ready    │────▶│ Apr 15 - May 8: Production Hardening   │──▶ EVAL
│ Apr 14-18: Documentation│     │ + Security Audit + Mainnet Prep         │
└─────────────────────────┘     └─────────────────────────────────────────┘
```

---

## Milestone Breakdown

### 🚀 M1: Foundation (Days 1-2) — *March 20-21*

**Goal:** Project scaffold with working test environment

| Task | Owner | Dependencies | Deliverable |
|------|-------|--------------|-------------|
| Clone cofhe-hardhat-starter | Agent | None | Starter project |
| Configure project structure | Agent | None | Directory layout |
| Install dependencies (pnpm, hardhat, cofhe plugins) | Agent | Starter clone | Lockfile |
| Verify mock contracts work | Agent | Dependencies | `pnpm test` passes |
| Configure TypeScript + linter | Agent | Starter clone | tsconfig.json |
| Create mock FHE implementation | Agent | None | `contracts/mocks/MockFHE.sol` |

**Definition of Done:**
- [ ] `pnpm test` runs without errors
- [ ] Can deploy mock contracts locally
- [ ] TypeScript compilation clean

---

### 📋 M2: TDD Test Specifications (Days 3-4) — *March 22-23*

**Goal:** Define all test cases BEFORE writing implementation

| Task | Owner | Dependencies | Deliverable |
|------|-------|--------------|-------------|
| Write AgentVault test specs | Agent | M1 | `test/AgentVault.test.ts` (empty skeletons) |
| Write AgentMemory test specs | Agent | M1 | `test/AgentMemory.test.ts` (empty skeletons) |
| Write SkillRegistry test specs | Agent | M1 | `test/SkillRegistry.test.ts` (empty skeletons) |
| Write ActionSealer test specs | Agent | M1 | `test/ActionSealer.test.ts` (empty skeletons) |
| Review test coverage completeness | Oracle | All test specs | Coverage report |

**Test Spec Template:**
```typescript
describe('ContractName', () => {
  describe('functionName', () => {
    it('should [expected behavior] when [condition]');
    it('should revert with [error] when [invalid condition]');
    it('should emit [event] after [action]');
  });
});
```

**Definition of Done:**
- [ ] All happy paths defined
- [ ] All edge cases defined
- [ ] All revert conditions defined
- [ ] All event emissions defined

---

### 🔐 M3: Core Contracts - AgentVault + AgentMemory (Days 5-9) — *March 24-28*

**Goal:** Encrypted credential storage and agent memory

#### Phase 3a: AgentVault (Days 5-6)

| Task | Owner | Dependencies | Deliverable |
|------|-------|--------------|-------------|
| Implement `storeCredential()` | Solidity Agent | M2 tests | Contract with encrypted storage |
| Implement `retrieveCredential()` | Solidity Agent | storeCredential | Retrieval with permit check |
| Implement permission management | Solidity Agent | retrieveCredential | Access control |
| Run AgentVault TDD tests | Agent | Implementation | All tests green |
| Security review | Oracle | Tests pass | Security audit notes |

#### Phase 3b: AgentMemory (Days 7-9)

| Task | Owner | Dependencies | Deliverable |
|------|-------|--------------|-------------|
| Implement `initializeAgent()` | Solidity Agent | M2 tests | Agent creation |
| Implement `appendContext()` | Solidity Agent | initializeAgent | Encrypted context append |
| Implement `getContextSlice()` | Solidity Agent | appendContext | Encrypted context retrieval |
| Implement `snapshotContext()` | Solidity Agent | getContextSlice | Snapshot functionality |
| Implement `restoreFromSnapshot()` | Solidity Agent | snapshotContext | Restore functionality |
| Run AgentMemory TDD tests | Agent | Implementation | All tests green |
| Security review | Oracle | Tests pass | Security audit notes |

**Definition of Done:**
- [ ] All AgentVault tests pass
- [ ] All AgentMemory tests pass
- [ ] Gas optimization applied
- [ ] Security review cleared

---

### 🎯 M4: Advanced Contracts - SkillRegistry + ActionSealer (Days 10-14) — *March 30 - April 6*

**Goal:** FHE-verified marketplace and sealed actions

#### Phase 4a: SkillRegistry (Days 10-12)

| Task | Owner | Dependencies | Deliverable |
|------|-------|--------------|-------------|
| Implement `registerSkill()` | Solidity Agent | M3 | Skill registration |
| Implement `verifySkill()` | Solidity Agent | registerSkill | FHE verification |
| Implement `rateSkill()` | Solidity Agent | verifySkill | Encrypted ratings |
| Implement `executeSkill()` | Solidity Agent | rateSkill | Skill execution |
| Run SkillRegistry TDD tests | Agent | Implementation | All tests green |

#### Phase 4b: ActionSealer (Days 13-14)

| Task | Owner | Dependencies | Deliverable |
|------|-------|--------------|-------------|
| Implement `sealAction()` | Solidity Agent | M3 | Action sealing |
| Implement `registerReleaseCondition()` | Solidity Agent | sealAction | Release conditions |
| Implement `releaseAction()` | Solidity Agent | registerReleaseCondition | Threshold release |
| Implement `cancelAction()` | Solidity Agent | releaseAction | Cancellation |
| Run ActionSealer TDD tests | Agent | Implementation | All tests green |

**Definition of Done:**
- [ ] All SkillRegistry tests pass
- [ ] All ActionSealer tests pass
- [ ] Cross-contract integration works
- [ ] Gas optimization applied

---

### ⚛️ M5: React Integration (Days 15-18) — *April 7-11*

**Goal:** wagmi-style hooks for FHE agent protection

| Task | Owner | Dependencies | Deliverable |
|------|-------|--------------|-------------|
| Implement `useEncryptedAgent()` | React Agent | M3 | Hook for agent state |
| Implement `useAgentVault()` | React Agent | M3 | Hook for credentials |
| Implement `useSealedAction()` | React Agent | M4 | Hook for sealed actions |
| Implement `useFHEClient()` | React Agent | M5 hooks | Core FHE client |
| Create Storybook stories | React Agent | Hooks | Component docs |
| Run integration tests | Agent | Hooks + Contracts | E2E tests green |

**API:**
```typescript
// useEncryptedAgent
const { state, encryptContext, appendContext, getDecryptedContext, snapshot, restore } = useEncryptedAgent(agentId);

// useAgentVault
const { storeCredential, requestCredential, decryptCredential, updatePermissions } = useAgentVault();

// useSealedAction
const { sealAction, registerCondition, release, cancel, getStatus } = useSealedAction();
```

**Definition of Done:**
- [ ] All hooks implemented
- [ ] Storybook docs complete
- [ ] Hook tests pass
- [ ] TypeScript clean

---

### 🦞 M6: OpenClaw Integration (Days 19-22) — *April 14-18*

**Goal:** FHE protection layer for OpenClaw skills

| Task | Owner | Dependencies | Deliverable |
|------|-------|--------------|-------------|
| Implement `FHESkillDecorator` | Integration Agent | M5 | Skill wrapper |
| Implement `FHEAgentMemoryProvider` | Integration Agent | M5 | Memory provider |
| Implement `FHECredentialVault` | Integration Agent | M5 | Credential manager |
| Create example: Email skill with FHE | Integration Agent | Decorator | Protected email skill |
| Create example: Browser skill with FHE | Integration Agent | Decorator | Protected browser skill |
| Create example: File skill with FHE | Integration Agent | Decorator | Protected file skill |
| Test with real OpenClaw instance | Agent | All above | Live demo |

**FHESkillDecorator API:**
```typescript
const secureSkill = FHESkillDecorator.wrap(baseSkill, {
  inputEncryption: true,
  outputEncryption: true,
  credentialVault: vaultAddress,
  requirePermits: ['read', 'write'],
});

agent.registerSkill(secureSkill);
```

**Definition of Done:**
- [ ] 3+ FHE-protected skills working
- [ ] OpenClaw demo runs
- [ ] No plaintext data exposure
- [ ] Performance acceptable

---

### 🎬 M7: Demo + Documentation (Days 23-26) — *April 21-25*

**Goal:** Working demo and complete docs

| Task | Owner | Dependencies | Deliverable |
|------|-------|--------------|-------------|
| Build demo application | Full Team | M6 | Working web app |
| Record demo video | Team | App | 3-min demo video |
| Write Quick Start guide | Docs Agent | M6 | README quick start |
| Write API reference | Docs Agent | M5 | docs/api-reference.md |
| Write architecture doc | Docs Agent | SPEC.md | docs/architecture.md |
| Deploy to testnet (Arbitrum Sepolia) | DevOps Agent | Tests | Live demo URL |

**Demo Flow:**
1. Show OpenClaw agent with plaintext credentials → vulnerability
2. Apply FHE-Agent Shield → credentials encrypted
3. Attempt prompt injection → blocked
4. Show sealed action → execute with threshold
5. Show encrypted agent memory → data protected

**Definition of Done:**
- [ ] Demo video recorded
- [ ] README complete
- [ ] API docs complete
- [ ] Testnet deployment live

---

### 🏁 M8: Polish + Final Evaluation (Days 27-30) — *April 28 - May 1*

**Goal:** Submission-ready for buildathon

| Task | Owner | Dependencies | Deliverable |
|------|-------|--------------|-------------|
| Final security audit | Oracle | All contracts | Security report |
| Gas optimization pass | Solidity Agent | Audit | Optimized contracts |
| Mainnet readiness check | DevOps Agent | Audit | Checklist complete |
| Final demo polish | Full Team | M7 | Perfect demo |
| Submit to buildathon | Team | All | Submission |

---

## Dependency Graph

```
M1 (Foundation)
    │
    ▼
M2 (TDD Specs)
    │
    ▼
┌───────────────────────────────────────────────────────────────┐
│                                                               │
M3 (Core Contracts)        M4 (Advanced Contracts)             │
    │                               │                            │
    │ (3a: AgentVault)              │ (4a: SkillRegistry)       
    │         │                     │         │                 
    │         ▼                     │         ▼                 
    │ (3b: AgentMemory)             │ (4b: ActionSealer)        
    │         │                     │         │                 
    └────┬────┴─────────────────────┴─────────┘                 
         │                                                         
         ▼                                                         
M5 (React Hooks)                                                  
         │                                                         
         ▼                                                         
M6 (OpenClaw Integration)                                        
         │                                                         
         ▼                                                         
M7 (Demo + Docs)                                                  
         │                                                         
         ▼                                                         
M8 (Polish + Eval)                                               
```

---

## Resource Allocation

| Phase | Agent | Focus |
|-------|-------|-------|
| M1-M2 | 1 Solidity Agent | Setup + TDD specs |
| M3-M4 | 2 Solidity Agents (parallel) | Core + Advanced contracts |
| M5 | 1 React Agent | Hooks |
| M6 | 1 Integration Agent | OpenClaw |
| M7-M8 | Full Team | Demo + Polish |

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| FHE complexity higher than expected | Medium | High | Use mock contracts first, real FHE later |
| OpenClaw API changes | Low | Medium | Pin version, create adapter layer |
| Gas costs too high | Medium | Medium | Optimize for on-chain min, off-chain most |
| Threshold network latency | Medium | Low | Use mock decryption for demo |
| Buildathon timing | Low | High | Prioritize core features, cut nice-to-haves |

---

## Success Criteria

| Criteria | Target | Measurement | Status |
|----------|--------|-------------|--------|
| Test Coverage | >90% | Istanbul coverage report | ✅ 150 tests |
| Contracts | 4/4 complete | All tests green | ✅ All passing |
| Hooks | 4/4 complete | All hooks implemented | ✅ Complete |
| OpenClaw Integration | Working demo | SDKs committed | ✅ Complete |
| Documentation | Complete | README + API + Architecture | ✅ Complete |
| Security Audit | No critical bugs | Bug fixes applied | ✅ Fixed |

---

## M8 Completion Status (March 20, 2026)

### Security Audit ✅
- **Critical bug fixed:** ActionSealer._countApprovals() returned 0 (threshold bypass)
- Fixed by adding `_approvalCounts` mapping to track actual approvals
- All 150 tests passing after fix

### Gas Optimization ✅
- Contracts optimized for FHE operations
- Snapshot/restore operations are O(n) by design (inherent to functionality)
- No major optimizations needed without changing functionality

### Mainnet Readiness ✅
- Created `docs/mainnet-readiness.md` with full checklist
- Ready for Arbitrum Sepolia testnet deployment
- Known limitations documented

### Documentation ✅
- All Milestones M1-M7 documented
- Competitive analysis updated with Molt ecosystem
- Integration roadmap 100% complete

---

## M9: Post-Hackathon Improvement Roadmap

Organized around the three judging dimensions we are targeting: **Privacy Architecture**, **User Experience**, and **Technical Execution**. Also incorporates the migration to the new Fhenix CoFHE model (coprocessor on host chains — Sepolia / Arbitrum Sepolia / Base Sepolia).

### 🛡️ M9.1 — Privacy Architecture

| Task | Rationale | Deliverable |
|------|-----------|-------------|
| Formal threat model per contract (STRIDE) | Explicit enumeration of spoof/tamper/repudiation/info-disclosure/DoS/elevation per attack surface | `docs/threat-model.md` with matrix + mitigations |
| Permit lifecycle hardening | Enforce expiration, nonce monotonicity, revocation list; property-based fuzz on permit state machine | New tests in `test/Permit.t.sol` + invariants |
| Access-control matrix (who can decrypt what) | Make the ACL explicit per resource × role × permit type | `docs/access-control-matrix.md` (machine-readable JSON alongside) |
| Ciphertext rotation for long-lived credentials | API keys rotated on schedule even without compromise; threshold re-encryption pattern | `rotateCredential()` on `AgentVault` + SDK helper |
| Side-channel / timing hardening | Decryption paths must be constant-time at the contract boundary; document threshold network latency bounds | Audit + notes in `docs/security-model.md` |
| Migrate to `@cofhe/sdk@^0.4.0` and `@fhenixprotocol/cofhe-contracts@^0.1.3` | Align with canonical CoFHE stack (current deps go through `@fhenixprotocol/contracts/FHE.sol`) | Dependency bump + compatibility layer |
| Zero-knowledge audit trail | Users prove permit was used correctly without exposing payload; good for enterprise compliance | Prototype with Noir or circom circuit |
| Remove every plaintext-fallback code path | Find any branch that logs, caches, or stores plaintext secrets when FHE path fails — fail-closed instead | `grep -r "plaintext\|fallback"` cleanup + lint rule |
| Selective-disclosure primitives | Reveal only derived values (e.g. "balance > X") without exposing underlying ciphertext | New `euint` helper contract + React hook |
| Threshold network M-of-N analysis | Document key-holder set, rotation policy, slashing for misbehavior | `docs/threshold-network.md` |

### 🎨 M9.2 — User Experience

| Task | Rationale | Deliverable |
|------|-----------|-------------|
| Unified CLI: `fhe-agent-shield` | Single entry-point replacing Makefile targets and scattered scripts | `bin/fhe-agent-shield` with subcommands: `init`, `deploy`, `connect`, `rotate`, `audit`, `status` |
| One-command scaffold | `pnpm dlx create-fhe-agent my-app` generates a working project with CoFHE SDK wired in | `packages/create-fhe-agent` |
| Deployment dashboard | Read-only web UI showing deployed addresses, chain, block number, verification status per host chain | `frontend/dashboard/` (Vite + wagmi) |
| Interactive demo playground | Try FHE-protected skills live without deploying anything; uses `cofhe-mock-contracts` under the hood | `frontend/playground/` |
| CoFHE error-code translator | Map raw revert selectors → human actionable messages in SDK | `sdk/typescript/src/errors.ts` + parity in Python SDK |
| Per-chain quickstart tutorials | 3 tutorials (Sepolia, Arb-Sepolia, Base-Sepolia), copy-paste runnable | `docs/tutorials/<chain>.md` |
| Legacy-to-CoFHE migration guide | Help teams with deployments on the old Fhenix Helium/Nitrogen chains port to the coprocessor model | `docs/migration-from-fhenix-l2.md` |
| React hook polish | Loading/error/idle states, optimistic UI, cache invalidation on permit expiration | Update `frontend/src/hooks/*` |
| Metamask/Rabby connect flow | Network auto-add for Sepolia/Arb/Base when missing; chain switch UX | `frontend/src/connect/` |
| Observable notifications | Toast + persistent activity log for every encrypted operation | `frontend/src/components/ActivityLog.tsx` |

### ⚙️ M9.3 — Technical Execution

| Task | Rationale | Deliverable |
|------|-----------|-------------|
| CI matrix across all host chains | Fork test on Sepolia / Arb-Sepolia / Base-Sepolia; enforce coverage floor ≥ 90% | `.github/workflows/ci.yml` (matrix) |
| Gas benchmark suite | Per-chain gas cost for every public function, diffed on each PR | `test/Gas.t.sol` + `gas-snapshot` committed |
| E2E harness with real CoFHE mock | Full round-trip: encrypt → store → retrieve → decrypt via `cofhe-mock-contracts` | `test/e2e/*` + dedicated CI job |
| Dependency pinning + renovate | `@cofhe/sdk@^0.4.0`, `@fhenixprotocol/cofhe-contracts@^0.1.3`, `@cofhe/hardhat-plugin@^0.4.0` enforced via `renovate.json` | Renovate config + lockfile audit |
| Reproducible builds | Deterministic `forge build` metadata; commit hash in deployment artifact | `script/DeployAll.s.sol` writes `deployments/<chain>.json` |
| Structured logs + OpenTelemetry | Every SDK operation emits trace with span attributes (chain, resource, permit hash) | `sdk/typescript/src/telemetry.ts` |
| Release automation | Changesets + semver + auto-publish SDKs on tag | `.changeset/` + `release.yml` |
| Cross-language SDK parity tests | Same E2E scenario runs in TS, Python, Rust, Go; asserts identical ciphertext handles | `tests/parity/` |
| Security scanning | Slither, Mythril, semgrep in CI; fail PR on new high-severity findings | `.github/workflows/security.yml` |
| Documentation site | `docs/` → rendered via VitePress or Docusaurus at a stable URL | `docs-site/` + gh-pages deploy |
| Mainnet readiness gate | Explicit checklist + attestation before any mainnet deploy (CoFHE mainnet TBA) | Update `docs/mainnet-readiness.md` |
| Fork `cofhe-mock-contracts` | Upstream README still calls Fhenix an L2; fork under `developerfred/cofhe-mock-contracts`, fix docs, update `.gitmodules` in this repo to track the fork | New submodule URL + `docs/fork-notes.md` |

### Sequencing

1. **Privacy Architecture** items block mainnet — do threat model, permit hardening, ciphertext rotation first.
2. **Technical Execution** foundations (CI matrix, gas benchmarks, parity tests) land next — they guard the privacy work.
3. **User Experience** polish lands last and can be parallelized across contributors once the API surface is stable.

---

*Last Updated: April 15, 2026*
*Version: 1.1 — added CoFHE migration (Fhenix is no longer an L2) and M9 improvement roadmap*
*Next: M9 Post-Hackathon Improvements*
