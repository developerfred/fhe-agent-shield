#!/bin/bash
# FHE-Agent Shield - Deploy and Demo Script
# Usage: ./demo.sh <PRIVATE_KEY>

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
RPC_URL="${SEPOLIA_RPC_URL:-https://rpc.sepolia.org}"
CHAIN_ID=$(cast chain-id --rpc-url $RPC_URL 2>/dev/null || echo "unknown")

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}FHE-Agent Shield - Deploy & Demo${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Check private key
if [ -z "$1" ]; then
    echo -e "${RED}Error: Private key required${NC}"
    echo "Usage: $0 <PRIVATE_KEY>"
    echo ""
    echo "Or set PRIVATE_KEY environment variable:"
    echo "  export PRIVATE_KEY=0x..."
    echo "  $0"
    exit 1
fi

PRIVATE_KEY=$1
DEPLOYER=$(cast wallet address $PRIVATE_KEY)

echo -e "${GREEN}Configuration:${NC}"
echo "  RPC URL: $RPC_URL"
echo "  Chain ID: $CHAIN_ID"
echo "  Deployer: $DEPLOYER"
echo ""

# Check balance
BALANCE=$(cast balance $DEPLOYER --rpc-url $RPC_URL 2>/dev/null || echo "0")
echo -e "  Balance: $(cast --to-dec $BALANCE) wei"
echo ""

if [ "$BALANCE" = "0" ]; then
    echo -e "${RED}Error: Insufficient balance${NC}"
    echo "Get testnet ETH at: https://faucet.sepolia.dev/"
    exit 1
fi

echo -e "${GREEN}Deploying contracts...${NC}"
echo ""

# Deploy contracts
echo "1. Deploying AgentVault..."
VAULT_TX=$(forge create src/contracts/AgentVault.sol:AgentVault \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --json 2>/dev/null | cast --parse-bytes32-address || true)

# Try with legacy format if JSON fails
if [ -z "$VAULT_TX" ] || [[ ! "$VAULT_TX" =~ 0x ]]; then
    VAULT_TX=$(forge create src/contracts/AgentVault.sol:AgentVault \
        --rpc-url $RPC_URL \
        --private-key $PRIVATE_KEY \
        --legacy 2>&1 | tail -1)
fi

echo "   TX: $VAULT_TX"
sleep 2

# For simplicity, use the CREATE2 address approach
VAULT=$(cast wallet address --private-key $PRIVATE_KEY --nonce 0 2>/dev/null || echo "pending")

echo ""
echo "2. Deploying AgentMemory..."
forge create src/contracts/AgentMemory.sol:AgentMemory \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY

echo ""
echo "3. Deploying SkillRegistry..."
forge create src/contracts/SkillRegistry.sol:SkillRegistry \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY

echo ""
echo "4. Deploying ActionSealer..."
forge create src/contracts/ActionSealer.sol:ActionSealer \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY

echo ""
echo "5. Deploying ExampleToken..."
forge create src/FHERC20.sol:ExampleToken \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --constructor-args "FHE Agent Shield Token" "FHES" 1000000000000000000000

echo ""
echo -e "${GREEN}Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Update contract addresses in DEMO.md"
echo "  2. Run demo: forge script script/Demo.s.sol:DeployAndDemo --rpc-url $RPC_URL --private-key $PRIVATE_KEY -vvv"
echo ""
echo "Or use cast to interact:"
echo "  cast send <VAULT_ADDRESS> 'storeCredential(address,bytes32)' ..."
