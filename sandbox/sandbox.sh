#!/bin/bash
set -e

echo "=========================================="
echo "FHE-Agent Shield - Local Sandbox"
echo "=========================================="

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

mkdir -p sandbox/deployments

check_anvil() {
    curl -s -X POST http://localhost:8545 -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' > /dev/null 2>&1
}

start_anvil() {
    echo "=== Starting Anvil ==="
    if check_anvil; then
        echo "Anvil already running"
    else
        anvil --host 0.0.0.0 --port 8545 --chain-id 31337 &
        ANVIL_PID=$!
        echo "Anvil started (PID: $ANVIL_PID)"
        
        echo "Waiting for Anvil to be ready..."
        for i in {1..30}; do
            if check_anvil; then
                echo "Anvil is ready!"
                break
            fi
            sleep 1
        done
    fi
}

deploy_contracts() {
    echo ""
    echo "=== Deploying Contracts ==="
    
    forge script script/ForkIntegration.s.sol:ForkIntegrationTest \
        --rpc-url http://localhost:8545 \
        --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
        --broadcast
    
    echo ""
    echo "=== Contract Addresses ==="
    echo "AgentVault: 0x5FbDB2315678afecb367f032d93F642f64180aa3"
    echo "AgentMemory: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
    echo "SkillRegistry: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
    echo "ActionSealer: 0xCf7Ed3AccA5a467e9e704C703E8d87F634fB0Fc9"
}

run_tests() {
    echo ""
    echo "=== Running TypeScript Tests ==="
    npx vitest run test/typescript/openclaw-integration.test.ts
    
    echo ""
    echo "=== Running Solidity Tests ==="
    forge test --summary
}

run_contract_tests() {
    echo ""
    echo "=== Running Contract Interaction Tests ==="
    
    AGENT_VAULT="0xa513E6E4b8f2a923D98304ec87F64353C4D5C853"
    AGENT_MEMORY="0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"
    SKILL_REGISTRY="0x8A791620dd6260079BF849Dc5567aDC3F2FdC318"
    ACTION_SEALER="0x610178dA211FEF7D417bC0e6FeD39F05609AD788"
    
    echo "Using deployed addresses:"
    echo "  AgentVault: $AGENT_VAULT"
    echo "  AgentMemory: $AGENT_MEMORY"
    echo "  SkillRegistry: $SKILL_REGISTRY"
    echo "  ActionSealer: $ACTION_SEALER"
    echo ""
    
    echo "[Test 1] Calling initializeAgent on AgentMemory..."
    RESULT=$(cast send "$AGENT_MEMORY" "initializeAgent()" \
        --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
        --rpc-url http://localhost:8545 2>&1)
    if echo "$RESULT" | grep -q "status.*1.*success"; then
        echo "✓ initializeAgent succeeded"
    else
        echo "✗ initializeAgent failed"
    fi
    
    echo ""
    echo "[Test 2] Calling updateThreshold on AgentVault..."
    RESULT=$(cast send "$AGENT_VAULT" "updateThreshold(uint8)" 2 \
        --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
        --rpc-url http://localhost:8545 2>&1)
    if echo "$RESULT" | grep -q "status.*1.*success"; then
        echo "✓ updateThreshold succeeded"
    else
        echo "✗ updateThreshold failed"
    fi
    
    echo ""
    echo "[Test 3] Registering skill on SkillRegistry..."
    RESULT=$(cast send "$SKILL_REGISTRY" "registerSkill(bytes32,bytes32)" \
        0x1234567890123456789012345678901234567890123456789012345678901234 \
        0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd \
        --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
        --rpc-url http://localhost:8545 2>&1)
    if echo "$RESULT" | grep -q "status.*1.*success"; then
        echo "✓ registerSkill succeeded"
    else
        echo "✗ registerSkill failed"
    fi
    
    echo ""
    echo "[Test 4] Sealing action on ActionSealer..."
    RESULT=$(cast send "$ACTION_SEALER" "sealAction(address,bytes)" \
        0x7F7915573c7e97B47eFa546f5F6E3230263BcB49 \
        0xabcd \
        --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
        --rpc-url http://localhost:8545 2>&1)
    if echo "$RESULT" | grep -q "status.*1.*success"; then
        echo "✓ sealAction succeeded"
    else
        echo "✗ sealAction failed"
    fi
}

ACTION="${1:-all}"

case "$ACTION" in
    anvil)
        start_anvil
        ;;
    deploy)
        start_anvil
        deploy_contracts
        ;;
    test)
        run_tests
        ;;
    contract-test)
        start_anvil
        deploy_contracts
        run_contract_tests
        ;;
    all)
        start_anvil
        deploy_contracts
        run_contract_tests
        run_tests
        ;;
    clean)
        echo "=== Cleaning Up ==="
        pkill -f "anvil" 2>/dev/null || true
        echo "Anvil stopped"
        ;;
    *)
        echo "Usage: $0 {anvil|deploy|test|contract-test|all|clean}"
        ;;
esac
