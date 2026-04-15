# FHE-Agent Shield Testnet Flow

This directory contains the full credential flow demonstration for Fhenix testnet.

## Prerequisites

- Foundry installed (for contract deployment)
- Node.js 18+
- TypeScript

## Networks

| Network | RPC URL | Explorer |
|---------|---------|---------|
| Ethereum Sepolia | https://rpc.sepolia.org | https://sepolia.etherscan.io |
| Arbitrum Sepolia | https://sepolia-rollup.arbitrum.io/rpc | https://sepolia.arbiscan.io |

## Quick Start

```bash
# Deploy contracts to Ethereum Sepolia testnet
make deploy-sepolia

# Run full credential flow
make testnet-flow

# Verify on explorer
make verify-sepolia
```

## Flow Steps

### 1. Deploy Contracts

```bash
# Deploy to Sepolia
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC --broadcast

# Output contract addresses:
# - AgentVault: 0x...
# - AgentMemory: 0x...
```

### 2. Initialize FHE Vault

```bash
# Initialize vault with threshold=2
npx ts-node scripts/initialize-vault.ts --network sepolia --vault <VAULT_ADDRESS>
```

### 3. Store Credential

```bash
# Store encrypted credential
npx ts-node scripts/store-credential.ts \
  --network sepolia \
  --vault <VAULT_ADDRESS> \
  --key "openai-api-key" \
  --value "sk-..."
```

### 4. Retrieve Credential (Threshold Authorization)

```bash
# Retrieve with 2 permits (threshold)
npx ts-node scripts/retrieve-credential.ts \
  --network sepolia \
  --vault <VAULT_ADDRESS> \
  --id <CREDENTIAL_ID> \
  --permits 2
```

### 5. Append Memory Context

```bash
# Append encrypted memory context
npx ts-node scripts/append-memory.ts \
  --network sepolia \
  --memory <MEMORY_ADDRESS> \
  --agent <AGENT_ADDRESS> \
  --context "User prefers dark mode"
```

### 6. Retrieve Memory Snapshot

```bash
# Get recent memory context
npx ts-node scripts/get-memory.ts \
  --network sepolia \
  --memory <MEMORY_ADDRESS> \
  --agent <AGENT_ADDRESS> \
  --limit 10
```

## Makefile Commands

```makefile
# Deploy contracts
make deploy-sepolia       # Deploy to Sepolia
make deploy-arbitrum-sepolia    # Deploy to Arbitrum Sepolia

# Run flows
make testnet-flow      # Run full credential flow
make test-vault        # Test vault only
make test-memory       # Test memory only

# Verify
make verify-sepolia     # Verify contracts on Sepolia explorer
make etherscan-verify # Verify on Etherscan (if applicable)
```

## Expected Output

```
=== FHE-Agent Shield Credential Flow ===
Network: sepolia
Threshold: 2

[1] Deploying contracts...
    AgentVault: 0x1234...
    AgentMemory: 0x5678...

[2] Storing credential...
    Credential ID: cred_openai-api-key_1699999999
    TX: 0xabcd...

[3] Retrieving credential (permits=2)...
    Decrypted value: sk-...
    TX: 0xefgh...

[4] Appending memory context...
    Context ID: mem_agent_1700000000
    TX: 0xijkl...

[5] Retrieving memory...
    Contexts: 1
    - decrypted_context_0

=== Flow Complete ===
All operations successful!
```

## Environment Variables

```bash
# Required
export SEPOLIA_RPC="https://rpc.sepolia.org"
export ARBITRUM_SEPOLIA_RPC="https://sepolia-rollup.arbitrum.io/rpc"
export PRIVATE_KEY="0x..."  # Deployer wallet private key

# Optional
export ETHERSCAN_API_KEY="..."  # For contract verification
```
