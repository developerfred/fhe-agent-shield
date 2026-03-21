# FHE-Agent Shield: TDD Test Suite

> Comprehensive test suite for all SDK integrations

## Overview

This document defines the TDD approach for verifying all FHE-Agent Shield SDK integrations.

## Test Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TDD Verification Layer                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │  TypeScript SDK  │  │   Python SDK     │  │   Rust SDK     │ │
│  │  @fhe-agent-     │  │  fhe-agent-      │  │  fhe-agent-    │ │
│  │  shield/sdk      │  │  shield          │  │  shield        │ │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬────────┘ │
│           │                     │                    │          │
│           └─────────────────────┼────────────────────┘          │
│                                 ▼                                 │
│                    ┌──────────────────────┐                     │
│                    │   Integration Tests   │                     │
│                    │   (Cross-SDK)        │                     │
│                    └──────────────────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Test Categories

### 1. Unit Tests (per SDK)

Each SDK must have its own unit tests covering:

| Test Category | TypeScript | Python | Rust |
|--------------|------------|--------|------|
| Client initialization | ✅ | ✅ | ✅ |
| Credential store/retrieve | ✅ | ✅ | ✅ |
| Memory append/get | ✅ | ✅ | ✅ |
| Action seal/approve/release | ✅ | ✅ | ✅ |
| Network configuration | ✅ | ✅ | ✅ |
| Error handling | ✅ | ✅ | ✅ |

### 2. Integration Tests

Tests that verify SDKs work with real contracts:

| Test | Description |
|------|-------------|
| `test_full_credential_flow` | Store → Retrieve credential end-to-end |
| `test_full_memory_flow` | Append → Get context end-to-end |
| `test_full_action_flow` | Seal → Approve → Release action |
| `test_multi_network` | Verify same code works on all 4 networks |
| `test_threshold_enforcement` | Verify threshold is enforced |

### 3. Contract ABI Compatibility

Verify all SDKs use consistent ABIs:

```solidity
// Expected ABI for AgentVault
[
  {
    "name": "storeCredential",
    "inputs": [{"name": "agentId", "type": "address"}, {"name": "encryptedData", "type": "bytes32"}],
    "outputs": [{"name": "", "type": "bytes32"}]
  },
  {
    "name": "retrieveCredential", 
    "inputs": [{"name": "handle", "type": "bytes32"}],
    "outputs": [{"name": "", "type": "string"}]
  }
]
```

## Network Configuration Tests

### Test Networks

| Network | Chain ID | RPC URL | Status |
|---------|----------|---------|--------|
| Fhenix Helium | 8008135 | `https://api.helium.fhenix.zone` | ⚠️ RPC issues |
| Fhenix Nitrogen | 8008148 | `https://api.nitrogen.fhenix.zone` | ✅ Available |
| Arbitrum Sepolia | 421614 | `https://sepolia-rollup.arbitrum.io/rpc` | ✅ Working |
| Base Sepolia | 84532 | `https://sepolia.base.org` | ✅ Working |

### Network Test Matrix

```
Network              | Store | Retrieve | Memory | Actions
---------------------|-------|----------|--------|--------
Fhenix Helium       |   -   |    -     |   -    |    -   
Fhenix Nitrogen      |   ✅   |    ✅    |   ✅   |    ✅   
Arbitrum Sepolia     |   ✅   |    ✅    |   ✅   |    ✅   
Base Sepolia         |   ✅   |    ✅    |   ✅   |    ✅   
Anvil Local         |   ✅   |    ✅    |   ✅   |    ✅   
```

## Test Commands

### Foundry Tests
```bash
forge test
forge test --match-contract "FhevmRealTest" -vvv
forge test --match-contract "FheIntegrationTest" -vvv
```

### TypeScript SDK Tests
```bash
cd sdk/typescript
npm install
npm test
```

### Python SDK Tests
```bash
cd sdk/python
pip install -e ".[dev]"
pytest tests/
```

### Rust SDK Tests
```bash
cd sdk/rust
cargo test
cargo test --all-features
```

### Integration Tests
```bash
# Run all integration tests
./scripts/run-integration-tests.sh

# Run cross-SDK verification
./scripts/verify-cross-sdk.sh
```

## Success Criteria

### For TypeScript SDK
- [ ] `FHEAgentShield` class implements all 4 contract interfaces
- [ ] Supports all 4 networks via configuration
- [ ] Uses viem (not ethers)
- [ ] 10+ passing unit tests
- [ ] README with working examples

### For Python SDK
- [ ] `FHEAgentShield` class with async support
- [ ] Uses web3.py (not web3.js)
- [ ] 10+ passing unit tests
- [ ] Nanobot plugin functional
- [ ] README with working examples

### For Rust SDK
- [ ] `FHEAgentShield` struct with async/await
- [ ] Uses ethers-rs
- [ ] 10+ passing unit tests
- [ ] Example compiles and runs
- [ ] README with working examples

### For ElizaOS Plugin
- [ ] Implements Plugin interface
- [ ] All 4 actions defined
- [ ] Providers implemented
- [ ] Tests passing

### For Nanobot Integration
- [ ] Plugin architecture followed
- [ ] FHE decorators working
- [ ] Tests passing

## Verification Checklist

```bash
#!/bin/bash
# Cross-SDK Verification Script

echo "========================================="
echo "FHE-Agent Shield SDK Verification"
echo "========================================="

# 1. Check directories exist
for dir in sdk/typescript sdk/python sdk/rust sdk/elizaos-plugin sdk/nanobot-integration; do
  if [ -d "$dir" ]; then
    echo "✅ $dir exists"
  else
    echo "❌ $dir missing"
  fi
done

# 2. Check package files
for pkg in sdk/typescript/package.json sdk/python/pyproject.toml sdk/rust/Cargo.toml; do
  if [ -f "$pkg" ]; then
    echo "✅ $pkg exists"
  else
    echo "❌ $pkg missing"
  fi
done

# 3. Run TypeScript tests if available
if [ -d "sdk/typescript" ]; then
  cd sdk/typescript && npm test && cd ../..
fi

# 4. Run Python tests if available
if [ -d "sdk/python" ]; then
  cd sdk/python && pytest tests/ && cd ../..
fi

# 5. Run Rust tests if available
if [ -d "sdk/rust" ]; then
  cd sdk/rust && cargo test && cd ../..
fi

echo "========================================="
echo "Verification Complete"
echo "========================================="
```

## CI/CD Integration

Create `.github/workflows/sdk-tests.yml`:

```yaml
name: SDK Tests

on:
  push:
    paths:
      - 'sdk/**'
  pull_request:
    paths:
      - 'sdk/**'

jobs:
  typescript:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install and test
        run: |
          cd sdk/typescript
          npm ci
          npm test

  python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install and test
        run: |
          cd sdk/python
          pip install -e ".[dev]"
          pytest tests/

  rust:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions-rs/toolchain@v1
        with:
          rust-version: '1.75'
      - name: Install and test
        run: |
          cd sdk/rust
          cargo test --all-features
```

## Test Data

### Test Addresses
```
Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Agent1:   0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Agent2:   0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Approver: 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
```

### Test Credentials
```
key: "OPENAI_API_KEY"
value: "sk-test-1234567890"

key: "SENDGRID_KEY"  
value: "SG.test-key-123"
```

### Test Actions
```json
{
  "type": "send_email",
  "params": {
    "to": "test@example.com",
    "subject": "Test Subject",
    "body": "Test body content"
  }
}
```

## Reporting

After all tests complete, generate a report:

```
## SDK Test Results

| SDK | Status | Tests Passed | Coverage |
|-----|--------|-------------|----------|
| TypeScript | ✅ | 12/12 | 85% |
| Python | ✅ | 12/12 | 80% |
| Rust | ✅ | 12/12 | 75% |
| ElizaOS | ✅ | 8/8 | 70% |
| Nanobot | ✅ | 8/8 | 75% |

Total: 52/52 tests passing
```
