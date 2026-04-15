# FHE-Agent Shield: Competitor Support Roadmap

> **Privacy Layer for AI Agents - Competitor Integration Strategy**

---

## Executive Summary

FHE-Agent Shield currently supports **OpenClaw** (250K+ GitHub stars). This roadmap outlines integration with competing
frameworks to expand FHE privacy protection across the AI agent ecosystem.

**Why Support Competitors?**

- Each competitor addresses different security weaknesses in OpenClaw
- NanoClaw (security-first), CrewAI (multi-agent), LangGraph (production) all need FHE protection
- First-mover advantage: Become the privacy standard across ALL agent frameworks

---

## Competitor Landscape Overview

| Framework      | Type          | GitHub Stars | Security Focus      | FHE Compatibility      |
| -------------- | ------------- | ------------ | ------------------- | ---------------------- |
| **OpenClaw**   | Desktop Agent | 250K+        | Vulnerable (9 CVEs) | ✅ Currently Supported |
| **NanoClaw**   | Containerized | 6.7K         | Security-first      | ✅ High Priority       |
| **CrewAI**     | Multi-Agent   | 47K          | RBAC (basic)        | ✅ High Priority       |
| **LangGraph**  | Orchestration | 10K+         | Least Privilege     | ✅ High Priority       |
| **AutoGen**    | Research      | 20K+         | Enterprise          | ⚠️ Medium Priority     |
| **ZeroClaw**   | Rust          | 26.8K        | Minimal             | ⚠️ Medium Priority     |
| **Nanobot**    | Lightweight   | 26.8K        | Simple              | ⚠️ Low Priority        |
| **Moltworker** | Serverless    | -            | Cloudflare          | ❌ Out of Scope        |

---

## Detailed Competitor Analysis

### 1. OpenClaw (Currently Supported) ✅

**Overview:** Original viral AI agent framework by Peter Steinberger

- **Language:** TypeScript
- **Stars:** 250K+
- **Architecture:** Monolithic, desktop-centric

**Security Issues:**

- 9 CVEs including CVE-2026-25253 (CVSS 8.8 - RCE)
- 135K+ instances with plaintext API keys
- Malicious skills in marketplace
- 91% prompt injection success rate

**FHE-Agent Shield Integration:**

- `FHESkillDecorator` - wraps existing skills
- `FHEAgentMemoryProvider` - encrypted memory
- `FHECredentialVault` - encrypted credentials
- **Status:** ✅ Production Ready

**Integration Points:**

```
SkillDecorator → AgentVault (FHE encrypted credentials)
MemoryProvider → AgentMemory (FHE encrypted context)
ActionSealer → Threshold-released actions
```

---

### 2. NanoClaw 🔴 (HIGH PRIORITY)

**Overview:** Security-first fork emphasizing container isolation

- **Language:** Python
- **Stars:** 6.7K+
- **Architecture:** Single process, container-isolated, WhatsApp-native

**Security Model:**

- OS-level container isolation (opposite of OpenClaw's monolith)
- 500 lines core vs 400K lines OpenClaw
- Direct Claude integration
- Smaller attack surface

**Why FHE Integration?**

- Even with container isolation, credentials are still exposed to the AI model
- Container escape is still possible (CVEs)
- Agent-to-agent communication is plaintext
- Memory is not encrypted at rest

**Proposed Integration:**

```python
# NanoClaw FHE Integration Concept
from fhe_agent_shield import FHECredentialVault, FHEAgentMemory

class NanoClawFHEMiddleware:
    def __init__(self, contracts):
        self.vault = FHECredentialVault(contracts['AgentVault'])
        self.memory = FHEAgentMemory(contracts['AgentMemory'])

    async def encrypt_credentials(self, api_keys):
        """Encrypt all API keys before agent access"""
        encrypted = {}
        for name, key in api_keys.items():
            handle = await self.vault.store(key)
            encrypted[name] = handle
        return encrypted

    def intercept_tool_call(self, tool_name, params):
        """Decrypt credentials only when needed, threshold required"""
        if self._requires_credential(tool_name):
            self._request_threshold_approval(tool_name)
        return params
```

**Priority: HIGH** - Security-conscious users are ideal FHE customers

**Effort Estimate:** 2-3 weeks

- Well-documented Python interface
- Similar skill/plugin architecture to OpenClaw
- Native WhatsApp integration can leverage FHE messaging

---

### 3. CrewAI 🟡 (HIGH PRIORITY)

**Overview:** Multi-agent framework for role-playing autonomous agents

- **Language:** Python
- **Stars:** 47K
- **Architecture:** Agents + Tasks + Crews (hierarchical)

**Security Model:**

- Role-Based Access Control (RBAC)
- Crew-level permissions
- MCP (Model Context Protocol) security considerations
- Agent Passport System (proposed) - cryptographic identity

**Security Gaps:**

- No encryption of agent memory/context
- Credentials passed in plaintext
- Agent-to-agent communication not encrypted
- Human-in-the-loop approval is basic

**Proposed Integration:**

```python
# CrewAI FHE Integration Concept
from fhe_agent_shield import FHECrewManager, FHEAgentVault

class FHECrewAIIntegration:
    """
    FHE protection for CrewAI multi-agent systems.

    Each 'Agent' in CrewAI gets:
    - Encrypted long-term memory
    - Encrypted credentials with threshold decryption
    - Sealed actions requiring crew approval
    """

    def __init__(self, fhe_contracts):
        self.crew_manager = FHECrewManager(fhe_contracts)
        self.agent_vault = FHEAgentVault(fhe_contracts)

    def create_secure_crew(self, agents_config):
        """
        Create crew with FHE protection:
        1. Each agent has encrypted memory
        2. Inter-agent communication encrypted
        3. Critical actions require threshold approval
        4. Credentials decrypted only when needed
        """
        crew_id = self.crew_manager.create_crew(agents_config)

        for agent in agents_config['agents']:
            self.agent_vault.initialize_agent(agent['id'])
            self.crew_manager.set_memory_policy(
                crew_id,
                agent['id'],
                encryption='fhe',
                threshold=agent.get('threshold', 2)
            )

        return crew_id

    async def execute_task(self, task, context):
        """Execute task with encrypted context"""
        # Encrypt context before passing to agent
        encrypted_context = self.encrypt_context(context)

        # Agent processes encrypted data
        result = await self.run_agent(task, encrypted_context)

        # Result stays encrypted until threshold met
        return result
```

**Key Features:**

1. **Encrypted Crew Memory** - All agent memories encrypted with FHE
2. **Threshold Crew Approval** - Critical crew decisions need multi-agent approval
3. **Role-Encrypted Credentials** - Agent roles determine credential access
4. **Sealed Agent Actions** - Actions encrypted until approval threshold met

**Priority: HIGH** - Large community, clear security needs

**Effort Estimate:** 3-4 weeks

- Different architecture than OpenClaw (hierarchical vs flat)
- Need to create "Crew Manager" contract
- Multi-agent coordination adds complexity

---

### 4. LangGraph 🟡 (HIGH PRIORITY)

**Overview:** Graph-based agent orchestration (by LangChain)

- **Language:** Python
- **Stars:** 10K+
- **Architecture:** Stateful graph workflows with checkpointing

**Security Model:**

- LangChain's Authorization framework
- Least privilege principles
- Memory segmentation via checkpoints
- Tool access control

**Security Gaps:**

- Memory stored in Redis (not encrypted)
- Checkpoints visible to operators
- Tool permissions are boolean (no granular encryption)
- No threshold decryption

**Proposed Integration:**

```python
# LangGraph FHE Integration Concept
from fhe_agent_shield import FHECheckpointer, FHEStateStore
from langgraph.checkpoint import BaseCheckpointer

class FHELangGraphCheckpointer(BaseCheckpointer):
    """
    FHE-encrypted checkpointer for LangGraph.

    Replaces Redis checkpointer with encrypted state storage.
    Graph state is encrypted at rest and in transit.
    """

    def __init__(self, contracts, threshold_network):
        self.state_store = FHEStateStore(contracts, threshold_network)

    async def aput(self, config, checkpoint, metadata):
        """Store encrypted checkpoint"""
        # Encrypt entire checkpoint
        encrypted = await self.state_store.encrypt_state(checkpoint)

        # Store with reference, not the data itself
        handle = await self.state_store.store(encrypted)

        return {'handle': handle}

    async def aget(self, config):
        """Retrieve and decrypt checkpoint"""
        handle = config['handle']

        # Request decryption (threshold may apply)
        decrypted = await self.state_store.decrypt_state(handle)

        return decrypted
```

**Key Features:**

1. **Encrypted Checkpoints** - Graph state encrypted at rest
2. **FHE State Store** - Replaces Redis with encrypted storage
3. **Threshold Tool Access** - Sensitive tools require approval
4. **Encrypted Memory** - Agent memory encrypted

**Priority: HIGH** - Production-focused users need FHE

**Effort Estimate:** 3-4 weeks

- Checkpointer interface is well-defined
- State management is explicit (easier to encrypt)
- LangChain's auth framework can be extended

---

### 5. AutoGen (Microsoft) 🟢 (MEDIUM PRIORITY)

**Overview:** Microsoft Research multi-agent framework

- **Language:** Python
- **Stars:** 20K+
- **Architecture:** Conversational agents, group chat, distributed runtime

**Security Model:**

- Agent runtime environments (standalone vs distributed)
- Built-in observability
- Enterprise-grade security assumptions
- Agent identity management

**Security Gaps:**

- Credentials passed via UserProxyAgent
- No native encryption of messages
- Group chat messages visible to all
- No threshold decryption

**Proposed Integration:**

```python
# AutoGen FHE Integration Concept
class FHEMessageProtocol:
    """
    Encrypt AutoGen messages between agents.

    Messages between agents are encrypted end-to-end.
    Only sender and intended recipient can read.
    """

    def __init__(self, fhe_contracts):
        self.message_registry = FHEMessageRegistry(fhe_contracts)

    def send_message_encrypted(self, to_agent, content):
        """Send encrypted message - only recipient can decrypt"""
        encrypted = self.encrypt_for_recipient(to_agent, content)
        return self.message_registry.route(encrypted)

    def decrypt_message(self, encrypted_message, recipient):
        """Decrypt message if recipient is authorized"""
        if self.check_authorization(recipient, encrypted_message):
            return self.threshold_decrypt(encrypted_message)
```

**Priority: MEDIUM** - Enterprise focus, existing Microsoft security

**Effort Estimate:** 4-5 weeks

- Complex multi-agent patterns
- Need distributed runtime support
- Microsoft's own security investments

---

### 6. ZeroClaw ⚪ (MEDIUM PRIORITY)

**Overview:** Rust-based minimal runtime successor

- **Language:** Rust
- **Stars:** 26.8K
- **Architecture:** Minimal, fast, single binary

**Security Model:**

- Minimal code surface
- Rust memory safety
- No plugin ecosystem (security by design)

**Security Gaps:**

- Still needs credential management
- Memory-safe but not encrypted
- No agent memory encryption

**Proposed Integration:**

```rust
// ZeroClaw FHE Integration (Rust)
use fhe_agent_shield::{Vault, Memory};

pub struct FHECredentialStore {
    vault: Vault,
}

impl FHECredentialStore {
    pub fn new(contract_address: Address) -> Self {
        Self { vault: Vault::new(contract_address) }
    }

    pub fn store_api_key(&mut self, key: String) -> Result<Handle> {
        // Encrypt before storing
        let encrypted = self.vault.encrypt(key.as_bytes());
        self.vault.store(encrypted)
    }

    pub fn retrieve_with_threshold(
        &self,
        handle: Handle,
        approvers: Vec<Address>
    ) -> Result<String> {
        // Require threshold approvals
        self.vault.threshold_decrypt(handle, approvers)
    }
}
```

**Priority: MEDIUM** - Minimal design, easier integration

**Effort Estimate:** 3-4 weeks

- Rust integration via ABI/dylib
- Minimal interface to wrap
- Memory safety already good

---

### 7. Nanobot ⚪ (LOW PRIORITY)

**Overview:** Ultra-lightweight Python agent

- **Language:** Python
- **Stars:** 26.8K
- **Architecture:** 4K lines, focused on simplicity

**Security Model:**

- Minimal attack surface
- Limited tool access
- Simple credential handling

**FHE Value:**

- Basic protection would differentiate
- Simple integration path

**Priority: LOW** - Limited scope, less security concern

**Effort Estimate:** 1-2 weeks (low complexity)

---

## Integration Architecture

### Universal FHE Agent Interface

```
┌─────────────────────────────────────────────────────────────────┐
│                    FHE-Agent Shield Core                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ AgentVault   │  │ AgentMemory  │  │   ActionSealer       │ │
│  │ (encrypted)   │  │ (encrypted)   │  │   (threshold)       │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │              FHE-Provider Interface (SPI)                     │ │
│  │  - store_credential(encrypted) → handle                       │ │
│  │  - retrieve_credential(handle, threshold) → encrypted        │ │
│  │  - append_context(encrypted) → ()                            │ │
│  │  - seal_action(payload) → action_id                          │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  OpenClaw     │    │   NanoClaw    │    │    CrewAI     │
│  Adapter      │    │   Adapter     │    │   Adapter     │
│               │    │               │    │               │
│ - Decorators  │    │ - Middleware  │    │ - Crew Manager│
│ - MemoryProv  │    │ - Credential  │    │ - Role Enc    │
│ - Credential  │    │   Wrapper     │    │               │
└───────────────┘    └───────────────┘    └───────────────┘
```

---

## Roadmap Timeline

### Phase 1: Foundation (Weeks 1-4)

**Goal:** Create universal FHE Provider Interface

| Task             | Description                                         | Effort |
| ---------------- | --------------------------------------------------- | ------ |
| FHE-Provider SPI | Define universal interface for all agent frameworks | 1 week |
| TypeScript SDK   | Universal client library                            | 1 week |
| Python SDK       | Universal Python client                             | 1 week |
| Docs & Examples  | Integration guides                                  | 1 week |

**Deliverable:** Any agent framework can integrate via SDK

---

### Phase 2: NanoClaw Integration (Weeks 5-8)

**Goal:** First competitor integration

| Task                  | Description                    | Effort |
| --------------------- | ------------------------------ | ------ |
| NanoClaw Adapter      | Python middleware for NanoClaw | 1 week |
| Credential Encryption | Encrypt API keys in containers | 1 week |
| Memory Encryption     | Agent memory protection        | 1 week |
| Testing               | Integration tests              | 1 week |

**Deliverable:** NanoClaw with FHE protection

---

### Phase 3: CrewAI Integration (Weeks 9-13)

**Goal:** Multi-agent FHE support

| Task                  | Description                       | Effort  |
| --------------------- | --------------------------------- | ------- |
| Crew Manager Contract | Multi-agent coordination contract | 2 weeks |
| Role-Based Encryption | Per-role credential access        | 1 week  |
| Crew Memory           | Shared encrypted crew memory      | 1 week  |
| Threshold Actions     | Multi-agent approval flows        | 1 week  |

**Deliverable:** CrewAI with FHE crew protection

---

### Phase 4: LangGraph Integration (Weeks 14-18)

**Goal:** Production orchestration support

| Task             | Description                 | Effort  |
| ---------------- | --------------------------- | ------- |
| FHE Checkpointer | Encrypted state persistence | 2 weeks |
| State Store      | Replace Redis with FHE      | 1 week  |
| Tool Threshold   | Protected tool access       | 1 week  |
| Production Tests | Enterprise scenarios        | 1 week  |

**Deliverable:** LangGraph production FHE support

---

### Phase 5: AutoGen & ZeroClaw (Weeks 19-24)

**Goal:** Enterprise and performance focus

| Task                 | Description                 | Effort  |
| -------------------- | --------------------------- | ------- |
| AutoGen Adapter      | Distributed runtime support | 3 weeks |
| ZeroClaw Integration | Rust FHE library            | 2 weeks |
| Benchmarking         | Performance optimization    | 1 week  |

**Deliverable:** Full ecosystem coverage

---

## Implementation Priorities Matrix

| Framework | Security Need | Market Size | Integration Effort | Priority Score |
| --------- | ------------- | ----------- | ------------------ | -------------- |
| NanoClaw  | 9/10          | Medium      | Low                | **HIGH**       |
| CrewAI    | 7/10          | Large       | Medium             | **HIGH**       |
| LangGraph | 6/10          | Large       | Medium             | **HIGH**       |
| AutoGen   | 5/10          | Large       | High               | MEDIUM         |
| ZeroClaw  | 6/10          | Medium      | Medium             | MEDIUM         |
| Nanobot   | 4/10          | Medium      | Low                | LOW            |

**Priority Score = (Security Need × 0.4) + (Market Size × 0.3) + (Integration Ease × 0.3)**

---

## Success Metrics

### Adoption Metrics

- Number of FHE-Agent Shield integrations
- Number of encrypted credentials stored
- Number of protected agent contexts
- Number of threshold-released actions

### Security Metrics

- Reduction in credential exposure incidents
- Encryption coverage (% of agent data protected)
- Average threshold for sensitive operations

### Ecosystem Metrics

- Time to integrate new framework
- SDK adoption rate
- Community contributions

---

## Technical Dependencies

### Required Smart Contracts

1. **AgentVault** ✅ - Encrypted credential storage
2. **AgentMemory** ✅ - Encrypted agent context
3. **ActionSealer** ✅ - Threshold-released actions
4. **NEW: CrewManager** - Multi-agent coordination (Phase 3)
5. **NEW: StateStore** - Encrypted state persistence (Phase 4)

### SDK Requirements

1. **TypeScript SDK** - Universal (Phase 1)
2. **Python SDK** - Universal (Phase 1)
3. **Rust bindings** - ZeroClaw support (Phase 5)

---

## Conclusion

FHE-Agent Shield has the opportunity to become the **privacy standard for AI agents** across all frameworks. By focusing
first on security-conscious competitors (NanoClaw), large communities (CrewAI, LangGraph), and enterprise solutions
(AutoGen), we can establish FHE as essential infrastructure for safe AI agents.

**First mover advantage is critical** - the privacy layer that dominates one framework will likely become the standard
for all.
