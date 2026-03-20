# AI Agent Framework Competitive Analysis

**FHE-Agent Shield vs. Industry Standards**

## Executive Summary

FHE-Agent Shield provides **true end-to-end encryption** for AI agents using Fully Homomorphic Encryption (FHE) via Fhenix CoFHE. Unlike competitors that offer only "encryption at rest" (where the server holds keys), FHE-Agent Shield ensures **no party can decrypt data without proper authorization** — not even the platform operator.

## Market Landscape

| Framework | GitHub Stars | Language | Memory | Credentials | Encryption |
|-----------|-------------|----------|--------|-------------|------------|
| **OpenClaw** | 327K | TypeScript/Node.js | Plaintext | Plaintext | None |
| **Moltis** | 2.3K | Rust | SQLite + vector | Vault (XChaCha20) | At-rest only |
| **IronClaw** | 10K+ | Rust | Plaintext | Plaintext | None (privacy focus) |
| **ZeroClaw** | - | Rust | Plaintext | Plaintext | WASM sandbox |
| **GoClaw** | - | Go | Plaintext | Plaintext | None |
| **ElixirClaw** | 13 | Elixir | Plaintext | Plaintext | OTP reliability |
| **NullClaw** | - | Zig | Plaintext | Plaintext | None |
| **AutoGPT** | 170K+ | Python | Plaintext | Plaintext | None |
| **CrewAI** | 43K | Python | SQLite plaintext | Plaintext | PII redaction only |
| **LangGraph** | 26K | Python/JS | SQLite + encryption API | Plaintext | At-rest (server key) |
| **AutoGen** | 40K+ | Python | Plaintext | Plaintext | None |
| **Semantic Kernel** | - | C#/Python | Varies | Plaintext | None |
| **JanHQ** | - | Rust | Plaintext | Plaintext | None (has OpenClaw integration) |

## OpenClaw Ecosystem: Multi-Language Analysis

O ecossistema OpenClaw exploded em 2026 com múltiplas reimplementações em diferentes linguagens:

### 0. Moltis (Rust) - `moltis-org/moltis` ⭐ **NOVO**

**Stars:** 2.3K | **Forks:** 263 | **Language:** Rust (67.8%) | **License:** MIT

**Overview:** Moltis is a Rust-native personal AI assistant that was designed as an alternative to OpenClaw. It compiles into a single binary without requiring external runtimes like Node.js or Python.

**Key Features:**
- **Zero unsafe code** — denied workspace-wide, only opt-in FFI behind `local-embeddings` flag
- **Sandboxed execution** — Docker + Apple Container, per-session isolation
- **Secret handling** — `secrecy::Secret`, zeroed on drop, redacted from tool output
- **Authentication** — password + passkey (WebAuthn), rate-limited, per-IP throttle
- **Vault encryption** — XChaCha20-Poly1305 + Argon2id for at-rest encryption
- **MCP support** — Built-in MCP servers (stdio + HTTP/SSE)
- **Voice I/O** — Built-in (15+ TTS/STTS providers)
- **2,300+ tests** with 0 unsafe code
- **46 modular crates** for auditability

**Architecture:**
- `moltis-vault` — Encryption-at-rest vault (NOT FHE)
- `moltis-auth` — Password + passkey + API key auth
- `moltis-memory` — SQLite + vector embeddings + full-text search
- `moltis-skills` — Runtime skill system
- `moltis-mcp` — MCP protocol support
- `moltis-swift-bridge` — Swift integration

**Security Analysis:**
- Vault encryption uses XChaCha20-Poly1305 + Argon2id — **NOT FHE**
- Secrets are encrypted at rest but server CAN decrypt with key
- SSRF protection, CSWSH protection built-in
- **Gap:** No threshold decryption, no FHE computation

**FHE-Agent Shield Opportunity:** Our Rust SDK could integrate with Moltis via:
1. **FHE Credential Vault** — Replace `moltis-vault` with FHE-backed storage
2. **FHE Memory Layer** — Encrypt memory context with FHE
3. **MCP FHE Tools** — Add FHE-enabled MCP tool servers

```rust
// Moltis + FHE-Agent Shield integration
use fhe_agent_shield::{FHECredentialVault, MoltisBridge};

// Replace Moltis vault with FHE vault
let fhe_vault = FHECredentialVault::new(
    contract_address,
    threshold: 2,
);

// Moltis can now use FHE for credential management
let credential = fhe_vault.retrieve_with_threshold(
    permit: "tool-access",
    signatures: vec![sig1, sig2],
)?;
```

---

### 0.1 Moltbook (Social Network) - AI Agent Social Layer

**Overview:** Moltbook is a social network for AI agents (1.5M+ agents, 17.6K+ communities). It was created by an AI agent (Clawd Clawderberg) in January 2026.

**Official SDK:** `moltbook/agent-development-kit`
- TypeScript (66.9%)
- Swift (15.8%)
- Kotlin (13.7%)
- Package: `@moltbook/sdk`

**Key Integrations Found:**
- `gitroomhq/postiz-app` — Moltbook provider for social media posting
- `borovkovgroup/moltbook-agent` — Claude Code plugin for Moltbook

**Security Issues Found:**
- **1.5M+ tokens exposed** in production due to hardcoded credentials
- Missing row-level security (RLS)
- Unrestricted agent execution

**FHE-Agent Shield Opportunity:**
- FHE credential layer for Moltbook agents
- Encrypted agent memory on-chain
- Threshold authorization for agent actions

---

### 0.2 Moltworker - Cloudflare Workers Deployment

**Overview:** `cloudflare/moltworker` runs Moltbot/OpenClaw in Cloudflare Sandbox containers.

**Features:**
- Web UI at /
- WebSocket support for real-time communication
- Admin UI at /_admin/

**FHE-Agent Shield Opportunity:**
- TypeScript SDK for Cloudflare Workers
- FHE edge computing via Fhenix

---

## OpenClaw Ecosystem: Multi-Language Analysis

O ecossistema OpenClaw exploded em 2026 com múltiplas reimplementações em diferentes linguagens:

### 1. IronClaw (Rust) - `nearai/ironclaw` ⭐

**Stars:** 10,322 | **Language:** Rust (90.5%) | **License:** Apache 2.0

**Philosophy:** "Your secure personal AI assistant, always on your side"

**Key Features:**
- Privacy-focused design (ironic - sem FHE ainda)
- WASM sandbox para skills
- Multi-language support (English, 简体中文, Русский)
- 70 contributors, 22 releases

**Security:** Nenhuma menção de encryption - apenas "privacy-focused design"

**FHE-Agent Shield Opportunity:** Integraremos via Rust SDK para dar FHE real

```rust
// IronClaw integration com FHE-Agent Shield
use fhe_agent_shield::{FHECredentialVault, AgentVault};

let vault = FHECredentialVault::new(contract_address);
let protected_skill = vault.wrap_skill(base_skill, FHEConfig::default());
```

---

### 2. ZeroClaw (Rust) - Performance Extrema

**Binary Size:** <5MB | **Language:** Rust | **Isolation:** WASM sandbox

**Philosophy:** Minimal footprint, maximum security through hardware-level isolation

**Key Features:**
- Self-contained binary
- WASM sandbox para segurança
- <5MB RAM usage
- Designed for underpowered devices

**Security:** WASM sandbox (não FHE) - mais seguro que OpenClaw original mas ainda não E2E

---

### 3. GoClaw (Go) - Lean Rewrite

**Memory Usage:** 4-8x less than OpenClaw | **Binary:** Single file

**Philosophy:** "Understand how OpenClaw works by recreating it"

**Key Features:**
- Single binary, loads instantly
- Same skills format compatibility
- Telegram and WhatsApp channels
- Optimized for simplicity and self-contained deployment

**Security:** Nenhum - plaintext como OpenClaw

---

### 4. ElixirClaw (Elixir) - OTP Reliability ⭐

**Stars:** 13 | **Language:** Elixir (93.9%) | **License:** MIT

**Repository:** [developerfred/ElixirClaw](https://github.com/developerfred/ElixirClaw)

**Philosophy:** "High-performance OpenClaw Node implemented in pure Elixir"

**Key Features:**
- **OTP Reliability:** 99.9999999% uptime - built on BEAM (WhatsApp, Ericsson, Nintendo Online)
- **Hot Reload:** Update AI node without restarting
- **Built-in Telemetry:** See agent thinking in real-time
- **Security First:** Input sanitization, TLS, command allowlisting
- **BEAM Distribution:** Scale to 1000 nodes with built-in clustering
- WebSocket client with TLS
- Camera/screen capture (macOS, Linux)
- System notifications
- Location services
- Command execution with allowlist

**Supported LLM Providers:**
- Claude (Anthropic)
- OpenAI GPT-4
- NVIDIA NIM
- OpenRouter
- OpenCode

**Security:** Input sanitization + TLS, mas **sem FHE encryption**

**FHE-Agent Shield Opportunity:** Elixir SDK com FHE real

```elixir
# ElixirClaw integration com FHE-Agent Shield
{:ok, client} = FHEAgentShield.new(
  network: :fhenix_helium,
  private_key: System.get_env("PRIVATE_KEY")
)

# Wrap ElixirClaw skill with FHE protection
{:ok, protected_cap} = FHEAgentShield.wrap_elixir_claw_skill(
  client,
  "screen.record",
  require_permits: ["screen_record"]
)

# Create FHE-protected memory handler
{:ok, memory} = FHEAgentShield.create_elixir_claw_memory(client)

# Create FHE credential vault
{:ok, vault} = FHEAgentShield.create_elixir_claw_vault(client)
```

---

### 5. NullClaw (Zig) - Minimalismo Radical

**Binary Size:** 678 KB | **RAM:** ~1 MB

**Philosophy:** "AI assistants can run on under 1 MB RAM"

**Key Features:**
- Written in Zig (performance + safety)
- Extremely lightweight
- For embedded/IoT use cases

**Security:** Nenhum encryption mencionado

---

### 5. Nanobot - Minimalismo Radical

**Philosophy:** Radical minimalism, maximum efficiency

**Different from others:** Focado em ser smallest possible

---

### 6. ClawWork - Economic Accountability

**Philosophy:** Economic accountability for AI agents

**Novel Feature:** Introduz conceito de "economic accountability" - agentes pagam por recursos

---

### 7. Python SDK - `openclaw-sdk`

**Package:** [PyPI: openclaw-sdk](https://pypi.org/project/openclaw-sdk/) | **Requirements:** Python 3.11+

**Features:**
- Execute agents (sync/async)
- Manage channels
- Schedule cron jobs
- Manage skills via CLI
- Monitor costs (token usage tracking)
- Build pipelines
- Extract structured data (Pydantic models)
- FastAPI integration

**FHE-Agent Shield Opportunity:** Já temos CrewAI integration - podemos adicionar GoClaw/Python SDK bridging

---

### 8. JanHQ + OpenClaw Integration (Rust)

JanHQ tem OpenClaw built-in via Rust:

```rust
// janhq/jan - OpenClaw integration
use crate::core::openclaw::{
    commands::*,
    sandbox::{Sandbox, IsolationTier},
};

const DOCKER_CONTAINER_NAME: &str = "jan-openclaw";
```

**Security:** Docker isolation, mas plaintext credentials

---

## Detailed Competitor Analysis

### LangGraph (LangChain)

**Current State:**
- 26K GitHub stars
- Graph-based orchestration
- Checkpointing with SQLite
- Beta encryption API (server holds keys)
- **Security Issues:**
  - CVE-2026-28277: Deserialization of untrusted data
  - Encryption requires server-side key management
  - Not true E2E — server can decrypt

**FHE-Agent Shield Opportunity:**
```
langgraph.checkpointer = FHECheckpointSaver({
  contractAddress: '0x...',  // AgentMemory.sol
  thresholdNetwork: 'https://api.helium.fhenix.zone',
});
```

---

### CrewAI

**Current State:**
- 43K GitHub stars
- Multi-agent collaboration
- SQLite storage for crew memory
- PII redaction (Enterprise feature)
- **Security Issues:**
  - All data stored in plaintext SQLite
  - No encryption at rest
  - Shared database = shared secrets

**FHE-Agent Shield Opportunity:**
```python
# Python SDK integration
from fhe_agent_shield import FHEAgentShield

shield = FHEAgentShield(
    network='fhenix-helium',
    privateKey=os.getenv('PRIVATE_KEY'),
    contracts=contract_addresses,
)
await shield.memory.append_context(encrypted_context)
```

---

### AutoGen (Microsoft)

**Current State:**
- 40K+ GitHub stars
- Multi-agent conversations
- No native memory/credential system
- Depends on external storage

**FHE-Agent Shield Opportunity:**
```python
from fhe_agent_shield import CredentialVault

vault = CredentialVault(provider='fhenix', contract='0x...')
api_key = await vault.retrieve_credential(key='openai-api-key', permit='llm-access')
```

---

## FHE-Agent Shield Unique Value Proposition

### What We Offer That Competitors Don't

| Feature | OpenClaw | Moltis | IronClaw | ElixirClaw | GoClaw | CrewAI | LangGraph | **FHE-Agent Shield** |
|---------|----------|--------|----------|------------|--------|--------|-----------|----------------------|
| E2E Encryption | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| FHE Computation | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Server Cannot Decrypt | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| On-Chain Memory | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Optional | ✅ |
| Credential Vault | ❌ | ✅* | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| WASM Sandbox | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Rust Implementation | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| OTP Reliability | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| <5MB Binary | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ (FHE overhead) |

*Moltis has `moltis-vault` but uses XChaCha20-Poly1305 — server CAN decrypt with key, NOT FHE

### Key Differentiators

1. **Server Cannot Decrypt**
   - FHE allows computation on encrypted data
   - Even Fhenix nodes cannot see plaintext
   - Only threshold signature releases data

2. **On-Chain State**
   - Credentials stored on Fhenix blockchain
   - No single database to breach
   - Decentralized trust model

3. **Zero Trust Architecture**
   - Every credential access requires permit
   - Threshold decryption prevents single point of failure
   - Audit trail on-chain

4. **Universal Language Support**
   - TypeScript SDK → OpenClaw, LangGraph, ElizaOS
   - Python SDK → CrewAI, AutoGen, LangGraph
   - Rust SDK → IronClaw, ZeroClaw, JanHQ
   - Elixir SDK → ElixirClaw (NEW!)
   - Go SDK → GoClaw (future)
   - Zig SDK → NullClaw (future)

## Integration Roadmap

### Phase 1: OpenClaw Ecosystem (Current)
- [x] FHESkillDecorator (TypeScript)
- [x] FHEAgentMemoryProvider (TypeScript)
- [x] FHECredentialVault (TypeScript)
- [x] ElizaOS plugin
- [x] Python SDK → CrewAI integration
- [x] TypeScript SDK → LangGraph
- [ ] Full credential flow on testnet

### Phase 2: Cross-Language SDKs
- [x] Python SDK → CrewAI integration
- [x] Rust SDK → Custom agent frameworks
- [x] TypeScript SDK → LangGraph
- [x] Elixir SDK → ElixirClaw integration (NEW!)
- [ ] Rust SDK → Moltis integration (PRIORITY!)
- [ ] Rust SDK → IronClaw/ZeroClaw integration
- [ ] Go SDK → GoClaw integration
- [ ] Zig SDK → NullClaw integration

### Phase 3: Enterprise
- [ ] FHE checkpoint saver for LangGraph
- [ ] FHE memory layer for AutoGen
- [ ] FHE credential provider for Semantic Kernel
- [ ] FHE gateway para IronClaw/ZeroClaw
- [ ] FHE Moltbook agent credentials
- [ ] FHE Moltworker integration (Cloudflare)

## Security Comparison: Real Encryption vs. Marketing

| Framework | "Encryption" Claim | Reality |
|-----------|-------------------|---------|
| LangGraph | "Encryption API" | Server holds keys — can decrypt |
| CrewAI | "PII Redaction" | Redacts in traces — stored plaintext |
| OpenClaw | None | Plaintext everything |
| IronClaw | "Privacy-focused" | No encryption - marketing only |
| ElixirClaw | "Security First" | Input sanitization only - no encryption |
| ZeroClaw | "WASM sandbox" | Isolation, not encryption |
| ClawSouls | "E2E Memory" | Uses GitHub as encrypted backend |
| **FHE-Agent Shield** | **True E2E FHE** | **Server cannot decrypt** |

## OpenClaw/Molt Variants Comparison

| Variant | Language | Size | Memory | Security | FHE |
|---------|----------|------|--------|----------|-----|
| OpenClaw | TypeScript | ~100MB | High | None | ❌ |
| Moltis | Rust | 44MB | Medium | Vault (XChaCha20) | ❌ |
| IronClaw | Rust | ~50MB | Medium | Privacy-focused | ❌ |
| ElixirClaw | Elixir | ~30MB | Medium | OTP reliability | ❌ |
| ZeroClaw | Rust | <5MB | Low | WASM sandbox | ❌ |
| GoClaw | Go | <10MB | Low | None | ❌ |
| NullClaw | Zig | 678KB | Very Low | None | ❌ |
| Nanobot | ? | Minimal | Ultra Low | None | ❌ |
| ClawWork | ? | ? | ? | Economic | ❌ |
| Moltbook | Multi | SDK | High | API keys | ❌ |
| **FHE-Agent Shield** | **TS/Py/Rust/Elixir** | **~10MB** | **Medium** | **True E2E FHE** | **✅** |

## Conclusion

O ecossistema OpenClaw/Molt exploded em 2026 com variantes em Rust, Elixir, Go, Zig e mais - cada uma otimizando para different metrics (performance, size, isolation, reliability). **Nenhuma** implementa FHE real.

**Moltis** é o mais interessante - tem vault encryption (XChaCha20-Poly1305) mas ainda é "server CAN decrypt" - não FHE.

FHE-Agent Shield é a **única** solução que oferece:
1. **True end-to-end encryption** — server never sees plaintext
2. **On-chain FHE computation** — decentralized, auditable
3. **Threshold decryption** — no single point of trust
4. **Universal SDK** — TypeScript, Python, Rust, Elixir, Go (coming)

Competitors estão resolvendo sintomas (PII redaction, encryption at rest, WASM sandbox, OTP reliability). FHE-Agent Shield resolve a causa raiz: **o server nunca deveria ter acesso aos dados em plaintext**.

**Próximos passos para FHE-Agent Shield:**
1. Integrar Rust SDK com Moltis (substituir vault por FHE)
2. Adicionar FHE credential layer para Moltbook agents
3. Cloudflare Workers FHE via Moltworker

## References

- [Moltis - Rust-native claw](https://github.com/moltis-org/moltis)
- [Moltbook - Social network for AI agents](https://github.com/moltbook/agent-development-kit)
- [Moltworker - Cloudflare Workers](https://github.com/cloudflare/moltworker)
- [IronClaw - nearai/ironclaw](https://github.com/nearai/ironclaw)
- [ZeroClaw - Rust minimal agent](https://dev.to/lightningdev123/zeroclaw-a-minimal-rust-based-ai-agent-framework-for-self-hosted-systems-5593)
- [GoClaw - Lean Go rewrite](https://www.linkedin.com/posts/sausheong_github-sausheonggoclaw-self-hosted-ai-activity-7432597690913398784-ZwsE)
- [ElixirClaw - Pure Elixir OpenClaw](https://github.com/developerfred/ElixirClaw)
- [OpenClaw SDK Python](https://masteryodaa.github.io/openclaw-sdk/)
- [JanHQ OpenClaw Integration](https://github.com/janhq/jan)
- [FHE-Agent Shield SDKs](../sdk/)
- [Fhenix CoFHE Documentation](https://docs.fhenix.zone)
