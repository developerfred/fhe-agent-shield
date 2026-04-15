# FHE-Agent Shield: Multi-Chain DevX Roadmap

> **Developer Experience for the CoFHE-supported host chains: Ethereum Sepolia, Arbitrum Sepolia, Base Sepolia**

---

## Overview

Fhenix CoFHE is a **coprocessor**, not a chain. FHE-Agent Shield contracts deploy on existing EVM host chains and call
CoFHE through `FHE.sol` for encrypted computation. The legacy Fhenix L2 testnets (Helium, Nitrogen) have been retired.

The currently supported testnets — per the
[official compatibility matrix](https://cofhe-docs.fhenix.zone/get-started/introduction/compatibility) — are:

- **Ethereum Sepolia** — host chain for CoFHE (`eth-sepolia`)
- **Arbitrum Sepolia** — host chain for CoFHE (`arb-sepolia`)
- **Base Sepolia** — host chain for CoFHE (`base-sepolia`)

This document outlines our strategy for making deployment and development **effortless across every CoFHE-supported
chain**.

---

## Network Configuration

### Supported Networks

| Network              | Chain ID | RPC URL                                  | Explorer                       | Faucet                                                                    |
| -------------------- | -------- | ---------------------------------------- | ------------------------------ | ------------------------------------------------------------------------- |
| **Ethereum Sepolia** | 11155111 | `https://rpc.sepolia.org`                | `https://sepolia.etherscan.io` | [Alchemy](https://www.alchemy.com/faucets/ethereum-sepolia)               |
| **Arbitrum Sepolia** | 421614   | `https://sepolia-rollup.arbitrum.io/rpc` | `https://sepolia.arbiscan.io`  | [QuickNode](https://faucet.quicknode.com/arbitrum/sepolia)                |
| **Base Sepolia**     | 84532    | `https://sepolia.base.org`               | `https://sepolia.basescan.org` | [Coinbase](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet) |

### Foundry Configuration

Update `foundry.toml` with the CoFHE-supported host chains:

```toml
[rpc_endpoints]
# Local
localhost = "http://localhost:8545"

# CoFHE-supported host chains (testnets)
sepolia = "https://sepolia.infura.io/v3/${API_KEY_INFURA}"
arbitrumSepolia = "https://sepolia-rollup.arbitrum.io/rpc"
baseSepolia = "https://sepolia.base.org"

# Ethereum mainnet (CoFHE mainnet TBA)
mainnet = "https://eth-mainnet.g.alchemy.com/v2/${API_KEY_ALCHEMY}"
```

---

## Developer Workflow

### Quick Start (Any Network)

```bash
# 1. Clone and install
git clone https://github.com/codingsh/fhenix-ecossystem
cd fhe-agent-shield
bun install

# 2. Set environment
cp .env.example .env
# Edit .env with your PRIVATE_KEY

# 3. Build contracts
forge build

# 4. Run tests
forge test

# 5. Deploy to ANY supported host chain
forge script script/DeployAll.s.sol \
  --rpc-url $SEPOLIA_RPC \
  --broadcast \
  --verify
```

### One-Command Deployment

```bash
# Deploy to Ethereum Sepolia (default)
make deploy:sepolia

# Deploy to Arbitrum Sepolia
make deploy:arbitrum-sepolia

# Deploy to Base Sepolia
make deploy:base-sepolia
```

### Environment Variables

Create `.env` with network-specific variables:

```bash
# Private Key
PRIVATE_KEY=0x...

# CoFHE-supported host chains (testnets)
SEPOLIA_RPC=https://sepolia.infura.io/v3/${API_KEY_INFURA}
SEPOLIA_CHAIN_ID=11155111

ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
ARBITRUM_SEPOLIA_CHAIN_ID=421614

BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_SEPOLIA_CHAIN_ID=84532

# Explorer API Keys
ETHERSCAN_API_KEY=...
ARBISCAN_API_KEY=...
BASESCAN_API_KEY=...
```

---

## Makefile Commands

### Target: Multi-Chain Deployment

```makefile
# ===========================================
# NETWORK CONFIGURATION
# ===========================================

NETWORK ?= sepolia
RPC_URL = $(shell cat .env | grep $(NETWORK) | cut -d'=' -f2)

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
# DEPLOYMENT (All Networks)
# ===========================================

deploy:
	forge script script/DeployAll.s.sol \
		--rpc-url $(RPC_URL) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify

deploy:sepolia:
	@NETWORK=sepolia \
	forge script script/DeployAll.s.sol \
		--rpc-url $${SEPOLIA_RPC:-https://rpc.sepolia.org} \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		--verify \
		--etherscan-api-key $(API_KEY_ETHERSCAN)

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
# INTERACT (via cast)
# ===========================================

console:
	forge script script/DeployAll.s.sol --rpc-url $(RPC_URL)

cast:call:
	@read -p "Contract: " CONTRACT && \
	read -p "Method: " METHOD && \
	cast call $$CONTRACT "$$METHOD" --rpc-url $(RPC_URL)

cast:send:
	@read -p "Contract: " CONTRACT && \
	read -p "Method: " METHOD && \
	read -p "Args: " ARGS && \
	cast send $$CONTRACT "$$METHOD" $$ARGS --rpc-url $(RPC_URL) --private-key $(PRIVATE_KEY)

# ===========================================
# VERIFICATION
# ===========================================

verify:
	@forge verify-contract \
		--rpc-url $(RPC_URL) \
		--etherscan-api-key $(ETHERSCAN_API_KEY)

# ===========================================
# DOCUMENTATION
# ===========================================

docs:gen
	forge doc --out docs

docs:serve:
	cd docs && bun run preview
```

---

## Deployment Scripts

### Multi-Chain Deploy Script

Create `script/MultiChainDeploy.s.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.25 <0.9.0;

import { Script, console2 } from "forge-std/src/Script.sol";
import { AgentVault } from "../src/contracts/AgentVault.sol";
import { AgentMemory } from "../src/contracts/AgentMemory.sol";
import { SkillRegistry } from "../src/contracts/SkillRegistry.sol";
import { ActionSealer } from "../src/contracts/ActionSealer.sol";
import { ExampleToken } from "../src/FHERC20.sol";

struct Deployment {
    string network;
    address agentVault;
    address agentMemory;
    address skillRegistry;
    address actionSealer;
    address exampleToken;
    uint256 blockNumber;
}

contract MultiChainDeploy is Script {

    // Supported CoFHE host chains
    enum Network {
        EthereumSepolia,
        ArbitrumSepolia,
        BaseSepolia
    }

    mapping(Network => string) public networkNames;
    mapping(Network => uint256) public chainIds;

    Deployment[] public deployments;

    function run() external returns (Deployment[] memory) {
        delete deployments;

        // Get network from environment
        Network targetNetwork = getNetworkFromEnv();

        console2.log("Deploying to network:", networkNames[targetNetwork]);
        console2.log("Chain ID:", chainIds[targetNetwork]);

        vm.startBroadcast();

        AgentVault agentVault = new AgentVault();
        console2.log("AgentVault deployed at:", address(agentVault));

        AgentMemory agentMemory = new AgentMemory();
        console2.log("AgentMemory deployed at:", address(agentMemory));

        SkillRegistry skillRegistry = new SkillRegistry();
        console2.log("SkillRegistry deployed at:", address(skillRegistry));

        ActionSealer actionSealer = new ActionSealer();
        console2.log("ActionSealer deployed at:", address(actionSealer));

        ExampleToken exampleToken = new ExampleToken("FHE Agent Token", "FHET", 1000000);
        console2.log("ExampleToken deployed at:", address(exampleToken));

        vm.stopBroadcast();

        // Record deployment
        deployments.push(Deployment({
            network: networkNames[targetNetwork],
            agentVault: address(agentVault),
            agentMemory: address(agentMemory),
            skillRegistry: address(skillRegistry),
            actionSealer: address(actionSealer),
            exampleToken: address(exampleToken),
            blockNumber: block.number
        }));

        return deployments;
    }

    function getNetworkFromEnv() internal returns (Network) {
        string memory networkStr = vm.envString("NETWORK");

        if (keccak256(abi.encodePacked(networkStr)) == keccak256(abi.encodePacked("sepolia"))) {
            return Network.EthereumSepolia;
        } else if (keccak256(abi.encodePacked(networkStr)) == keccak256(abi.encodePacked("arbitrum-sepolia"))) {
            return Network.ArbitrumSepolia;
        } else if (keccak256(abi.encodePacked(networkStr)) == keccak256(abi.encodePacked("base-sepolia"))) {
            return Network.BaseSepolia;
        }

        revert("Unknown network");
    }
}
```

---

## TypeScript SDK Multi-Chain Support

### Network Configuration

Create `src/config/networks.ts`:

```typescript
export const NETWORKS = {
  "ethereum-sepolia": {
    name: "Ethereum Sepolia",
    rpcUrl: "https://rpc.sepolia.org",
    chainId: 11155111,
    explorer: "https://sepolia.etherscan.io",
    explorerApi: "https://api-sepolia.etherscan.io/api",
  },
  "arbitrum-sepolia": {
    name: "Arbitrum Sepolia",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    chainId: 421614,
    explorer: "https://sepolia.arbiscan.io",
    explorerApi: "https://api-sepolia.arbiscan.io/api",
  },
  "base-sepolia": {
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    chainId: 84532,
    explorer: "https://sepolia.basescan.org",
    explorerApi: "https://api-sepolia.basescan.org/api",
  },
} as const;

export type NetworkName = keyof typeof NETWORKS;
```

### SDK Initialization

```typescript
import { createPublicClient, createWalletClient, http, custom } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { NETWORKS, NetworkName } from "./config/networks";
import { AgentVault } from "./contracts/AgentVault";
import { AgentMemory } from "./contracts/AgentMemory";

export interface FHEAgentSDK {
  network: NetworkName;
  publicClient: ReturnType<typeof createPublicClient>;
  walletClient: ReturnType<typeof createWalletClient>;
  agentVault: AgentVault;
  agentMemory: AgentMemory;
}

export function createFHEAgentSDK(network: NetworkName, privateKey: `0x${string}`): FHEAgentSDK {
  const config = NETWORKS[network];
  const account = privateKeyToAccount(privateKey);

  const publicClient = createPublicClient({
    transport: http(config.rpcUrl),
    chainId: config.chainId,
  });

  const walletClient = createWalletClient({
    account,
    transport: http(config.rpcUrl),
    chainId: config.chainId,
  });

  return {
    network,
    publicClient,
    walletClient,
    // Contracts will be initialized with deployed addresses
    agentVault: new AgentVault(config.contracts.agentVault),
    agentMemory: new AgentMemory(config.contracts.agentMemory),
  };
}
```

---

## Testing Matrix

### Network-Specific Tests

```bash
# Test on all networks
make test:allNetworks

# Individual network tests
make test:sepolia          # NETWORK=sepolia forge test
make test:arbitrum-sepolia # NETWORK=arbitrum-sepolia forge test
make test:base-sepolia     # NETWORK=base-sepolia forge test

# Fork tests
make fork:test:sepolia
make fork:test:arbitrum-sepolia
make fork:test:base-sepolia
```

### Test Coverage Matrix

| Contract      | Ethereum Sepolia | Arbitrum Sepolia | Base Sepolia |
| ------------- | ---------------- | ---------------- | ------------ |
| AgentVault    | ✅               | ✅               | ✅           |
| AgentMemory   | ✅               | ✅               | ✅           |
| SkillRegistry | ✅               | ✅               | ✅           |
| ActionSealer  | ✅               | ✅               | ✅           |
| FHERC20       | ✅               | ✅               | ✅           |

---

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/multi-chain.yml`:

```yaml
name: Multi-Chain Deployment

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        network: [sepolia, arbitrum-sepolia, base-sepolia]

    steps:
      - uses: actions/checkout@v4

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build contracts
        run: forge build

      - name: Run tests
        run: forge test --fork-url ${{ matrix.network }}

      - name: Run coverage
        if: matrix.network == 'sepolia'
        run: forge coverage

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment:
      name: ${{ matrix.network }}
    strategy:
      matrix:
        include:
          - network: sepolia
            rpc: https://rpc.sepolia.org
          - network: arbitrum-sepolia
            rpc: https://sepolia-rollup.arbitrum.io/rpc
          - network: base-sepolia
            rpc: https://sepolia.base.org

    steps:
      - uses: actions/checkout@v4

      - name: Install Foundry
        uses: foundry-rs/foundry-toolchain@v1

      - name: Deploy
        run: |
          forge script script/DeployAll.s.sol \
            --rpc-url ${{ matrix.rpc }} \
            --private-key ${{ secrets.DEPLOYER_PRIVATE_KEY }} \
            --broadcast \
            --verify
        env:
          NETWORK: ${{ matrix.network }}
```

---

## Deployment Addresses Registry

### Ethereum Sepolia (Chain ID: 11155111)

| Contract      | Address | TX Hash |
| ------------- | ------- | ------- |
| AgentVault    | `TBD`   | `TBD`   |
| AgentMemory   | `TBD`   | `TBD`   |
| SkillRegistry | `TBD`   | `TBD`   |
| ActionSealer  | `TBD`   | `TBD`   |
| ExampleToken  | `TBD`   | `TBD`   |

### Arbitrum Sepolia (Chain ID: 421614)

| Contract      | Address | TX Hash |
| ------------- | ------- | ------- |
| AgentVault    | `TBD`   | `TBD`   |
| AgentMemory   | `TBD`   | `TBD`   |
| SkillRegistry | `TBD`   | `TBD`   |
| ActionSealer  | `TBD`   | `TBD`   |
| ExampleToken  | `TBD`   | `TBD`   |

### Base Sepolia (Chain ID: 84532)

| Contract      | Address | TX Hash |
| ------------- | ------- | ------- |
| AgentVault    | `TBD`   | `TBD`   |
| AgentMemory   | `TBD`   | `TBD`   |
| SkillRegistry | `TBD`   | `TBD`   |
| ActionSealer  | `TBD`   | `TBD`   |
| ExampleToken  | `TBD`   | `TBD`   |

---

## Developer Tools

### Cast Commands by Network

```bash
# ===========================================
# ETHEREUM SEPOLIA
# ===========================================

export RPC=${SEPOLIA_RPC:-https://rpc.sepolia.org}
export VAULT=<address>
export PRIVATE_KEY=<key>

# Agent Memory
cast call $VAULT "getCredentialHandle(address)" --rpc-url $RPC

# ===========================================
# ARBITRUM SEPOLIA
# ===========================================

export RPC=https://sepolia-rollup.arbitrum.io/rpc
# Same commands work with different RPC

# ===========================================
# BASE SEPOLIA
# ===========================================

export RPC=https://sepolia.base.org
# Same commands work with different RPC
```

### Network Switching

Add to `package.json`:

```json
{
  "scripts": {
    "network": "node scripts/switchNetwork.js",
    "deploy:sepolia": "NETWORK=sepolia forge script script/DeployAll.s.sol --broadcast --verify",
    "deploy:arb-sepolia": "NETWORK=arbitrum-sepolia forge script script/DeployAll.s.sol --broadcast --verify",
    "deploy:base-sepolia": "NETWORK=base-sepolia forge script script/DeployAll.s.sol --broadcast --verify"
  }
}
```

Create `scripts/switchNetwork.js`:

```javascript
#!/usr/bin/env node
const NETWORKS = require("../src/config/networks.json");

const network = process.argv[2];

if (!NETWORKS[network]) {
  console.error(`Unknown network: ${network}`);
  console.log("Available networks:", Object.keys(NETWORKS).join(", "));
  process.exit(1);
}

console.log(`Switching to ${NETWORKS[network].name}...`);
console.log(`RPC: ${NETWORKS[network].rpcUrl}`);
console.log(`Chain ID: ${NETWORKS[network].chainId}`);
console.log(`Explorer: ${NETWORKS[network].explorer}`);

// Write to .env or display instructions
console.log("\nSet these environment variables:");
console.log(`NETWORK=${network}`);
console.log(`CHAIN_ID=${NETWORKS[network].chainId}`);
console.log(`RPC_URL=${NETWORKS[network].rpcUrl}`);
```

---

## Roadmap Timeline

### Phase 1: Foundation (Week 1)

- [ ] Update foundry.toml with all network RPCs
- [ ] Create MultiChainDeploy.s.sol script
- [ ] Add network configuration to TypeScript SDK
- [ ] Create Makefile with all network targets
- [ ] Update .env.example with all variables

### Phase 2: CLI Enhancement (Week 2)

- [ ] `fhe-agent deploy --network sepolia`
- [ ] `fhe-agent console --network arbitrum-sepolia`
- [ ] `fhe-agent verify --network base-sepolia`
- [ ] `fhe-agent status --network all`
- [ ] Network switcher script

### Phase 3: Documentation (Week 3)

- [ ] Multi-chain deployment guide
- [ ] Network comparison docs
- [ ] Gas optimization guide per network
- [ ] Cross-chain interaction examples
- [ ] Video tutorial series

### Phase 4: CI/CD (Week 4)

- [ ] GitHub Actions workflow for all networks
- [ ] Automated verification on all chains
- [ ] Deployment address registry
- [ ] Slack/Discord notifications
- [ ] Multi-network test matrix

### Phase 5: Advanced (Week 5-6)

- [ ] Cross-chain messaging (LayerZero/Anvil)
- [ ] Unified dashboard
- [ ] Gas tank / multi-chain relay
- [ ] Enterprise deployment templates
- [ ] Kubernetes operator

---

## Quick Reference

### One-Line Deploys

```bash
# Ethereum Sepolia
forge script script/DeployAll.s.sol --rpc-url $SEPOLIA_RPC --broadcast --verify

# Arbitrum Sepolia
forge script script/DeployAll.s.sol --rpc-url https://sepolia-rollup.arbitrum.io/rpc --broadcast --verify

# Base Sepolia
forge script script/DeployAll.s.sol --rpc-url https://sepolia.base.org --broadcast --verify
```

### Environment Setup

```bash
# Copy and configure
cp .env.example .env

# Add your keys
vim .env

# Source for current session
source .env

# Deploy
forge script script/DeployAll.s.sol --rpc-url $SEPOLIA_RPC --broadcast --verify
```

---

## Support

- **Documentation**: [docs/](.)
- **Discord**: [Fhenix Discord](https://discord.gg/fhenix)
- **Issues**: [GitHub Issues](https://github.com/codingsh/fhenix-ecossystem/issues)
