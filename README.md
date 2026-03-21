# FHE-Agent Shield

> **Privacy layer for AI agents using Fully Homomorphic Encryption**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Buildathon: Fhenix Privacy-by-Design](https://img.shields.io/badge/Buildathon-Fhenix-green.svg)](https://fhenix.io)
[![Tests: 150 Passing](https://img.shields.io/badge/Tests-150%20Passing-brightgreen.svg)]()

**FHE-Agent Shield** protects AI agents from credential theft, prompt injection, and data exfiltration attacks using Fully Homomorphic Encryption (FHE) via Fhenix CoFHE.

## Problem Statement

OpenClaw (250K+ GitHub stars) suffers from critical security vulnerabilities:

| Vulnerability | Impact | FHE-Agent Shield Solution |
|--------------|--------|---------------------------|
| **Credential Exposure** | 135K+ instances with plaintext API keys | Encrypted credential vault with threshold decryption |
| **Prompt Injection** | 91% attack success rate | FHE-protected input processing |
| **Data Exfiltration** | Agent reads local files, exfiltrates to attackers | Encrypted agent memory |
| **ClawHavoc Supply Chain** | 1,184+ malicious skills | FHE-verified skill execution |

## Solution

FHE-Agent Shield wraps OpenClaw skills with FHE protection:

```
┌─────────────────────────────────────────────────────────────┐
│              OpenClaw Agent Runtime (Unchanged)             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              FHESkillDecorator                       │   │
│  │  • Encrypts inputs before skill execution           │   │
│  │  • Decrypts outputs after execution                 │   │
│  │  • Manages credential access via permits            │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │        FHE-Agent Shield Smart Contracts              │   │
│  │  AgentVault │ AgentMemory │ SkillRegistry │ ActionSealer   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Fhenix CoFHE Layer                       │   │
│  │  • FHE Precompiles (tfhe_add, tfhe_mul, etc.)       │   │
│  │  • Threshold decryption network                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Core Smart Contracts

| Contract | Description |
|----------|-------------|
| **AgentVault** | Encrypted credential storage with threshold decryption |
| **AgentMemory** | Encrypted agent context with snapshot/restore |
| **SkillRegistry** | FHE-verified marketplace for AI agent skills |
| **ActionSealer** | Threshold-released sealed actions |

### FHE-Protected Skills

| Skill | Description |
|-------|-------------|
| **EmailSkill** | Encrypted email operations (compose, send, read) |
| **BrowserSkill** | Encrypted browser session management |
| **FileSkill** | Encrypted file operations with access control |

### Integration

| Module | Description |
|--------|-------------|
| **FHESkillDecorator** | Wrap OpenClaw skills with FHE protection |
| **FHEAgentMemoryProvider** | OpenClaw memory provider with encryption |
| **FHECredentialVault** | OpenClaw credential manager |

### React Hooks

| Hook | Description |
|------|-------------|
| **useFHEClient** | Core FHE encryption/decryption client |
| **useEncryptedAgent** | Encrypted agent state management |
| **useAgentVault** | Credential storage hooks |
| **useSealedAction** | Sealed action management |

## Quick Start

### Prerequisites

- [Foundry](https://getfoundry.sh/) - Ethereum development toolkit
- [Node.js](https://nodejs.org/) 18+ 
- [Fhenix Helium Testnet](https://docs.fhenix.zone/) access

### Installation

```bash
# Clone repository
git clone https://github.com/codingsh/fhenix-ecossystem
cd fhe-agent-shield

# Install dependencies
bun install

# Build contracts
forge build
```

### Testing

```bash
# Run all tests (150 total)
forge test

# Run FHE integration tests only
forge test --match-contract "FheIntegrationTest"

# Run with gas report
forge test --gas-report

# Run coverage
forge coverage

# Run TypeScript integration tests
npx tsx sandbox/test-openclaw-integration.ts
```

For detailed FHE testing documentation, see [docs/fhe-testing.md](docs/fhe-testing.md).

### Deploy to Fhenix Helium Testnet

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export HELIUM_RPC=https://api.helium.fhenix.zone

# Deploy all contracts
forge script script/DeployAll.s.sol --rpc-url $HELIUM_RPC --broadcast

# Deploy demo contracts
forge script script/Demo.s.sol --rpc-url $HELIUM_RPC --broadcast
```

## Project Structure

```
fhe-agent-shield/
├── src/
│   ├── contracts/          # Solidity smart contracts
│   │   ├── AgentVault.sol
│   │   ├── AgentMemory.sol
│   │   ├── SkillRegistry.sol
│   │   ├── ActionSealer.sol
│   │   └── FHERC20.sol
│   ├── hooks/              # React hooks
│   │   ├── useFHEClient.ts
│   │   ├── useEncryptedAgent.ts
│   │   ├── useAgentVault.ts
│   │   └── useSealedAction.ts
│   ├── openclaw/           # OpenClaw integration
│   │   ├── fhe-skill-decorator.ts
│   │   ├── fhe-memory-provider.ts
│   │   └── fhe-credential-vault.ts
│   └── utils/
│       └── types.ts
├── skills/                 # Example FHE-protected skills
│   ├── email/
│   ├── browser/
│   └── file/
├── test/                   # Test suite
│   ├── AgentVault.t.sol
│   ├── AgentMemory.t.sol
│   ├── SkillRegistry.t.sol
│   ├── ActionSealer.t.sol
│   └── fork/               # Fork tests
├── docs/                    # Documentation
│   ├── architecture.md
│   ├── api-reference.md
│   └── security-model.md
├── script/                  # Deployment scripts
│   ├── Deploy.s.sol
│   ├── DeployAll.s.sol
│   └── Demo.s.sol
└── foundry.toml
```

## Usage

### Smart Contracts

```solidity
// Store encrypted credential
bytes32 handle = agentVault.storeCredential(
    agentId,
    encryptedApiKey
);

// Initialize encrypted agent
address agentId = agentMemory.initializeAgent();

// Append encrypted context
uint256 newLength = agentMemory.appendContext(
    agentId,
    encryptedChunk
);

// Seal an action
address actionId = actionSealer.sealAction(
    agentId,
    encryptedPayload
);
```

### TypeScript / React

```typescript
import { FHESkillDecorator } from './openclaw/fhe-skill-decorator';
import { useEncryptedAgent } from './hooks/useEncryptedAgent';
import { useAgentVault } from './hooks/useAgentVault';

// Create FHE-protected skill
const secureEmailSkill = FHESkillDecorator.wrap(emailSkill, {
  inputEncryption: true,
  outputEncryption: true,
  credentialVault: vaultAddress,
  requirePermits: ['read_email', 'send_email'],
});

// Store encrypted credential
const { storeCredential } = useAgentVault(agentId);
await storeCredential('OPENAI_API_KEY', 'sk-...');

// Append encrypted context
const { appendContext } = useEncryptedAgent(agentId);
await appendContext('User wants to schedule a meeting...');
```

### OpenClaw Integration

```typescript
import { createAgent } from 'openclaw-sdk';
import { 
  FHESkillDecorator, 
  FHEAgentMemoryProvider, 
  FHECredentialVault 
} from '@fhe-agent-shield/openclaw';

const agent = createAgent({
  name: 'SecureAgent',
  memoryProvider: new FHEAgentMemoryProvider({
    contractAddress: process.env.AGENT_MEMORY_ADDRESS,
    thresholdNetworkUrl: process.env.THRESHOLD_RPC,
  }),
  skills: [secureEmailSkill, secureFileSkill],
});
```

## Testnet Information

| Network | Chain ID | RPC URL | Explorer |
|---------|----------|---------|----------|
| Fhenix Helium | 8008135 | `https://api.helium.fhenix.zone` | [explorer.fhenix.zone](https://explorer.fhenix.zone) |
| Fhenix Nitrogen | 8008148 | `https://api.nitrogen.fhenix.zone` | [explorer.nitrogen.fhenix.zone](https://explorer.nitrogen.fhenix.zone) |
| Arbitrum Sepolia | 421614 | `https://sepolia-rollup.arbitrum.io/rpc` | [sepolia.arbiscan.io](https://sepolia.arbiscan.io) |
| Base Sepolia | 84532 | `https://sepolia.base.org` | [sepolia.basescan.org](https://sepolia.basescan.org) |

## SDKs (In Development)

| SDK | Language | Status | Package |
|-----|----------|--------|---------|
| **TypeScript** | TypeScript | 🔄 Building | `@fhe-agent-shield/sdk` |
| **Python** | Python | 🔄 Building | `fhe-agent-shield` |
| **Rust** | Rust | 🔄 Building | `fhe-agent-shield` |

### Framework Integrations

| Framework | Language | Status | Type |
|-----------|----------|--------|------|
| **ElizaOS** | TypeScript | 🔄 Building | Plugin |
| **Nanobot** | Python | 🔄 Building | Integration |

### Demo Deployment

Demo contracts are deployed at:
- `AgentVault`: Check `script/Demo.s.sol` after deployment
- `AgentMemory`: Check `script/Demo.s.sol` after deployment

Run the demo:
```bash
./demo.sh
```

## Documentation

- [Architecture](docs/architecture.md) - System architecture and component interactions
- [API Reference](docs/api-reference.md) - Complete API documentation
- [Security Model](docs/security-model.md) - Security architecture and threat analysis
- [FHE Testing Guide](docs/fhe-testing.md) - Comprehensive FHE testing documentation
- [Multi-Chain DevX](docs/multi-chain-devx.md) - Multi-network deployment guide
- [Competitor Roadmap](docs/competitor-roadmap.md) - OpenClaw alternatives integration
- [ElizaOS & Nanobot Roadmap](docs/elizaos-nanobot-roadmap.md) - Framework integrations
- [TDD Test Suite](docs/tdd-test-suite.md) - SDK verification framework
- [Demo Guide](DEMO.md) - Step-by-step demo instructions

## Security

### Threat Mitigation

| Threat | Mitigation |
|--------|------------|
| Credential Theft | Encrypted storage + threshold decryption |
| Prompt Injection | FHE input encryption |
| Data Exfiltration | Encrypted agent memory |
| Malicious Skills | FHE skill verification |

### Access Control Layers

1. **Permit Authentication** - EIP-712 signed permits
2. **Threshold Decryption** - M-of-N key holders
3. **FHE Access Control** - Contract-level ACL on encrypted data
4. **Selective Disclosure** - Explicit permission grants

### Security Audits

- [Aderyn](report.md) - Static analysis completed
- [Slither](report.md) - Static analysis completed

## Development

### Available Commands

```bash
# Build contracts
forge build

# Run tests
forge test

# Format code
forge fmt

# Run linter
bun run lint

# Gas report
forge test --gas-report

# Coverage report
forge coverage
```

### Adding New Skills

1. Create skill contract in `skills/{skillName}/`
2. Implement FHE encryption/decryption
3. Add tests in `test/{SkillName}.t.sol`
4. Register in SkillRegistry

## License

MIT License - see [LICENSE.md](LICENSE.md)

## Acknowledgments

- [Fhenix](https://fhenix.io) - FHE-enabled blockchain
- [OpenZeppelin](https://openzeppelin.com/) - Smart contract libraries
- [Foundry](https://getfoundry.sh/) - Development toolkit
- [OpenClaw](https://github.com/openclaw/openclaw) - AI agent framework

## Links

- [Fhenix Documentation](https://docs.fhenix.zone/)
- [CoFHE Documentation](https://docs.fhenix.zone/docs/devdocs/CoFHE/Overview)
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [Buildathon Info](https://fhenix.io/buildathon)

---

**Built for the Fhenix Privacy-by-Design Buildathon 2026**