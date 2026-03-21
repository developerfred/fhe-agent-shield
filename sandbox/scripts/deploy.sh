#!/bin/bash
set -e

echo "=========================================="
echo "FHE-Agent Shield - Deploy to Anvil"
echo "=========================================="

RPC_URL="${RPC_URL:-http://localhost:8545}"
DEPLOYMENT_FILE="${DEPLOYMENT_FILE:-/app/deployments/addresses.json}"

echo "RPC URL: $RPC_URL"
echo "Deployment file: $DEPLOYMENT_FILE"

echo ""
echo "=== Deploying Contracts ==="

echo "Deploying AgentVault..."
AGENT_VAULT=$(forge script script/ForkIntegration.s.sol:DeployToAnvil \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast \
  --json 2>/dev/null | grep -o '"agentVault":"[^"]*"' | cut -d'"' -f4)

echo "AgentVault: $AGENT_VAULT"

echo ""
echo "=== Deployment Complete ==="
echo "AgentVault: $AGENT_VAULT"
echo "AgentMemory: $AGENT_MEMORY"
echo "SkillRegistry: $AGENT_MEMORY"
echo "ActionSealer: $ACTION_SEALER"

mkdir -p "$(dirname "$DEPLOYMENT_FILE")"
cat > "$DEPLOYMENT_FILE" << EOF
{
  "agentVault": "$AGENT_VAULT",
  "agentMemory": "$AGENT_MEMORY",
  "skillRegistry": "$SKILL_REGISTRY",
  "actionSealer": "$ACTION_SEALER",
  "network": "anvil",
  "chainId": 31337
}
EOF

echo ""
echo "Deployment addresses saved to $DEPLOYMENT_FILE"
cat "$DEPLOYMENT_FILE"
