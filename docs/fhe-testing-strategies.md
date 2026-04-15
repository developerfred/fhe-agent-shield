# FHE Testing Strategies: Como Fhenix Resolve FHE em Test Networks

## Resumo Executivo

Existem **3 abordagens principais** para testar contratos FHE:

1. **MockFheOps** (Fhenix) - `vm.etch` para mockar precompile
2. **CoFheTest** (Fhenix) - Mock completo da arquitetura CoFHE
3. **forge-fhevm** (Zama) - Contratos reais em Foundry

---

## 1. MockFheOps (Fhenix Foundry Template)

### Como Funciona

O Fhenix Foundry Template usa `vm.etch` para substituir o endereço do precompile FHE (0x80) com uma implementação mock:

```solidity
// util/FheHelper.sol
contract FheEnabled {
    function initializeFhe() public {
        MockFheOps fheos = new MockFheOps();
        vm.etch(address(128), address(fheos).code);
    }
}
```

### Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    Foundry Test                          │
├─────────────────────────────────────────────────────────┤
│  Contract Using FHE                                     │
│  ┌─────────────────────────────────────────────────┐  │
│  │ inEuint256 input = FHE.asEuint256(encrypted);  │  │
│  │ euint256 result = FHE.add(a, b);               │  │
│  └─────────────────────────────────────────────────┘  │
│                         │                              │
│                         ▼                              │
│  ┌─────────────────────────────────────────────────┐  │
│  │ MockFheOps (at address 0x80)                   │  │
│  │ - trivialEncrypt() → returns input as "ciphertext"│  │
│  │ - add(a, b) → returns a + b (no real encryption)│  │
│  │ - verify() → returns success                    │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Vantagens
- ✅ Funciona em ANY network (Anvil, fork, etc)
- ✅ Não requer precompile real
- ✅ Testes rápidos

### Desvantagens
- ❌ Não é real FHE (dados expostos)
- ❌ Não testa ZK proofs
- ❌ Para testes de segurança, usar testnet real

### Uso

```solidity
import { FheEnabled } from "../util/FheHelper.sol";

contract MyTest is Test, FheEnabled {
    function setUp() public {
        initializeFhe();
    }
    
    function testFheOps() public {
        inEuint256 memory encrypted = encrypt256(42);
        // MockFheOps processa isso
    }
}
```

---

## 2. CoFheTest (Fhenix Mock Contracts)

### Como Funciona

O pacote `@fhenixprotocol/cofhe-mock-contracts` oferece mock completo da arquitetura CoFHE:

```solidity
import { CoFheTest } from "@fhenixprotocol/cofhe-mock-contracts/contracts/CoFheTest.sol";

contract MyTest is CoFheTest {
    function setUp() public {
        // Deploya MockTaskManager, ACL, MockZkVerifier, etc
    }
    
    function testWithMocks() public {
        InEuint256 memory input = createInEuint256(42, 0, address(this));
        // Usa mock completo com validação ZK
    }
}
```

### Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                 CoFheTest Base Contract                 │
├─────────────────────────────────────────────────────────┤
│  Contratos Deployados:                                 │
│  - MockTaskManager (0x...)  - Gateway FHE              │
│  - ACL (0xa6Ea4b...)        - Access Control           │
│  - MockZkVerifier (0x100)    - Verificação ZK           │
│  - MockQueryDecrypter (0x200) - Decrypt requests       │
│                                                         │
│  Os mocks simulam o comportamento real do CoFHE         │
└─────────────────────────────────────────────────────────┘
```

### Vantagens
- ✅ Arquitetura completa mockada
- ✅ Suporte a permissões e ACL
- ✅ Testes mais realistas

### Desvantagens
- ❌ Ainda não é FHE real
- ❌ Setup mais complexo

---

## 3. forge-fhevm (Zama) - NOVO!

### Como Funciona

O `forge-fhevm` da Zama é revolucionário - usa os **contratos reais** do fhEVM comoMocks:

```solidity
import { FhevmTest } from "forge-fhevm/FhevmTest.sol";

contract MyTest is FhevmTest {
    function testEncryptAndDecrypt() public {
        (externalEuint64 handle, bytes memory proof) = encryptUint64(42, address(this));
        
        euint64 verified = euint64.wrap(
            _executor.verifyInput(externalEuint64.unwrap(handle), address(this), proof, FheType.Uint64)
        );
        
        assertEq(decrypt(verified), 42);
    }
}
```

### Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    FhevmTest                            │
├─────────────────────────────────────────────────────────┤
│  Contratos REAIS deployados como proxies UUPS:         │
│  - FHEVMExecutor     - Processa operações FHE           │
│  - ACL              - Controle de acesso (transient)   │
│  - InputVerifier    - Verifica proofs EIP-712          │
│  - KMSVerifier      - Verifica KMS signatures          │
│                                                         │
│  Intercepção via vm.getRecordedLogs()                   │
│  Mantém banco de dados plaintext local                 │
└─────────────────────────────────────────────────────────┘
```

### Como Funciona (Detalhe)

1. `FhevmTest.setUp()` deploya os contratos reais
2. Operações FHE emitem eventos
3. `vm.getRecordedLogs()` intercepta os eventos
4. Mantém mapping handle → plaintext
5. Testes podem fazer assertEq com valores reais!

### Vantagens
- ✅ Contratos REAIS (mesmo código de produção)
- ✅ Testa ZK proofs
- ✅ Comportamento idêntico à mainnet
- ✅ Sem precompile necessário

### Desvantagens
- ❌ Requer setup adicional
- ❌ Mais pesado que mocks simples

### Instalação

```bash
forge install zama-ai/forge-fhevm
```

```toml
# foundry.toml
evm_version = "cancun"
solc = "0.8.27"
```

```solidity
// remappings.txt
forge-fhevm/=lib/forge-fhevm/src/
```

---

## 4. Testnets Reais (Ethereum Sepolia/Arbitrum Sepolia)

### Redes Suportadas

| Rede | Chain ID | RPC | Explorer |
|------|----------|-----|----------|
| Ethereum Sepolia | 11155111 | `https://rpc.sepolia.org` | `sepolia.etherscan.io` |
| Arbitrum Sepolia | 421614 | `https://sepolia-rollup.arbitrum.io/rpc` | `sepolia.arbiscan.io` |
| Base Sepolia | 84532 | `https://sepolia.base.org` | `sepolia.basescan.org` |

### Testes em Fork

```bash
# Forkar testnet
anvil --fork-url https://rpc.sepolia.org --port 8545

# Deploy e testar
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

---

## Comparação de Estratégias

| Estratégia | FHE Real | ZK Proofs | Velocidade | Complexidade |
|-----------|----------|-----------|------------|--------------|
| MockFheOps | ❌ | ❌ | ⚡⚡⚡ | Baixa |
| CoFheTest | ❌ | ⚡⚡ | ⚡⚡ | Média |
| forge-fhevm | ✅ | ✅ | ⚡⚡ | Média |
| Testnet Real | ✅ | ✅ | ⚡ | Alta |

---

## Recomendação para FHE-Agent Shield

### Abordagem em Camadas

```
┌─────────────────────────────────────────────────────────────────┐
│                    TESTING LAYERS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layer 1: Unit Tests (MockFheOps)                              │
│  ├─ 150+ testes passando com MockFheOps                        │
│  ├─ Testa lógica de contratos                                   │
│  └─ Rápido, CI-friendly                                        │
│                                                                 │
│  Layer 2: Integration Tests (forge-fhevm)                        │
│  ├─ Contratos reais FHEVM                                       │
│  ├─ Testa encrypt/decrypt/verify                                │
│  └─ Mais realista                                               │
│                                                                 │
│  Layer 3: Fork Tests (Testnets)                                │
│  ├─ Fork de Arbitrum Sepolia                                    │
│  ├─ Deploy real de contratos                                     │
│  └─ Testes end-to-end                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Status Atual

| Teste | Status | Estratégia |
|-------|--------|-----------|
| Foundry (local) | ✅ 150 passing | MockFheOps |
| Fork Arbitrum Sepolia | ✅ Working | `vm.etch` + contracts |
| Fork Ethereum Sepolia | ⚠️ RPC issue | Aguardando |
| forge-fhevm | ❌ Not integrated | Próximo passo |

---

## Próximos Passos

1. **Integrar forge-fhevm** para testes mais realistas
2. **Testar em Arbitrum Sepolia** quando RPC voltar
3. **Criar scripts de deploy** para cada testnet
4. **Adicionar testes de ZK proofs**

---

## Referências

- [Fhenix Foundry Template](https://github.com/fhenixprotocol/fhenix-foundry-template)
- [cofhe-mock-contracts](https://github.com/fhenixprotocol/cofhe-mock-contracts)
- [forge-fhevm](https://github.com/zama-ai/forge-fhevm)
- [Fhenix Docs - Quick Start](https://cofhe-docs.fhenix.zone/fhe-library/introduction/quick-start)
