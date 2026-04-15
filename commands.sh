#!/bin/bash
# Cast Commands for FHE-Agent Shield
# Run these after deploying contracts

# Configuration - UPDATE THESE AFTER DEPLOYMENT
export VAULT="0x..."        # AgentVault address
export MEMORY="0x..."       # AgentMemory address  
export SKILLS="0x..."       # SkillRegistry address
export SEALER="0x..."       # ActionSealer address
export RPC="https://rpc.sepolia.org"
export PRIVATE_KEY="0x..."  # Your private key

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}FHE-Agent Shield - Cast Commands${NC}"
echo -e "${CYAN}========================================${NC}"

# Check if addresses are set
if [ "$VAULT" = "0x..." ]; then
    echo -e "${RED}Please update contract addresses first!${NC}"
    exit 1
fi

# ============================================
# AGENT MEMORY COMMANDS
# ============================================
echo ""
echo -e "${GREEN}[Agent Memory]${NC}"

echo "Initialize Agent:"
echo "  cast send $MEMORY \"initializeAgent()\" --rpc-url $RPC --private-key $PRIVATE_KEY"

echo ""
echo "Append Context (encrypted data):"
echo "  cast send $MEMORY \"appendContext(address,bytes32)\" --rpc-url $RPC --private-key $PRIVATE_KEY $VAULT 0x..."

echo ""
echo "Get Context Slice:"
echo "  cast call $MEMORY \"getContextSlice(address,uint256,uint256)\" --rpc-url $RPC $VAULT 0 10"

echo ""
echo "Snapshot Context:"
echo "  cast send $MEMORY \"snapshotContext(address)\" --rpc-url $RPC --private-key $PRIVATE_KEY $VAULT"

echo ""
echo "Restore from Snapshot:"
echo "  cast send $MEMORY \"restoreFromSnapshot(address,address)\" --rpc-url $RPC --private-key $PRIVATE_KEY $VAULT <snapshotId>"

# ============================================
# AGENT VAULT COMMANDS
# ============================================
echo ""
echo -e "${GREEN}[Agent Vault]${NC}"

echo "Store Credential (encrypted):"
echo "  cast send $VAULT \"storeCredential(address,bytes32)\" --rpc-url $RPC --private-key $PRIVATE_KEY $VAULT 0x..."

echo ""
echo "Get Credential Handle:"
echo "  cast call $VAULT \"getCredentialHandle(address)\" --rpc-url $RPC $VAULT"

echo ""
echo "Check Credential Exists:"
echo "  cast call $VAULT \"credentialExists(bytes32)\" --rpc-url $RPC <handle>"

echo ""
echo "Grant Retrieve Permission:"
echo "  cast send $VAULT \"grantRetrievePermission(address,bytes32)\" --rpc-url $RPC --private-key $PRIVATE_KEY <grantee> <handle>"

echo ""
echo "Update Threshold:"
echo "  cast send $VAULT \"updateThreshold(address,uint8)\" --rpc-url $RPC --private-key $PRIVATE_KEY $VAULT 2"

# ============================================
# SKILL REGISTRY COMMANDS
# ============================================
echo ""
echo -e "${GREEN}[Skill Registry]${NC}"

echo "Register Skill:"
echo "  cast send $SKILLS \"registerSkill(bytes32,bytes32)\" --rpc-url $RPC --private-key $PRIVATE_KEY 0x... 0x..."

echo ""
echo "Get Skill Info:"
echo "  cast call $SKILLS \"getSkill(address)\" --rpc-url $RPC <skillId>"

echo ""
echo "Verify Skill:"
echo "  cast send $SKILLS \"verifySkill(address)\" --rpc-url $RPC --private-key $PRIVATE_KEY <skillId>"

echo ""
echo "Rate Skill (1-5):"
echo "  cast send $SKILLS \"rateSkill(address,uint256)\" --rpc-url $RPC --private-key $PRIVATE_KEY <skillId> 5"

echo ""
echo "Get Skill Rating:"
echo "  cast call $SKILLS \"getSkillRating(address)\" --rpc-url $RPC <skillId>"

echo ""
echo "Execute Skill:"
echo "  cast send $SKILLS \"executeSkill(address,bytes)\" --rpc-url $RPC --private-key $PRIVATE_KEY <skillId> 0x..."

# ============================================
# ACTION SEALER COMMANDS
# ============================================
echo ""
echo -e "${GREEN}[Action Sealer]${NC}"

echo "Seal Action:"
echo "  cast send $SEALER \"sealAction(address,bytes)\" --rpc-url $RPC --private-key $PRIVATE_KEY $VAULT 0x..."

echo ""
echo "Get Action Status:"
echo "  cast call $SEALER \"getActionStatus(address)\" --rpc-url $RPC <actionId>"

echo ""
echo "Register Release Condition:"
echo "  cast send $SEALER \"registerReleaseCondition(address,uint256,uint256)\" --rpc-url $RPC --private-key $PRIVATE_KEY <actionId> 2 3600"

echo ""
echo "Get Release Condition:"
echo "  cast call $SEALER \"getReleaseCondition(address)\" --rpc-url $RPC <actionId>"

echo ""
echo "Approve Release:"
echo "  cast send $SEALER \"approveRelease(address)\" --rpc-url $RPC --private-key $PRIVATE_KEY <actionId>"

echo ""
echo "Release Action:"
echo "  cast send $SEALER \"releaseAction(address)\" --rpc-url $RPC --private-key $PRIVATE_KEY <actionId>"

echo ""
echo "Cancel Action:"
echo "  cast send $SEALER \"cancelAction(address)\" --rpc-url $RPC --private-key $PRIVATE_KEY <actionId>"

echo ""
echo -e "${CYAN}========================================${NC}"
echo "Run individual commands by copying them to your terminal"
echo "==========================================="
