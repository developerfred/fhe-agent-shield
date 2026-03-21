# Makefile for FHE-Agent Shield Testnet Flow

.PHONY: help deploy-helium deploy-nitrogen testnet-flow test-vault test-memory verify-helium

# Network RPC URLs
HELIUM_RPC ?= https://api.helium.fhenix.zone
NITROGEN_RPC ?= https://api.nitrogen.fhenix.zone

# Contract addresses (set after deployment)
AGENT_VAULT ?= 0x0000000000000000000000000000000000000000
AGENT_MEMORY ?= 0x0000000000000000000000000000000000000000

help:
	@echo "FHE-Agent Shield Testnet Flow"
	@echo ""
	@echo "Available targets:"
	@echo "  deploy-helium    - Deploy contracts to Helium testnet"
	@echo "  deploy-nitrogen   - Deploy contracts to Nitrogen testnet"
	@echo "  testnet-flow     - Run full credential flow"
	@echo "  test-vault       - Test vault operations only"
	@echo "  test-memory      - Test memory operations only"
	@echo "  verify-helium    - Verify contracts on Helium explorer"

deploy-helium:
	@echo "Deploying to Helium testnet..."
	@forge script script/Deploy.s.sol \
		--rpc-url $(HELIUM_RPC) \
		--broadcast \
		--verify \
		-vvvv

deploy-nitrogen:
	@echo "Deploying to Nitrogen testnet..."
	@forge script script/Deploy.s.sol \
		--rpc-url $(NITROGEN_RPC) \
		--broadcast \
		-vvvv

testnet-flow: test-vault test-memory
	@echo ""
	@echo "=== Full Flow Complete ==="

test-vault:
	@echo "Testing vault operations..."
	@npx ts-node scripts/test-vault.ts \
		--network helium \
		--vault $(AGENT_VAULT)

test-memory:
	@echo "Testing memory operations..."
	@npx ts-node scripts/test-memory.ts \
		--network helium \
		--memory $(AGENT_MEMORY)

verify-helium:
	@echo "Verifying contracts on Helium..."
	@forge verify-contract \
		--rpc-url $(HELIUM_RPC) \
		AGENT_VAULT \
		./contracts/AgentVault.sol:AgentVault
	@forge verify-contract \
		--rpc-url $(HELIUM_RPC) \
		AGENT_MEMORY \
		./contracts/AgentMemory.sol:AgentMemory
