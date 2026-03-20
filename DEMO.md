# FHE-Agent Shield Demo Guide

## Quick Start with Cast (Foundry)

### 1. Deploy Contracts to Fhenix Testnet

```bash
# Set environment
export DEPLOYER_PRIVATE_KEY=your_private_key_here
export FHENIX_RPC=https://api.helium.fhenix.zone

# Deploy AgentVault
forge create src/contracts/AgentVault.sol:AgentVault \
  --rpc-url $FHENIX_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY

# Deploy AgentMemory  
forge create src/contracts/AgentMemory.sol:AgentMemory \
  --rpc-url $FHENIX_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY

# Deploy SkillRegistry
forge create src/contracts/SkillRegistry.sol:SkillRegistry \
  --rpc-url $FHENIX_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY

# Deploy ActionSealer
forge create src/contracts/ActionSealer.sol:ActionSealer \
  --rpc-url $FHENIX_RPC \
  --private-key $DEPLOYER_PRIVATE_KEY
```

### 2. Demo Commands

Replace `CONTRACT_ADDRESS` with your deployed address.

```bash
export VAULT=0x... # AgentVault address
export MEMORY=0x... # AgentMemory address
export SKILLS=0x... # SkillRegistry address
export SEALER=0x... # ActionSealer address
export RPC=https://api.helium.fhenix.zone

# ---- AGENT MEMORY DEMO ----
echo "=== Initialize Agent ==="
cast send $MEMORY "initializeAgent()" \
  --rpc-url $RPC --private-key $DEPLOYER_PRIVATE_KEY

echo "=== Store encrypted context ==="
cast send $MEMORY "appendContext(address,bytes32)" \
  --rpc-url $RPC --private-key $DEPLOYER_PRIVATE_KEY \
  $VAULT 0x1234567890abcdef

echo "=== Create snapshot ==="
cast send $MEMORY "snapshotContext(address)" \
  --rpc-url $RPC --private-key $DEPLOYER_PRIVATE_KEY \
  $VAULT

# ---- AGENT VAULT DEMO ----
echo "=== Store credential ==="
cast send $VAULT "storeCredential(address,bytes32)" \
  --rpc-url $RPC --private-key $DEPLOYER_PRIVATE_KEY \
  $VAULT 0xabcdef1234567890000000000000000000000000000000000000000000000000

echo "=== Get credential handle ==="
cast call $VAULT "getCredentialHandle(address)" \
  --rpc-url $RPC $VAULT

# ---- SKILL REGISTRY DEMO ----
echo "=== Register skill ==="
cast send $SKILLS "registerSkill(bytes32,bytes32)" \
  --rpc-url $RPC --private-key $DEPLOYER_PRIVATE_KEY \
  0x0000000000000000000000000000000000000000000000000000000000000001 \
  0x0000000000000000000000000000000000000000000000000000000000000002

echo "=== Get skill info ==="
cast call $SKILLS "getSkill(address)" \
  --rpc-url $RPC \
  0x0000000000000000000000000000000000000001

# ---- ACTION SEALER DEMO ----
echo "=== Seal action ==="
cast send $SEALER "sealAction(address,bytes)" \
  --rpc-url $RPC --private-key $DEPLOYER_PRIVATE_KEY \
  $VAULT "0xabcdef"

echo "=== Get action status ==="
cast call $SEALER "getActionStatus(address)" \
  --rpc-url $RPC \
  0x... # action ID from previous tx
```

### 3. Interactive Demo Script

Run the automated demo:

```bash
forge script script/Demo.s.sol:RunDemo --rpc-url $FHENIX_RPC --private-key $DEPLOYER_PRIVATE_KEY -vvv
```

## Contract Addresses (Update after deployment)

| Contract | Address | TX Hash |
|---------|---------|---------|
| AgentVault | `0x...` | `0x...` |
| AgentMemory | `0x...` | `0x...` |
| SkillRegistry | `0x...` | `0x...` |
| ActionSealer | `0x...` | `0x...` |

## Verify Deployment

```bash
# Check contract exists and has code
cast code $VAULT --rpc-url $RPC

# Check chain ID
cast chain-id --rpc-url $RPC

# Check block number (should be > 0)
cast block-number --rpc-url $RPC
```
