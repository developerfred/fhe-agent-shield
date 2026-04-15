# Makefile for FHE-Agent Shield Testnet Flow

.PHONY: help deploy-sepolia deploy-arbitrum-sepolia testnet-flow test-vault test-memory verify-sepolia

# Network RPC URLs
SEPOLIA_RPC ?= https://rpc.sepolia.org
ARBITRUM_SEPOLIA_RPC ?= https://sepolia-rollup.arbitrum.io/rpc

# Contract addresses (set after deployment)
AGENT_VAULT ?= 0x0000000000000000000000000000000000000000
AGENT_MEMORY ?= 0x0000000000000000000000000000000000000000

help:
	@echo "FHE-Agent Shield Testnet Flow"
	@echo ""
	@echo "Available targets:"
	@echo "  deploy-sepolia    - Deploy contracts to Ethereum Sepolia testnet"
	@echo "  deploy-arbitrum-sepolia   - Deploy contracts to Arbitrum Sepolia testnet"
	@echo "  testnet-flow     - Run full credential flow"
	@echo "  test-vault       - Test vault operations only"
	@echo "  test-memory      - Test memory operations only"
	@echo "  verify-sepolia    - Verify contracts on Sepolia explorer"

deploy-sepolia:
	@echo "Deploying to Ethereum Sepolia testnet..."
	@forge script script/Deploy.s.sol \
		--rpc-url $(SEPOLIA_RPC) \
		--broadcast \
		--verify \
		-vvvv

deploy-arbitrum-sepolia:
	@echo "Deploying to Arbitrum Sepolia testnet..."
	@forge script script/Deploy.s.sol \
		--rpc-url $(ARBITRUM_SEPOLIA_RPC) \
		--broadcast \
		-vvvv

testnet-flow: test-vault test-memory
	@echo ""
	@echo "=== Full Flow Complete ==="

test-vault:
	@echo "Testing vault operations..."
	@npx ts-node scripts/test-vault.ts \
		--network sepolia \
		--vault $(AGENT_VAULT)

test-memory:
	@echo "Testing memory operations..."
	@npx ts-node scripts/test-memory.ts \
		--network sepolia \
		--memory $(AGENT_MEMORY)

verify-sepolia:
	@echo "Verifying contracts on Sepolia..."
	@forge verify-contract \
		--rpc-url $(SEPOLIA_RPC) \
		AGENT_VAULT \
		./contracts/AgentVault.sol:AgentVault
	@forge verify-contract \
		--rpc-url $(SEPOLIA_RPC) \
		AGENT_MEMORY \
		./contracts/AgentMemory.sol:AgentMemory
