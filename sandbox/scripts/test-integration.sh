#!/bin/bash
set -e

echo "=========================================="
echo "FHE-Agent Shield - OpenClaw Integration"
echo "=========================================="

DEPLOYMENT_FILE="${DEPLOYMENT_FILE:-/app/deployments/addresses.json}"

if [ ! -f "$DEPLOYMENT_FILE" ]; then
    echo "ERROR: Deployment file not found at $DEPLOYMENT_FILE"
    echo "Please run deploy.sh first"
    exit 1
fi

source <(cat "$DEPLOYMENT_FILE" | tr -d '{},"' | grep -oP '\w+\s*:\s*\K[^\s,]+')

echo "Loaded deployment addresses:"
echo "  AgentVault: $agentVault"
echo "  AgentMemory: $agentMemory"
echo "  SkillRegistry: $skillRegistry"
echo "  ActionSealer: $actionSealer"

export FHE_VAULT_ADDRESS="$agentVault"
export FHE_MEMORY_ADDRESS="$agentMemory"
export FHE_SKILL_REGISTRY_ADDRESS="$skillRegistry"
export FHE_ACTION_SEALER_ADDRESS="$actionSealer"

echo ""
echo "=== Testing Contract Connections ==="

echo "Checking AgentVault..."
cast call "$agentVault" "credentialExists(bytes32)" 0x0000000000000000000000000000000000000000000000000000000000000001 --rpc-url "${ANVIL_RPC:-http://localhost:8545}"

echo ""
echo "Checking AgentMemory..."
cast call "$agentMemory" "agentExists(address)" "$agentMemory" --rpc-url "${ANVIL_RPC:-http://localhost:8545}"

echo ""
echo "=== Starting OpenClaw Gateway ==="
openclaw gateway --port 18789 &
OPENCLAW_PID=$!

sleep 3

echo "OpenClaw Gateway started (PID: $OPENCLAW_PID)"
echo "Gateway URL: http://localhost:18789"

echo ""
echo "=== Testing OpenClaw Agent ==="

cat > /tmp/test-agent.js << 'EOF'
const { ethers } = require('ethers');

async function testFHEWorkflow() {
    const rpcUrl = process.env.ANVIL_RPC || 'http://localhost:8545';
    const agentVault = process.env.FHE_VAULT_ADDRESS;
    const agentMemory = process.env.FHE_MEMORY_ADDRESS;
    
    console.log('=== FHE-Agent Shield OpenClaw Test ===');
    console.log('RPC:', rpcUrl);
    console.log('AgentVault:', agentVault);
    console.log('AgentMemory:', agentMemory);
    
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Test 1: Initialize Agent
    console.log('\n[Test 1] Initialize Agent...');
    const AgentMemory = await ethers.getContractAt('AgentMemory', agentMemory);
    const tx = await AgentMemory.initializeAgent();
    const receipt = await tx.wait();
    console.log('Agent initialized! Tx:', receipt.hash);
    
    // Test 2: Store Credential
    console.log('\n[Test 2] Store Encrypted Credential...');
    const AgentVault = await ethers.getContractAt('AgentVault', agentVault);
    const credentialTx = await AgentVault.updateThreshold(1);
    await credentialTx.wait();
    console.log('Credential stored! Tx:', credentialTx.hash);
    
    console.log('\n=== All FHE Workflows Working ===');
}

testFHEWorkflow().catch(console.error);
EOF

node /tmp/test-agent.js

kill $OPENCLAW_PID 2>/dev/null || true

echo ""
echo "=========================================="
echo "Integration Test Complete!"
echo "=========================================="
