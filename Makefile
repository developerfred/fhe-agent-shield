.PHONY: install build test test:coverage test:ts lint clean clean:all
.PHONY: deploy deploy:fhenix-helium deploy:fhenix-nitrogen deploy:arbitrum-sepolia deploy:base-sepolia
.PHONY: fork:test fork:console console cast:call cast:send verify docs

# ===========================================
# CONFIGURATION
# ===========================================

NETWORK ?= fhenix-helium
RPC_URL := $(shell \
	case $(NETWORK) in \
		fhenix-helium) echo "https://api.helium.fhenix.zone" ;; \
		fhenix-nitrogen) echo "https://api.nitrogen.fhenix.zone" ;; \
		arbitrum-sepolia) echo "https://sepolia-rollup.arbitrum.io/rpc" ;; \
		base-sepolia) echo "https://sepolia.base.org" ;; \
		*) echo "https://api.helium.fhenix.zone" ;; \
	esac)

# ===========================================
# DEVELOPMENT
# ===========================================

install:
	bun install

build:
	forge build

test:
	forge test

test:coverage:
	forge coverage --report lcov

test:ts:
	vitest run

lint:
	forge fmt && bun run lint

# ===========================================
# CLEANING
# ===========================================

clean:
	rm -rf out cache broadcast

clean:all: clean
	rm -rf docs/out docs/cache

# ===========================================
# DEPLOYMENT (Multi-Network)
# ===========================================

deploy:
	@echo "Deploying to $(NETWORK)..."
	@echo "RPC: $(RPC_URL)"
	forge script script/DeployAll.s.sol \
		--rpc-url $(RPC_URL) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify

deploy:fhenix-helium:
	forge script script/DeployAll.s.sol \
		--rpc-url https://api.helium.fhenix.zone \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify

deploy:fhenix-nitrogen:
	forge script script/DeployAll.s.sol \
		--rpc-url https://api.nitrogen.fhenix.zone \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify

deploy:arbitrum-sepolia:
	forge script script/DeployAll.s.sol \
		--rpc-url https://sepolia-rollup.arbitrum.io/rpc \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify \
		--etherscan-api-key $(ARBISCAN_API_KEY)

deploy:base-sepolia:
	forge script script/DeployAll.s.sol \
		--rpc-url https://sepolia.base.org \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify \
		--etherscan-api-key $(BASESCAN_API_KEY)

# ===========================================
# FORK TESTING
# ===========================================

fork:test:
	forge test --fork-url $(RPC_URL) -vvv

fork:console:
	forge console --fork-url $(RPC_URL)

# ===========================================
# CONSOLE
# ===========================================

console:
	forge script script/DeployAll.s.sol --rpc-url $(RPC_URL)

# ===========================================
# CAST HELPERS
# ===========================================

cast:call:
	@echo "Contract address:"; read CONTRACT; \
	echo "Method (with args if any):"; read METHOD; \
	cast call $$CONTRACT "$$METHOD" --rpc-url $(RPC_URL)

cast:send:
	@echo "Contract address:"; read CONTRACT; \
	echo "Method:"; read METHOD; \
	echo "Args (space separated):"; read ARGS; \
	cast send $$CONTRACT "$$METHOD" $$ARGS --rpc-url $(RPC_URL) --private-key $(PRIVATE_KEY)

# ===========================================
# VERIFICATION
# ===========================================

verify:
	@echo "Verifying contract..."
	@read -p "Contract address: " CONTRACT; \
	forge verify-contract \
		--rpc-url $(RPC_URL) \
		--etherscan-api-key $(ETHERSCAN_API_KEY) \
		$$CONTRACT

# ===========================================
# DOCUMENTATION
# ===========================================

docs:gen:
	forge doc --out docs

docs:serve:
	cd docs && bun run preview

# ===========================================
# HELP
# ===========================================

help:
	@echo "FHE-Agent Shield - Available Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install        # Install dependencies"
	@echo "  make build          # Build contracts"
	@echo "  make test           # Run tests"
	@echo "  make test:coverage  # Coverage report"
	@echo "  make lint           # Format and lint"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy                    # Deploy to NETWORK (default: fhenix-helium)"
	@echo "  make deploy:fhenix-helium      # Deploy to Fhenix Helium"
	@echo "  make deploy:fhenix-nitrogen    # Deploy to Fhenix Nitrogen"
	@echo "  make deploy:arbitrum-sepolia   # Deploy to Arbitrum Sepolia"
	@echo "  make deploy:base-sepolia       # Deploy to Base Sepolia"
	@echo ""
	@echo "Examples:"
	@echo "  NETWORK=fhenix-nitrogen make deploy"
	@echo "  make deploy:arbitrum-sepolia"
	@echo ""
	@echo "Fork Testing:"
	@echo "  make fork:test                  # Fork current network"
	@echo "  make fork:console                # Open console on forked network"
	@echo ""
	@echo "Set PRIVATE_KEY env var for deployments"
