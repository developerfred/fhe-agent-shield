# FHE-Agent Shield: ElizaOS & Nanobot Support Roadmap

> **Privacy Layer for AI Agents - Integration with ElizaOS and Nanobot**

---

## Overview

FHE-Agent Shield will expand its privacy protection to two major AI agent frameworks:

| Framework | Language | Stars | Type | Priority |
|-----------|----------|-------|------|----------|
| **ElizaOS** | TypeScript | 35K+ | Agent OS | 🔴 HIGH |
| **Nanobot** | Python | 35K+ | Lightweight | 🔴 HIGH |

---

## ElizaOS Integration

### What is ElizaOS?

ElizaOS is an open-source framework for building autonomous AI agents - an "operating system for AI personalities." It supports:
- Multi-chain EVM (30+ networks)
- Solana integration
- Plugin system for extensibility
- Memory and knowledge management
- Character-based agents

**Paper:** [Eliza: A Web3 Friendly AI Agent Operating System](https://arxiv.org/html/2501.06781v1)

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ElizaOS Runtime                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Agent     │  │  Plugin     │  │    Runtime              │ │
│  │   (Character)│  │  System     │  │    (State, Memory)      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Web3 Plugins (EVM, Solana, etc.)              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Security Gaps in ElizaOS

| Issue | Severity | Description |
|-------|----------|-------------|
| Plaintext Credentials | 🔴 HIGH | API keys stored in character config |
| Memory Exposure | 🔴 HIGH | Agent memory visible to node operator |
| Transaction Signing | 🟡 MEDIUM | Private keys in agent wallet |
| Plugin Trust | 🟡 MEDIUM | Third-party plugins have full access |
| No Encryption | 🔴 HIGH | All data visible on-chain |

### ElizaOS Plugin Integration

Create `@elizaos/plugin-fhe-shield`:

```typescript
// @elizaos/plugin-fhe-shield
import { Plugin, IAgentRuntime, Memory, Provider } from '@elizaos/core';
import { FHEAgentShield, EncryptedCredential, ThresholdConfig } from '@fhe-agent-shield/sdk';

export class FHEShieldPlugin implements Plugin {
  name = 'fhe-shield';
  description = 'FHE-encrypted credentials and memory for ElizaOS agents';

  private shield: FHEAgentShield;
  private runtime: IAgentRuntime;

  constructor(config: {
    contracts: {
      agentVault: Address;
      agentMemory: Address;
      actionSealer: Address;
    };
    threshold: ThresholdConfig;
  }) {
    this.shield = new FHEAgentShield(config);
  }

  async initialize(runtime: IAgentRuntime) {
    this.runtime = runtime;
    
    // Encrypt existing credentials
    await this.encryptCredentials();
    
    // Replace memory provider with encrypted version
    runtime.memoryProvider = new FHEEncryptedMemoryProvider(
      this.shield,
      runtime.memoryProvider
    );
  }

  // =============================================================================
  // Actions
  // =============================================================================

  actions = [
    {
      name: 'FHE_STORE_CREDENTIAL',
      description: 'Store encrypted credential with FHE',
      params: [
        { name: 'key', type: 'string', required: true },
        { name: 'value', type: 'string', required: true },
      ],
      handler: async (params: { key: string; value: string }) => {
        const encrypted = await this.shield.storeCredential(
          this.runtime.agentId,
          params.key,
          params.value
        );
        return { success: true, handle: encrypted.handle };
      },
    },

    {
      name: 'FHE_RETRIEVE_CREDENTIAL',
      description: 'Retrieve encrypted credential with threshold',
      params: [
        { name: 'key', type: 'string', required: true },
        { name: 'approvers', type: 'address[]', required: false },
      ],
      handler: async (params: { key: string; approvers?: Address[] }) => {
        const value = await this.shield.retrieveCredential(
          this.runtime.agentId,
          params.key,
          params.approvers || [this.runtime.walletAddress]
        );
        return { success: true, value };
      },
    },

    {
      name: 'FHE_SEAL_ACTION',
      description: 'Seal action requiring threshold approval',
      params: [
        { name: 'action', type: 'string', required: true },
        { name: 'payload', type: 'object', required: true },
        { name: 'threshold', type: 'number', required: false },
      ],
      handler: async (params: { action: string; payload: any; threshold?: number }) => {
        const sealed = await this.shield.sealAction(
          this.runtime.agentId,
          params.action,
          params.payload,
          params.threshold || 2
        );
        return { success: true, actionId: sealed.id };
      },
    },

    {
      name: 'FHE_APPROVE_ACTION',
      description: 'Approve a sealed action',
      params: [
        { name: 'actionId', type: 'string', required: true },
      ],
      handler: async (params: { actionId: string }) => {
        await this.shield.approveAction(
          params.actionId,
          this.runtime.walletAddress
        );
        return { success: true };
      },
    },
  ];

  // =============================================================================
  // Providers
  // =============================================================================

  providers = [
    {
      name: 'fhe-credential-provider',
      get: async () => {
        // Return encrypted credential summaries (not actual values)
        const credentials = await this.shield.listCredentials(this.runtime.agentId);
        return {
          encrypted_credentials: credentials.map(c => ({
            key: c.key,
            handle: c.handle,
            threshold: c.threshold,
          })),
        };
      },
    },
  ];
}
```

### Usage in Character Config

```json
{
  "name": "SecureAgent",
  "plugins": [
    "@elizaos/plugin-sql",
    "@elizaos/plugin-fhe-shield"
  ],
  "settings": {
    "fheShield": {
      "contracts": {
        "agentVault": "0x...",
        "agentMemory": "0x...",
        "actionSealer": "0x..."
      },
      "threshold": 2,
      "networks": ["fhenix", "arbitrum-sepolia"]
    }
  }
}
```

### Timeline: ElizaOS Integration

| Week | Task | Deliverable |
|------|-------|--------------|
| 1 | Create SDK package | `@fhe-agent-shield/sdk` TypeScript SDK |
| 2 | Develop plugin scaffold | `@elizaos/plugin-fhe-shield` |
| 3 | Implement credential encryption | FHE credential store |
| 4 | Implement memory encryption | FHE memory provider |
| 5 | Implement action sealing | Threshold-released actions |
| 6 | Test and document | Working plugin + docs |

---

## Nanobot Integration

### What is Nanobot?

Nanobot is an ultra-lightweight AI assistant inspired by OpenClaw, delivering core agent functionality with **99% fewer lines of code** (only ~4K lines vs 400K+).

**Key Features:**
- Model agnostic (OpenAI, Anthropic, Gemini, local Ollama)
- Multi-platform (Discord, Slack, Telegram, WhatsApp, DingTalk, WeCom, Feishu)
- Stateful memory with local graph
- MCP (Model Context Protocol) support
- Python-based

**GitHub:** [HKUDS/nanobot](https://github.com/HKUDS/nanobot) (35K+ stars)

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Nanobot Core (~4K lines)                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Agent      │  │  Tools      │  │    Memory              │ │
│  │  (Loop)     │  │  (MCP)      │  │    (Token-based)      │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Channel Adapters (Discord, Telegram, etc.)   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Security Gaps in Nanobot

| Issue | Severity | Description |
|-------|----------|-------------|
| Credential Storage | 🔴 HIGH | API keys in config files |
| Memory Visibility | 🔴 HIGH | Local files readable |
| No Encryption | 🔴 HIGH | Plaintext storage |
| Minimal ACL | 🟡 MEDIUM | Single user assumed |
| MCP Trust | 🟡 MEDIUM | Plugins have system access |

### Nanobot FHE Integration

```python
# nanobot_fhe_shield/integrated.py
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from eth_account import Account
import json

@dataclass
class FHEConfig:
    """Configuration for FHE Shield integration."""
    vault_address: str
    memory_address: str
    sealer_address: str
    private_key: str
    rpc_url: str
    threshold: int = 2

class FHECredentialStore:
    """
    FHE-encrypted credential storage for Nanobot.
    
    Replaces plaintext API keys with encrypted handles stored on-chain.
    """
    
    def __init__(self, config: FHEConfig):
        self.config = config
        self.account = Account.from_key(config.private_key)
        self.credentials: Dict[str, str] = {}  # key -> encrypted_handle
        
    async def store(self, key: str, value: str) -> str:
        """
        Store credential with FHE encryption.
        
        Args:
            key: Credential identifier (e.g., 'OPENAI_API_KEY')
            value: Plaintext credential value
            
        Returns:
            Encrypted handle for later retrieval
        """
        # Encrypt value using FHE contract
        encrypted = await self._encrypt_value(value)
        
        # Store on-chain with FHE
        tx_hash = await self._send_transaction(
            'storeCredential',
            [encrypted]
        )
        
        handle = self._derive_handle(key, tx_hash)
        self.credentials[key] = handle
        
        return handle
    
    async def retrieve(self, key: str, approvers: List[str]) -> str:
        """
        Retrieve credential with threshold approval.
        
        Args:
            key: Credential identifier
            approvers: List of approver addresses (threshold must be met)
            
        Returns:
            Decrypted credential value
        """
        handle = self.credentials[key]
        
        # Request decryption with approvals
        decrypted = await self._request_decryption(
            handle,
            approvers,
            self.config.threshold
        )
        
        return decrypted
    
    async def list_credentials(self) -> List[Dict[str, Any]]:
        """List stored credentials (handles only, not values)."""
        return [
            {'key': key, 'handle': handle}
            for key, handle in self.credentials.items()
        ]


class FHEMemoryProvider:
    """
    FHE-encrypted memory provider for Nanobot.
    
    Encrypts agent memory before storage.
    """
    
    def __init__(self, config: FHEConfig, memory_path: str):
        self.config = config
        self.memory_path = memory_path
        self.encrypted_chunks: List[str] = []
        
    async def append(self, content: str) -> int:
        """
        Append encrypted memory chunk.
        
        Returns:
            New memory length
        """
        encrypted = await self._encrypt_chunk(content)
        
        tx_hash = await self._send_transaction(
            'appendContext',
            [self.config.agent_id, encrypted]
        )
        
        self.encrypted_chunks.append(self._derive_handle(content, tx_hash))
        return len(self.encrypted_chunks)
    
    async def get_context(self, start: int, end: int) -> List[str]:
        """
        Retrieve decrypted memory slice.
        
        Args:
            start: Start index
            end: End index
            
        Returns:
            List of decrypted memory chunks
        """
        handles = self.encrypted_chunks[start:end]
        
        chunks = []
        for handle in handles:
            decrypted = await self._request_decryption(
                handle,
                [self.config.private_key],  # Self-approval for memory
                1
            )
            chunks.append(decrypted)
        
        return chunks


class FHESealManager:
    """
    Threshold-released action sealing for Nanobot.
    
    Critical actions require multi-approver approval before execution.
    """
    
    def __init__(self, config: FHEConfig):
        self.config = config
        self.pending_actions: Dict[str, dict] = {}
        
    async def seal_action(
        self,
        action_type: str,
        params: Dict[str, Any],
        threshold: int = 2
    ) -> str:
        """
        Seal an action requiring threshold approvals.
        
        Args:
            action_type: Type of action (e.g., 'send_email', 'transfer')
            params: Action parameters
            threshold: Number of approvals required
            
        Returns:
            Action ID for tracking
        """
        encrypted_payload = await self._encrypt_json(params)
        
        tx_hash = await self._send_transaction(
            'sealAction',
            [self.config.agent_id, encrypted_payload, threshold]
        )
        
        action_id = self._derive_action_id(action_type, tx_hash)
        
        self.pending_actions[action_id] = {
            'type': action_type,
            'params': params,
            'threshold': threshold,
            'approvals': []
        }
        
        return action_id
    
    async def approve(self, action_id: str, approver: str) -> bool:
        """
        Approve a pending action.
        
        Returns:
            True if threshold met and action can proceed
        """
        action = self.pending_actions[action_id]
        
        await self._send_transaction(
            'approveRelease',
            [action_id]
        )
        
        action['approvals'].append(approver)
        
        if len(action['approvals']) >= action['threshold']:
            return True  # Action can proceed
            
        return False
    
    async def execute(self, action_id: str) -> Dict[str, Any]:
        """
        Execute an approved action.
        
        Requires threshold approvals already collected.
        """
        action = self.pending_actions[action_id]
        
        if len(action['approvals']) < action['threshold']:
            raise ValueError(
                f"Insufficient approvals: {len(action['approvals'])}/{action['threshold']}"
            )
        
        decrypted = await self._request_decryption(
            action_id,
            action['approvers'],
            action['threshold']
        )
        
        result = await self._execute_action(
            action['type'],
            decrypted
        )
        
        del self.pending_actions[action_id]
        return result
```

### Nanobot Integration Example

```python
# config.py
from nanobot_fhe_shield import FHECredentialStore, FHEMemoryProvider, FHESealManager, FHEConfig

FHE_CONFIG = FHEConfig(
    vault_address="0x...",
    memory_address="0x...",
    sealer_address="0x...",
    private_key="0x...",
    rpc_url="https://api.helium.fhenix.zone",
    threshold=2
)

# Initialize FHE Shield
fhe_shield = FHECredentialStore(FHE_CONFIG)
fhe_memory = FHEMemoryProvider(FHE_CONFIG, memory_path="./memory")
fhe_sealer = FHESealManager(FHE_CONFIG)

# Store API keys encrypted
await fhe_shield.store("OPENAI_API_KEY", "sk-...")
await fhe_shield.store("SENDGRID_KEY", "SG....")

# Use in agent
async def send_email(to: str, content: str):
    # Retrieve API key with self-approval
    api_key = await fhe_shield.retrieve("SENDGRID_KEY", [my_address])
    
    # Seal the email sending action
    action_id = await fhe_sealer.seal_action(
        "send_email",
        {"to": to, "content": content},
        threshold=1
    )
    
    # Execute (immediate for low-threshold actions)
    return await fhe_sealer.execute(action_id)
```

### Timeline: Nanobot Integration

| Week | Task | Deliverable |
|------|-------|--------------|
| 1 | Python SDK | `fhe-agent-shield-python` package |
| 2 | Credential Store | `FHECredentialStore` class |
| 3 | Memory Provider | `FHEMemoryProvider` class |
| 4 | Action Sealer | `FHESealManager` class |
| 5 | Integration testing | Nanobot + FHE working |
| 6 | Documentation | Usage guide + examples |

---

## Comparative Analysis

| Feature | ElizaOS | Nanobot | OpenClaw |
|---------|---------|---------|----------|
| Language | TypeScript | Python | TypeScript |
| Size | Medium (~50K) | Tiny (~4K) | Huge (400K+) |
| Plugin System | Native | MCP | Custom |
| Memory | RAG-based | Token-based | Full memory |
| **FHE Priority** | 🔴 HIGH | 🔴 HIGH | ✅ DONE |
| **Estimated Effort** | 6 weeks | 6 weeks | - |

---

## Unified SDK Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FHE-Agent Shield SDK                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    Core Package                             │  │
│  │  - AgentVault (credentials)                                 │  │
│  │  - AgentMemory (context)                                   │  │
│  │  - ActionSealer (threshold)                               │  │
│  └─────────────────────────────────────────────────────────┘  │
│                              │                                    │
│              ┌───────────────┴───────────────┐                  │
│              ▼                               ▼                   │
│  ┌─────────────────────────┐   ┌─────────────────────────┐   │
│  │   TypeScript SDK        │   │      Python SDK          │   │
│  │   (@fhe-agent-shield)   │   │   (fhe-agent-shield)    │   │
│  │                         │   │                         │   │
│  │  - ElizaOS Plugin       │   │  - Nanobot Integration  │   │
│  │  - viem integration     │   │  - MCP wrapper         │   │
│  │  - React hooks          │   │  - HTTP provider       │   │
│  └─────────────────────────┘   └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Core SDKs (Weeks 1-4)

**TypeScript SDK:**
```bash
npm init @fhe-agent-shield/sdk
```

**Python SDK:**
```bash
pip install fhe-agent-shield
```

### Phase 2: ElizaOS Plugin (Weeks 5-10)

- Week 5-6: Plugin scaffold + credential encryption
- Week 7-8: Memory provider + action sealing
- Week 9-10: Testing + documentation

### Phase 3: Nanobot Integration (Weeks 11-16)

- Week 11-12: Python SDK enhancements
- Week 13-14: Credential store + memory provider
- Week 15-16: Action sealing + integration testing

### Phase 4: Ecosystem (Weeks 17-20)

- Multi-agent support
- Cross-framework compatibility
- Enterprise features
- Performance optimization

---

## Success Metrics

| Metric | Target |
|--------|--------|
| ElizaOS Plugin Installations | 500+ |
| Nanobot Integration Downloads | 1000+ |
| Encrypted Credentials Stored | 10,000+ |
| Protected Agent Contexts | 5,000+ |
| Threshold Actions Sealed | 1,000+ |
| Community Contributors | 20+ |

---

## Technical Dependencies

### Smart Contracts (Same for all frameworks)

| Contract | Purpose |
|----------|---------|
| AgentVault | Encrypted credential storage |
| AgentMemory | Encrypted agent context |
| ActionSealer | Threshold-released actions |

### Blockchain Networks

| Network | Use Case |
|---------|---------|
| Fhenix Helium | Primary FHE network |
| Fhenix Nitrogen | Latest FHE features |
| Arbitrum Sepolia | L2 integration |
| Base Sepolia | L2 integration |

### SDK Requirements

| SDK | Language | Package Manager |
|-----|----------|---------------|
| Core | Solidity | - |
| TypeScript | TypeScript | npm |
| Python | Python | pip |
| Go | Go | go mod |

---

## References

- [ElizaOS Documentation](https://docs.elizaos.ai/)
- [ElizaOS GitHub](https://github.com/elizaos/eliza)
- [Nanobot GitHub](https://github.com/HKUDS/nanobot)
- [Eliza Paper](https://arxiv.org/html/2501.06781v1)
- [MoltsPay Plugin for ElizaOS](https://dev.to/yaqing2023/introducing-moltspay-plugin-for-elizaos-give-your-ai-agent-a-wallet-388a)
