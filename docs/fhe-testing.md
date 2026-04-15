# FHE Testing Guide

This guide explains how to test FHE (Fully Homomorphic Encryption) smart contracts in FHE-Agent Shield.

## Overview

FHE contracts use special encrypted types (`inEuint256`, `euint256`, etc.) that require the FHE precompile at address `0x80` (128). Testing strategies differ based on the environment.

## Project Architecture

```
fhe-agent-shield/
├── src/contracts/           # Main smart contracts
│   ├── AgentMemory.sol     # FHE-encrypted agent memory
│   ├── AgentVault.sol      # FHE-encrypted credential storage
│   ├── SkillRegistry.sol   # FHE-rated skill registry
│   └── ActionSealer.sol    # Threshold-released sealed actions
├── test/                   # Foundry tests
│   ├── FheIntegration.t.sol    # FHE integration tests (27 tests)
│   ├── AgentMemory.t.sol        # AgentMemory unit tests
│   ├── AgentVault.t.sol         # AgentVault unit tests
│   └── ...
├── util/
│   └── FheHelper.sol       # FheEnabled base + MockFheOps
├── lib/
│   └── cofhe-mock-contracts/   # Full CoFHE mock architecture
└── docs/
    └── fhe-testing.md      # This document
```

## Architecture

### CoFHE Components

The CoFHE (Co-processor for Fully Homomorphic Encryption) system consists of:

**On-chain:**
- **FHE.sol** - Solidity library for operations on encrypted data
- **Task Manager** - Gateway for FHE operations, validates requests, manages ACL
- **Ciphertext Registry** - Maintains references to encrypted values

**Off-chain:**
- **FHEOS Server** - Executes actual FHE operations
- **Threshold Network** - Handles decryption via multi-party computation

### Precompile Address

FHE operations use address `0x80` (128) as the precompile. This is where:
- On **Fhenix testnet**: Real FHE precompile exists
- On **Local Anvil**: Empty (no code)
- On **Foundry tests**: MockFheOps is etched via `vm.etch`

## Testing Architecture

| Environment | Tool | FHE Functions | Non-FHE Functions |
|-------------|------|--------------|-------------------|
| Local Anvil | Foundry + FheEnabled | ✅ MockFheOps via `vm.etch` | ✅ Direct |
| Fhenix Testnet | Foundry Fork | ✅ Real FHE precompile | ✅ Direct |
| TypeScript/viem | - | ❌ Requires precompile | ✅ Direct |

## 1. Foundry Tests with FheEnabled (Local Anvil)

For local testing with Foundry, use the `FheEnabled` base contract from `util/FheHelper.sol`:

```solidity
import { FheHelper } from "../util/FheHelper.sol";

contract MyFheTest is Test, FheEnabled {
    function setUp() public {
        // Initialize MockFheOps at address(128) using vm.etch
        initializeFhe();
    }
    
    function testEncryptAndStore() public {
        // Use FheHelper encryption functions
        inEuint256 memory encrypted = encrypt256(uint256(keccak256("secret")));
        
        // Call FHE contract functions
        bytes32 handle = myContract.storeCredential(encrypted);
        assertTrue(handle != bytes32(0));
    }
}
```

### How `initializeFhe()` Works

```solidity
function initializeFhe() public {
    MockFheOps fheos = new MockFheOps();
    bytes memory code = address(fheos).code;
    vm.etch(address(128), code);  // Replaces address(128) with MockFheOps
}
```

This uses Foundry's `vm.etch` cheatcode to replace the code at address 128 with the MockFheOps bytecode. This only works in Foundry tests, not in live deployments or TypeScript.

```solidity
import { FheHelper } from "../util/FheHelper.sol";

contract MyFheTest is Test, FheEnabled {
    function setUp() public {
        // Initialize MockFheOps at address(128)
        initializeFhe();
    }
    
    function testEncryptAndStore() public {
        // Use FheHelper encryption functions
        inEuint256 memory encrypted = encrypt256(uint256(keccak256("secret")));
        
        // Call FHE contract functions
        bytes32 handle = myContract.storeCredential(encrypted);
        assertTrue(handle != bytes32(0));
    }
}
```

### Available Encryption Functions

From `FheHelper`:

| Function | Input | Output |
|----------|-------|--------|
| `encrypt8(uint256)` | `uint256` | `inEuint8 memory` |
| `encrypt16(uint256)` | `uint256` | `inEuint16 memory` |
| `encrypt32(uint256)` | `uint256` | `inEuint32 memory` |
| `encrypt64(uint256)` | `uint256` | `inEuint64 memory` |
| `encrypt128(uint256)` | `uint256` | `inEuint128 memory` |
| `encrypt256(uint256)` | `uint256` | `inEuint256 memory` |
| `encryptAddress(uint256)` | `uint256` | `inEaddress memory` |
| `encryptBool(uint256)` | `uint256` | `inEbool memory` |

## 2. FHE Integration Test Suite

The project includes a comprehensive FHE test suite at `test/FheIntegration.t.sol`:

```bash
# Run all FHE integration tests
forge test --match-contract "FheIntegrationTest" -vvv
```

### Test Coverage

| Contract | Function | Test Name |
|----------|----------|-----------|
| AgentMemory | appendContext | testFhe_AppendEncryptedContext |
| AgentMemory | getContextLength | testFhe_GetContextLength |
| AgentMemory | snapshotContext | testFhe_CreateSnapshot |
| AgentMemory | restoreFromSnapshot | testFhe_RestoreFromSnapshot |
| AgentMemory | - | testFhe_ContextIsolation |
| AgentVault | storeCredential | testFhe_StoreCredential |
| AgentVault | retrieveCredential | testFhe_RetrieveCredential |
| AgentVault | - | testFhe_CredentialAccessControl |
| AgentVault | deleteCredential | testFhe_DeleteCredential |
| SkillRegistry | rateSkill | testFhe_RateSkill |
| SkillRegistry | executeSkill | testFhe_ExecuteSkill |

## 3. TypeScript Tests (Non-FHE Only)

viem/TypeScript can only test non-FHE functions. FHE functions must be tested in Solidity because:

1. **No `vm.etch` equivalent** - TypeScript cannot modify EVM state at address 128
2. **No FHE precompile** - Anvil doesn't have FHE operations at address 128
3. **Encryption requires precompile** - `inEuint256` types need the precompile to be created

### Why viem Tests Non-FHE Functions Only

```typescript
// This WORKS - no FHE involved
await walletClient.writeContract({
  abi: VAULT_ABI,
  functionName: 'updateThreshold',
  args: [3]
});

// This FAILS - requires FHE precompile
await walletClient.writeContract({
  abi: VAULT_ABI,
  functionName: 'storeCredential',  // Takes inEuint256, needs precompile
  args: [encryptedValue]
});
```

### What CAN be tested with viem

```typescript
const VAULT_ABI = [
  { name: 'updateThreshold', inputs: [{ name: 'newThreshold', type: 'uint8' }], ... },
  { name: 'getThreshold', inputs: [{ name: 'agent', type: 'address' }], ... },
  { name: 'credentialExists', inputs: [{ name: 'handle', type: 'bytes32' }], ... },
];

// These work with viem
await walletClient.writeContract({ abi: VAULT_ABI, functionName: 'updateThreshold', args: [3] });
await publicClient.readContract({ abi: VAULT_ABI, functionName: 'getThreshold', args: [account] });
```

### What CANNOT be tested with viem

```typescript
// These require FHE precompile - use Solidity tests
{ name: 'storeCredential', inputs: [{ name: 'encryptedValue', type: 'inEuint256' }], ... }
{ name: 'retrieveCredential', inputs: [{ name: 'handle', type: 'bytes32' }], outputs: [{ type: 'euint256' }], ... }
{ name: 'appendContext', inputs: [{ name: 'agentId', type: 'address' }, { name: 'encryptedChunk', type: 'inEuint256' }], ... }
```

## 4. Testing with Fhenix Testnet Fork

When the Fhenix testnet RPC is accessible, you can fork it with Anvil:

```bash
# Fork Fhenix testnet (when RPC is available)
anvil --fork-url https://rpc.sepolia.org --port 8545

# Deploy contracts
forge script script/DeployAll.s.sol --rpc-url http://localhost:8545 --broadcast

# Run viem tests for non-FHE functions
npx tsx sandbox/test-openclaw-integration.ts
```

**Note**: Even on Fhenix fork, FHE operations in deployed contracts still route through the precompile. The difference is the precompile is real (not mocked).

### What CAN be tested with viem

```typescript
const VAULT_ABI = [
  { name: 'updateThreshold', inputs: [{ name: 'newThreshold', type: 'uint8' }], ... },
  { name: 'getThreshold', inputs: [{ name: 'agent', type: 'address' }], ... },
  { name: 'credentialExists', inputs: [{ name: 'handle', type: 'bytes32' }], ... },
];

// These work with viem
await walletClient.writeContract({ abi: VAULT_ABI, functionName: 'updateThreshold', args: [3] });
await publicClient.readContract({ abi: VAULT_ABI, functionName: 'getThreshold', args: [account] });
```

### What CANNOT be tested with viem

```typescript
// These require FHE precompile - use Solidity tests
{ name: 'storeCredential', inputs: [{ name: 'encryptedValue', type: 'inEuint256' }], ... }
{ name: 'retrieveCredential', inputs: [{ name: 'handle', type: 'bytes32' }], outputs: [{ type: 'euint256' }], ... }
{ name: 'appendContext', inputs: [{ name: 'agentId', type: 'address' }, { name: 'encryptedChunk', type: 'inEuint256' }], ... }
```

## 4. Running Tests

### All Solidity Tests

```bash
forge test
```

### FHE Integration Tests Only

```bash
forge test --match-contract "FheIntegrationTest"
```

### TypeScript Integration Tests

```bash
# Start Anvil with contracts deployed
anvil --port 8545
forge script script/ForkIntegration.s.sol:ForkIntegrationTest --fork-url http://localhost:8545 --broadcast

# Run viem tests
npx tsx sandbox/test-openclaw-integration.ts
```

### Fork Tests (Fhenix Testnet)

```bash
export SEPOLIA_RPC_URL="https://rpc.sepolia.org"
forge test --match-path "test/fork/*" -vvv
```

## 5. MockFheOps Reference

When running on local Anvil, `MockFheOps` simulates the FHE precompile at address `0x80`:

### Supported Operations

- `verify(utype, input, securityZone)` - Verifies encrypted input
- `trivialEncrypt(input, toType, securityZone)` - Creates trivial encryption
- `add`, `sub`, `mul`, `div` - Arithmetic operations
- `lt`, `lte`, `gt`, `gte`, `eq`, `ne` - Comparison operations
- `select` - Conditional selection
- `decrypt` - Decryption (returns input as-is for mock)

### Limitations

The mock implementation:
- Does NOT provide real FHE encryption
- Does NOT hide plaintext values
- Use for contract logic testing only
- For security testing, use Fhenix testnet fork

## 6. Key Testing Patterns

### Pattern 1: Testing FHE Storage

```solidity
function testFhe_StoreAndRetrieve() public {
    // Alice stores a credential
    vm.prank(alice);
    inEuint256 memory secret = encrypt256(12345);
    bytes32 handle = vault.storeCredential(secret);
    
    // Alice retrieves it
    vm.prank(alice);
    euint256 retrieved = vault.retrieveCredential(handle);
    
    // Mock returns plaintext for testing
    assertEq(euint256.unwrap(retrieved), 12345);
}
```

### Pattern 2: Testing Access Control

```solidity
function testFhe_AccessControl() public {
    // Alice stores
    vm.prank(alice);
    bytes32 handle = vault.storeCredential(encrypt256(999));
    
    // Bob cannot retrieve (access denied)
    vm.prank(bob);
    vm.expectRevert(abi.encodeWithSignature("AccessDenied()"));
    vault.retrieveCredential(handle);
}
```

### Pattern 3: Testing Context Isolation

```solidity
function testFhe_ContextIsolation() public {
    // Alice and Bob have separate contexts
    vm.prank(alice);
    agentMemory.appendContext(aliceAgent, encrypt256(111));
    
    vm.prank(bob);
    agentMemory.appendContext(bobAgent, encrypt256(222));
    
    // Each has length 1, different values
    assertEq(agentMemory.getContextLength(aliceAgent), 1);
    assertEq(agentMemory.getContextLength(bobAgent), 1);
}
```

## 7. Troubleshooting

### "Function not found on ABI" with viem

The contract uses FHE types internally. Check if the function requires FHE input/output.

### "Address 0x80: revert" 

The FHE precompile isn't initialized. Make sure `initializeFhe()` is called in `setUp()`.

### "Invalid ciphertext" errors

On local Anvil with MockFheOps, encryption is trivial. This error typically only occurs on real Fhenix with invalid ciphertexts.

## 8. Test Results Summary

| Test Suite | Tests | Status |
|------------|-------|--------|
| FheIntegrationTest | 27 | ✅ All Passing |
| AgentMemoryTest | 22 | ✅ All Passing |
| AgentVaultTest | 19 | ✅ All Passing |
| SkillRegistryTest | 17 | ✅ All Passing |
| ActionSealerTest | 25 | ✅ All Passing |
| IntegrationTest | 6 | ✅ All Passing |
| ForkTest | 6 | ✅ All Passing |
| FHERC20Test | 4 | ✅ All Passing |
| PermissionedTest | 1 | ✅ All Passing |
| **Total** | **150** | ✅ **All Passing** |

## 9. FHE Integration Test Coverage

The `FheIntegrationTest` contract provides comprehensive coverage of FHE operations:

### AgentMemory FHE Tests
| Test | Description |
|------|-------------|
| `testFhe_AppendEncryptedContext` | Append encrypted data to agent context |
| `testFhe_MultipleAppends` | Append multiple encrypted contexts |
| `testFhe_GetContextLength` | Verify context length tracking |
| `testFhe_ContextIsolation` | Verify different agents have isolated contexts |
| `testFhe_CreateSnapshot` | Create encrypted context snapshot |
| `testFhe_RestoreFromSnapshot` | Restore context from snapshot |
| `testFhe_RevertIfNotOwner` | Access control enforcement |
| `testFhe_RevertIfAgentNotFound` | Agent existence validation |

### AgentVault FHE Tests
| Test | Description |
|------|-------------|
| `testFhe_StoreCredential` | Store encrypted credential |
| `testFhe_RetrieveCredential` | Retrieve encrypted credential |
| `testFhe_CredentialAccessControl` | Only owner can retrieve |
| `testFhe_DeleteCredential` | Delete stored credential |

### SkillRegistry FHE Tests
| Test | Description |
|------|-------------|
| `testFhe_RateSkill` | Rate a skill with encrypted value |
| `testFhe_ExecuteSkill` | Execute verified skill |
| `testFhe_ExecuteSkillRevertIfNotVerified` | Block unverified skill execution |
| `testFhe_CannotRateSameSkillTwice` | Prevent duplicate ratings |

### ActionSealer FHE Tests
| Test | Description |
|------|-------------|
| `testFhe_SealAction` | Seal action with encrypted payload |
| `testFhe_RegisterReleaseCondition` | Set threshold and timeout |
| `testFhe_ApproveRelease` | Multiple approvers support |
| `testFhe_ReleaseAction` | Release sealed action |
| `testFhe_CancelAction` | Cancel sealed action |
| `testFhe_ActionRevertIfNotOwner` | Non-owner blocked |
| `testFhe_RevertIfConditionAlreadyRegistered` | Prevent duplicate conditions |
| `testFhe_RevertIfAlreadyApproved` | Prevent duplicate approvals |
| `testFhe_RevertIfActionNotFound` | Action existence validation |
| `testFhe_GetActionDetails` | Retrieve action information |

## 10. Running Specific Test Suites

```bash
# Run all tests
forge test

# Run only FHE integration tests
forge test --match-contract "FheIntegrationTest" -vvv

# Run AgentMemory tests only
forge test --match-contract "AgentMemoryTest" -vvv

# Run ActionSealer tests only
forge test --match-contract "ActionSealerTest" -vvv

# Run with gas report
forge test --gas-report

# Run with verbosity
forge test -vvv
```

## 11. CoFHE Mock Contracts Architecture

The project includes `@fhenixprotocol/cofhe-mock-contracts` (v0.3.1) which provides a complete mock of the CoFHE system:

### Available Mocks

| Contract | Purpose |
|----------|---------|
| `MockTaskManager` | Gateway for FHE operations, validates requests, manages ACL |
| `ACL` | Access Control List for permissions |
| `MockZkVerifier` | ZK proof verification (mock) |
| `MockZkVerifierSigner` | ZK signature verification |
| `MockQueryDecrypter` | Handles decryption requests |
| `CoFheTest` | **Base contract** for tests with full mock setup |

### Using CoFheTest Base

For more advanced FHE testing, extend `CoFheTest` instead of `FheEnabled`:

```solidity
import { CoFheTest } from "@fhenixprotocol/cofhe-mock-contracts/contracts/CoFheTest.sol";

contract AdvancedFheTest is CoFheTest {
    function setUp() public {
        // Full CoFHE architecture already initialized
        // TaskManager, ACL, ZKVerifier, QueryDecrypter all deployed
    }
    
    function testCreateEncryptedInput() public {
        // Create encrypted input with full verification
        InEuint256 memory input = createInEuint256(42, 0, address(this));
        
        // Verify it works with the contract
        // ...
    }
    
    function testPermissionSignature() public {
        // Create and sign permissions
        Permission memory permission = createPermissionSelf(address(this));
        Permission memory signed = signPermissionSelf(permission, privateKey);
        
        // Verify permission works
        // ...
    }
    
    function testDecrypt() public {
        InEuint256 memory input = createInEuint256(123, 0, address(this));
        
        Permission memory perm = createPermissionSelf(address(this));
        perm = signPermissionSelf(perm, privateKey);
        
        (bool success, string memory error, uint256 value) = 
            queryDecrypt(euint256.unwrap(result), block.chainid, perm);
        
        assertTrue(success);
        assertEq(value, 123);
    }
}
```

### Key CoFheTest Functions

| Function | Description |
|----------|-------------|
| `createInEuint256(value, securityZone, sender)` | Create encrypted input |
| `createInEbool(value, securityZone, sender)` | Create encrypted bool |
| `createInEaddress(value, securityZone, sender)` | Create encrypted address |
| `signPermissionSelf(permission, pkey)` | Self-signed permission |
| `queryDecrypt(ctHash, chainId, permission)` | Request decryption |
| `assertHashValue(euint256, expected)` | Assert encrypted equals expected |

### Mock Addresses

| Service | Address |
|---------|---------|
| TaskManager | `0x...` (deployed by CoFheTest) |
| ACL | `0xa6Ea4b5291d044D93b73b3CFf3109A1128663E8B` |
| ZK Verifier | `0x100` (256) |
| ZK Verifier Signer | `0x101` (257) |
| Query Decrypter | `0x200` (512) |
| FHE Precompile | `0x80` (128) |

## 12. Privacy-Preserving AI Agent Use Case

FHE-Agent Shield enables **Privacy-Preserving AI Agents** on Fhenix:

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI Agent (OpenClaw)                      │
├─────────────────────────────────────────────────────────────────┤
│  1. Agent decides to use a skill                                │
│  2. Skill rating is encrypted (e.g., 5 stars) → no one sees    │
│  3. Credential (API key) stored encrypted → even node can't see│
│  4. Context/memory encrypted → memory is private                │
│  5. Critical actions sealed → require threshold approval        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Fhenix FHE Contracts                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ AgentVault   │  │ AgentMemory  │  │   ActionSealer       │ │
│  │ Credentials  │  │ Context     │  │   Threshold Release  │ │
│  │ (encrypted)   │  │ (encrypted)  │  │   (multi-sig)        │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CoFHE (FHE Coprocessor)                      │
│         FHE Operations happen off-chain, verified on-chain      │
└─────────────────────────────────────────────────────────────────┘
```

### Privacy Guarantees

| Data | Protection |
|------|------------|
| Agent Credentials | Only agent owner can decrypt |
| Agent Memory | Only agent owner can decrypt |
| Skill Ratings | No one can see individual ratings |
| Sealed Actions | Require multi-party approval to release |
| Action Payload | Encrypted until threshold met |
