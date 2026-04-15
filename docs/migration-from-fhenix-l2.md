# Migration Guide: Fhenix L2 (Helium / Nitrogen) to Fhenix CoFHE Coprocessor

> Audience: teams that deployed contracts or clients against the legacy Fhenix Helium (chain ID `8008135`) or Nitrogen
> (chain ID `8008148`) testnets and need to port their work to the current Fhenix CoFHE coprocessor model.

---

## 1. TL;DR

- **Fhenix is no longer a standalone chain.** CoFHE is a coprocessor (off-chain FheOS Server + Threshold Network +
  on-chain contracts) that plugs into existing EVM host chains.
- **Helium and Nitrogen are retired.** Deploy to Ethereum Sepolia (`11155111`), Arbitrum Sepolia (`421614`), or Base
  Sepolia (`84532`) instead.
- **SDK renamed:** `cofhejs` is now `@cofhe/sdk@^0.4.0`.
- **Contracts renamed:** `@fhenixprotocol/contracts` is now `@fhenixprotocol/cofhe-contracts@^0.1.3`.
- **New Hardhat plugin:** add `@cofhe/hardhat-plugin@^0.4.0` to your toolchain.

---

## 2. Background

### What changed

Previously, Fhenix shipped its own L2 rollup with dedicated testnets:

| Legacy Testnet | Chain ID  | Status      |
| -------------- | --------- | ----------- |
| Helium         | `8008135` | **Retired** |
| Nitrogen       | `8008148` | **Retired** |

These testnets bundled FHE operations directly into the chain's execution layer. That model is replaced by **CoFHE** --
a coprocessor architecture where:

1. **FheOS Server** runs off-chain and performs homomorphic computation.
2. **Threshold Network** manages distributed key generation and threshold decryption.
3. **On-chain contracts** (`@fhenixprotocol/cofhe-contracts`) deploy to standard EVM host chains and coordinate
   ciphertext lifecycle via a Task Manager.

FHE-enabled contracts now live on the same chain as the rest of your stack -- Sepolia, Arbitrum Sepolia, or Base
Sepolia. No separate chain, no separate gas token, no separate block explorer.

### Why

- Eliminates bridge overhead between host chain and Fhenix L2.
- Leverages existing host chain infrastructure (RPCs, explorers, faucets).
- Supports multi-chain deployment from day one.
- Simplifies DevOps: one chain to monitor, one set of RPCs, one explorer.

### Compatibility matrix

See the official compatibility table for the latest supported host chains:

<https://cofhe-docs.fhenix.zone/get-started/introduction/compatibility>

---

## 3. Step-by-Step Migration

### 3a. Pick a host chain

| Host Chain       | Chain ID   | RPC Endpoint                             | Explorer                       |
| ---------------- | ---------- | ---------------------------------------- | ------------------------------ |
| Ethereum Sepolia | `11155111` | `https://sepolia.infura.io/v3/<KEY>`     | `https://sepolia.etherscan.io` |
| Arbitrum Sepolia | `421614`   | `https://sepolia-rollup.arbitrum.io/rpc` | `https://sepolia.arbiscan.io`  |
| Base Sepolia     | `84532`    | `https://sepolia.base.org`               | `https://sepolia.basescan.org` |

Choose based on where the rest of your protocol lives or where gas is cheapest for your testing needs. All three chains
have identical CoFHE functionality.

---

### 3b. Update dependencies

#### npm / pnpm

```diff
  // package.json
  {
    "dependencies": {
-     "cofhejs": "^0.3.x",
-     "@fhenixprotocol/contracts": "*"
+     "@cofhe/sdk": "^0.4.0",
+     "@fhenixprotocol/cofhe-contracts": "^0.1.3"
    },
    "devDependencies": {
-     "hardhat": "^2.x"
+     "hardhat": "^2.x",
+     "@cofhe/hardhat-plugin": "^0.4.0"
    }
  }
```

Then reinstall:

```bash
# pnpm
pnpm remove cofhejs @fhenixprotocol/contracts
pnpm add @cofhe/sdk@^0.4.0 @fhenixprotocol/cofhe-contracts@^0.1.3
pnpm add -D @cofhe/hardhat-plugin@^0.4.0

# npm
npm uninstall cofhejs @fhenixprotocol/contracts
npm install @cofhe/sdk@^0.4.0 @fhenixprotocol/cofhe-contracts@^0.1.3
npm install -D @cofhe/hardhat-plugin@^0.4.0
```

#### Foundry (git submodules / remappings)

If you were pulling in Fhenix contracts via forge:

```diff
  # .gitmodules or forge install
- forge install fhenixprotocol/fhenix-contracts
+ forge install fhenixprotocol/cofhe-contracts

  # remappings.txt
- @fhenixprotocol/contracts/=lib/fhenix-contracts/contracts/
+ @fhenixprotocol/cofhe-contracts/=lib/cofhe-contracts/contracts/
```

For test mocks, add the mock contracts submodule:

```bash
forge install fhenixprotocol/cofhe-mock-contracts
```

---

### 3c. Update RPC / chain ID configs

#### Environment variables

```diff
  # .env
- FHENIX_HELIUM_RPC="https://api.helium.fhenix.zone"
- FHENIX_HELIUM_CHAIN_ID=8008135
- FHENIX_NITROGEN_RPC="https://api.nitrogen.fhenix.zone"
- FHENIX_NITROGEN_CHAIN_ID=8008148
+ SEPOLIA_RPC="https://sepolia.infura.io/v3/${API_KEY_INFURA}"
+ SEPOLIA_CHAIN_ID=11155111
+ ARBITRUM_SEPOLIA_RPC="https://sepolia-rollup.arbitrum.io/rpc"
+ ARBITRUM_SEPOLIA_CHAIN_ID=421614
+ BASE_SEPOLIA_RPC="https://sepolia.base.org"
+ BASE_SEPOLIA_CHAIN_ID=84532
```

#### Hardhat config

```diff
  // hardhat.config.ts
+ import "@cofhe/hardhat-plugin";

  const config: HardhatUserConfig = {
    networks: {
-     helium: {
-       url: process.env.FHENIX_HELIUM_RPC,
-       chainId: 8008135,
-       accounts: [process.env.PRIVATE_KEY!],
-     },
-     nitrogen: {
-       url: process.env.FHENIX_NITROGEN_RPC,
-       chainId: 8008148,
-       accounts: [process.env.PRIVATE_KEY!],
-     },
+     sepolia: {
+       url: process.env.SEPOLIA_RPC,
+       chainId: 11155111,
+       accounts: [process.env.PRIVATE_KEY!],
+     },
+     arbitrumSepolia: {
+       url: process.env.ARBITRUM_SEPOLIA_RPC,
+       chainId: 421614,
+       accounts: [process.env.PRIVATE_KEY!],
+     },
+     baseSepolia: {
+       url: process.env.BASE_SEPOLIA_RPC,
+       chainId: 84532,
+       accounts: [process.env.PRIVATE_KEY!],
+     },
    },
  };
```

#### Foundry (`foundry.toml`)

```diff
  [rpc_endpoints]
- fhenixHelium = "https://api.helium.fhenix.zone"
- fhenixNitrogen = "https://api.nitrogen.fhenix.zone"
+ sepolia = "https://sepolia.infura.io/v3/${API_KEY_INFURA}"
+ arbitrumSepolia = "https://sepolia-rollup.arbitrum.io/rpc"
+ baseSepolia = "https://sepolia.base.org"
```

---

### 3d. Update Solidity imports

The FHE type library moved from `@fhenixprotocol/contracts` to `@fhenixprotocol/cofhe-contracts`. The API surface is the
same but the package name changed.

```diff
  // SPDX-License-Identifier: MIT
  pragma solidity >=0.8.19 <0.9.0;

- import { FHE, euint256, inEuint256, ebool } from "@fhenixprotocol/contracts/FHE.sol";
+ import { FHE, euint256, inEuint256, ebool } from "@fhenixprotocol/cofhe-contracts/FHE.sol";
```

Apply this across every `.sol` file that imports from the old package:

```bash
# One-liner to find all affected files
grep -rn '@fhenixprotocol/contracts' src/ test/ script/ --include='*.sol'

# Sed replacement (GNU sed; on macOS use gsed or sed -i '')
sed -i 's|@fhenixprotocol/contracts/|@fhenixprotocol/cofhe-contracts/|g' \
  $(grep -rl '@fhenixprotocol/contracts' src/ test/ script/ --include='*.sol')
```

Verify compilation:

```bash
forge build
# or
npx hardhat compile
```

---

### 3e. Redeploy contracts to the host chain

Your contracts must be freshly deployed. On-chain state from Helium / Nitrogen does not carry over -- those chains no
longer exist.

#### Foundry

```bash
# Deploy to Ethereum Sepolia
forge script script/Deploy.s.sol:Deploy \
  --rpc-url sepolia \
  --broadcast \
  --verify \
  -vvvv

# Deploy to Arbitrum Sepolia
forge script script/Deploy.s.sol:Deploy \
  --rpc-url arbitrumSepolia \
  --broadcast \
  --verify \
  -vvvv

# Deploy to Base Sepolia
forge script script/Deploy.s.sol:Deploy \
  --rpc-url baseSepolia \
  --broadcast \
  --verify \
  -vvvv
```

#### Hardhat

```bash
npx hardhat run scripts/deploy.ts --network sepolia
npx hardhat run scripts/deploy.ts --network arbitrumSepolia
npx hardhat run scripts/deploy.ts --network baseSepolia
```

After deployment, record the new contract addresses and update your client configs, deployment manifests, and any
address books.

---

### 3f. Update client code to use `@cofhe/sdk`

The `cofhejs` package has been superseded by `@cofhe/sdk`. The core encrypt / decrypt / permission flow is similar but
the initialization and type names differ.

#### Initialization

```diff
- import { FhenixClient } from "cofhejs";
+ import { CofheClient } from "@cofhe/sdk";

- const client = new FhenixClient({
-   provider: window.ethereum,
-   chainId: 8008135,            // Helium
- });
+ const client = new CofheClient({
+   provider: window.ethereum,
+   chainId: 11155111,           // Sepolia (or 421614, 84532)
+ });
```

#### Encryption

```diff
- const encrypted = await client.encrypt_uint256(value);
+ const encrypted = await client.encrypt(value, "uint256");
```

#### Permissions / sealing

```diff
- const permit = await client.generatePermit(contractAddress);
+ const permit = await client.createPermission(contractAddress);
```

#### If using the `fhe-agent-shield` TypeScript SDK

The repo's own SDK (`sdk/typescript`) already targets CoFHE host chains. Update your network name if you were using a
custom config:

```typescript
import { FHEAgentShield } from "fhe-agent-shield";

const shield = new FHEAgentShield({
  network: "ethereum-sepolia", // or "arbitrum-sepolia" or "base-sepolia"
  privateKey: "0x...",
  contracts: {
    agentVault: "0x...", // new deployment address
    agentMemory: "0x...",
    skillRegistry: "0x...",
    actionSealer: "0x...",
  },
});
```

Valid `network` values: `"ethereum-sepolia"` | `"arbitrum-sepolia"` | `"base-sepolia"`. The legacy strings `"helium"`
and `"nitrogen"` are no longer accepted.

---

### 3g. Adapt tests

#### Fork tests

Fork tests that were pointed at Helium / Nitrogen RPCs must be re-targeted:

```diff
  // hardhat.config.ts — forking config
  hardhat: {
    forking: {
-     url: "https://api.helium.fhenix.zone",
-     blockNumber: 12345,
+     url: process.env.SEPOLIA_RPC!,
+     blockNumber: 7000000,  // pick a recent Sepolia block
    },
  },
```

Foundry:

```diff
- forge test --fork-url https://api.helium.fhenix.zone
+ forge test --fork-url https://sepolia.infura.io/v3/${API_KEY_INFURA}
```

#### Mock contracts

The legacy Fhenix mocks are replaced by `cofhe-mock-contracts`:

```diff
  // Foundry submodules
- forge install fhenixprotocol/fhenix-mock-contracts
+ forge install fhenixprotocol/cofhe-mock-contracts
```

In Hardhat/TypeScript tests:

```diff
- import { MockFHE } from "@fhenixprotocol/contracts/test/MockFHE.sol";
+ import { MockFHE } from "cofhe-mock-contracts/MockFHE.sol";
```

The mock contracts simulate the CoFHE Task Manager and ciphertext registry locally so tests run without hitting a live
Threshold Network.

#### Snapshot / state tests

Any test that relied on chain-specific state (block numbers, pre-deployed contracts, ciphertext handles) from Helium or
Nitrogen must be recreated from scratch on the target host chain.

---

## 4. Common Gotchas

### 4.1 Chain IDs changed -- update all enums and switch statements

If your code has hardcoded chain ID checks, update every occurrence:

| Context           | Old Value                              | New Value                                                    |
| ----------------- | -------------------------------------- | ------------------------------------------------------------ |
| Helium chain ID   | `8008135`                              | `11155111` / `421614` / `84532`                              |
| Nitrogen chain ID | `8008148`                              | `11155111` / `421614` / `84532`                              |
| Network name      | `"fhenix-helium"`, `"fhenix-nitrogen"` | `"ethereum-sepolia"`, `"arbitrum-sepolia"`, `"base-sepolia"` |

Language-specific SDK bindings (Go, Rust, Python, Swift, Kotlin, Zig, Elixir) that carry `NetworkName` or `ChainId`
enums all need updating. Search your codebase:

```bash
grep -rn '8008135\|8008148\|helium\|nitrogen' --include='*.ts' --include='*.go' \
  --include='*.rs' --include='*.py' --include='*.swift' --include='*.kt' \
  --include='*.zig' --include='*.ex' .
```

### 4.2 Threshold Network endpoints piggyback on host chain RPC

In the legacy model, the Fhenix node embedded FHE operations. In CoFHE, the Threshold Network is a separate service that
the SDK connects to automatically through the host chain's RPC. You do **not** need a separate `THRESHOLD_RPC` endpoint
-- the `@cofhe/sdk` discovers it from on-chain registry contracts.

If you had custom Threshold Network URLs, remove them:

```diff
- FHENIX_THRESHOLD_URL="https://threshold.helium.fhenix.zone"
  # Not needed. The SDK reads the Threshold Network config from on-chain.
```

### 4.3 Ciphertext registry addresses differ per host chain

Each host chain has its own deployment of the CoFHE Task Manager and ciphertext registry. Ciphertext handles from one
host chain are **not valid** on another.

If your system is multi-chain, maintain per-chain address mappings:

```typescript
const COFHE_REGISTRY: Record<number, `0x${string}`> = {
  11155111: "0x...", // Sepolia Task Manager
  421614: "0x...", // Arbitrum Sepolia Task Manager
  84532: "0x...", // Base Sepolia Task Manager
};
```

Consult the CoFHE docs for canonical deployment addresses.

### 4.4 Gas costs differ between host chains

| Chain            | Typical FHE tx gas | Gas price | Notes                   |
| ---------------- | ------------------ | --------- | ----------------------- |
| Ethereum Sepolia | ~200k-500k         | Variable  | Higher base fee         |
| Arbitrum Sepolia | ~200k-500k         | Very low  | L2 compression benefits |
| Base Sepolia     | ~200k-500k         | Very low  | L2 compression benefits |

If your gas estimation logic had Helium/Nitrogen-specific constants, replace them. L2 host chains will generally be
cheaper, but the FHE computation cost (off-chain) is the same regardless of host chain.

### 4.5 Explorer URLs changed

| Old                                     | New                            |
| --------------------------------------- | ------------------------------ |
| `https://explorer.helium.fhenix.zone`   | `https://sepolia.etherscan.io` |
| `https://explorer.nitrogen.fhenix.zone` | `https://sepolia.arbiscan.io`  |
| (none for Base)                         | `https://sepolia.basescan.org` |

Update any explorer links in your UI, deploy scripts, or documentation.

### 4.6 Environment variable renames

A full mapping of common env var renames:

| Old                        | New                                                                         |
| -------------------------- | --------------------------------------------------------------------------- |
| `FHENIX_HELIUM_RPC`        | `SEPOLIA_RPC`                                                               |
| `FHENIX_NITROGEN_RPC`      | `ARBITRUM_SEPOLIA_RPC` or `BASE_SEPOLIA_RPC`                                |
| `FHENIX_HELIUM_CHAIN_ID`   | `SEPOLIA_CHAIN_ID` (`11155111`)                                             |
| `FHENIX_NITROGEN_CHAIN_ID` | `ARBITRUM_SEPOLIA_CHAIN_ID` (`421614`) or `BASE_SEPOLIA_CHAIN_ID` (`84532`) |
| `FHENIX_EXPLORER_URL`      | `ETHERSCAN_URL` / `ARBISCAN_URL` / `BASESCAN_URL`                           |
| `FHENIX_PRIVATE_KEY`       | `PRIVATE_KEY` (chain-agnostic)                                              |
| `FHENIX_THRESHOLD_URL`     | _(removed -- auto-discovered)_                                              |

Update your `.env`, `.env.example`, CI secrets, and any deployment scripts.

### 4.7 No more Fhenix-native faucet

The Helium and Nitrogen faucets (`faucet.helium.fhenix.zone`, `faucet.nitrogen.fhenix.zone`) are offline. Use host chain
faucets instead:

| Chain            | Faucet                                                              |
| ---------------- | ------------------------------------------------------------------- |
| Ethereum Sepolia | <https://cloud.google.com/application/web3/faucet/ethereum/sepolia> |
| Ethereum Sepolia | <https://www.alchemy.com/faucets/ethereum-sepolia>                  |
| Arbitrum Sepolia | <https://www.alchemy.com/faucets/arbitrum-sepolia>                  |
| Base Sepolia     | <https://www.coinbase.com/faucets/base-ethereum-goerli-faucet>      |

---

## 5. Verification Checklist

Run through this after completing the migration to confirm everything works.

### Build

- [ ] `forge build` (or `npx hardhat compile`) succeeds with zero errors.
- [ ] No references to `@fhenixprotocol/contracts` remain in source (only `@fhenixprotocol/cofhe-contracts`).
- [ ] No references to `cofhejs` remain (only `@cofhe/sdk`).

### Configuration

- [ ] `.env` / `.env.example` contains only CoFHE host chain variables.
- [ ] `grep -rn '8008135\|8008148' .` returns zero matches outside of docs or changelogs.
- [ ] `grep -rn 'helium\|nitrogen' .` returns zero matches outside of docs, changelogs, or this migration guide.

### Deployment

- [ ] Contracts deployed successfully to at least one host chain.
- [ ] Contract addresses recorded and verified on the host chain explorer.
- [ ] `forge verify-contract` (or Hardhat verify) succeeds.

### Client

- [ ] Client initializes with `@cofhe/sdk` against the host chain RPC.
- [ ] Encrypt / decrypt round-trip works for at least one FHE type (`euint256`).
- [ ] Permission creation and sealing flow completes without errors.

### Tests

- [ ] Unit tests pass with `cofhe-mock-contracts`.
- [ ] Fork tests point to host chain RPCs and pass.
- [ ] No test references legacy Helium or Nitrogen RPC endpoints.

### CI / CD

- [ ] CI environment variables updated (no `FHENIX_HELIUM_*` or `FHENIX_NITROGEN_*`).
- [ ] CI deploy targets updated to host chain networks.
- [ ] Explorer API keys set for the host chain (Etherscan / Arbiscan / Basescan).

### End-to-End

- [ ] Full user flow (store credential, grant permission, retrieve credential) works on the host chain.
- [ ] Gas estimates are reasonable for the chosen host chain.
- [ ] Explorer links in your UI resolve correctly.

---

## 6. References

| Resource                                 | URL                                                                     |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| CoFHE Documentation                      | <https://cofhe-docs.fhenix.zone>                                        |
| CoFHE Compatibility Matrix               | <https://cofhe-docs.fhenix.zone/get-started/introduction/compatibility> |
| CoFHE SDK Installation                   | <https://cofhe-docs.fhenix.zone/client-sdk/introduction/installation>   |
| CoFHE Overview (Fhenix docs)             | <https://docs.fhenix.zone/docs/devdocs/CoFHE/Overview>                  |
| `@cofhe/sdk` on npm                      | <https://www.npmjs.com/package/@cofhe/sdk>                              |
| `@fhenixprotocol/cofhe-contracts` on npm | <https://www.npmjs.com/package/@fhenixprotocol/cofhe-contracts>         |
| `@cofhe/hardhat-plugin` on npm           | <https://www.npmjs.com/package/@cofhe/hardhat-plugin>                   |
| This repo: fhe-agent-shield              | <https://github.com/codingsh/fhe-agent-shield>                          |
| This repo: PR #6 (CoFHE migration)       | <https://github.com/codingsh/fhe-agent-shield/pull/6>                   |
| M9 Roadmap (migration items)             | See `ROADMAP.md` in this repo -- search for "CoFHE migration" and "M9"  |
| Sepolia Etherscan                        | <https://sepolia.etherscan.io>                                          |
| Arbiscan Sepolia                         | <https://sepolia.arbiscan.io>                                           |
| Basescan Sepolia                         | <https://sepolia.basescan.org>                                          |

---

## Appendix A: Quick-Reference Dependency Table

| Component          | Old Package                 | New Package                       | Min Version |
| ------------------ | --------------------------- | --------------------------------- | ----------- |
| Solidity contracts | `@fhenixprotocol/contracts` | `@fhenixprotocol/cofhe-contracts` | `^0.1.3`    |
| Client SDK         | `cofhejs`                   | `@cofhe/sdk`                      | `^0.4.0`    |
| Hardhat plugin     | _(none or custom)_          | `@cofhe/hardhat-plugin`           | `^0.4.0`    |
| Mock contracts     | `fhenix-mock-contracts`     | `cofhe-mock-contracts`            | latest      |

## Appendix B: Quick-Reference Chain Table

| Chain            | Chain ID      | Currency | RPC                                      | Explorer                            | Faucet                 |
| ---------------- | ------------- | -------- | ---------------------------------------- | ----------------------------------- | ---------------------- |
| Ethereum Sepolia | `11155111`    | ETH      | `https://sepolia.infura.io/v3/<KEY>`     | `https://sepolia.etherscan.io`      | Alchemy / Google Cloud |
| Arbitrum Sepolia | `421614`      | ETH      | `https://sepolia-rollup.arbitrum.io/rpc` | `https://sepolia.arbiscan.io`       | Alchemy                |
| Base Sepolia     | `84532`       | ETH      | `https://sepolia.base.org`               | `https://sepolia.basescan.org`      | Coinbase               |
| ~~Helium~~       | ~~`8008135`~~ | ~~tFHE~~ | ~~`https://api.helium.fhenix.zone`~~     | ~~`explorer.helium.fhenix.zone`~~   | **Retired**            |
| ~~Nitrogen~~     | ~~`8008148`~~ | ~~tFHE~~ | ~~`https://api.nitrogen.fhenix.zone`~~   | ~~`explorer.nitrogen.fhenix.zone`~~ | **Retired**            |

---

_Last updated: 2026-04-15_
