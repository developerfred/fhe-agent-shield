# TypeScript Integration Tests

> Tests for FHE-Agent Shield TypeScript modules (OpenClaw integration)

## Overview

These tests verify the OpenClaw integration layer works correctly:

- `fhe-client.test.ts` - Mock FHE client and basic encryption/decryption
- `skill-decorator.test.ts` - FHESkillDecorator for wrapping OpenClaw skills
- `memory-provider.test.ts` - FHEAgentMemoryProvider for encrypted agent memory
- `credential-vault.test.ts` - FHECredentialVault for encrypted credentials

## Running Tests

```bash
# Install dependencies
bun install

# Run TypeScript tests
bun run test:ts

# Run with watch mode
bun run test:ts:watch

# Run specific test file
npx vitest run test/typescript/fhe-client.test.ts
```

## Test Structure

### Mock FHE Client

Since we can't connect to a real Fhenix network during testing, we use a `MockFHEClient` that simulates:

- Encryption/decryption operations
- Permission validation
- Threshold network behavior

### Key Test Patterns

```typescript
// 1. Setup mock client
const mockClient = getMockFHEClient();
mockClient.clear();

// 2. Create decorator with mock
const decorator = FHESkillDecorator.wrap(baseSkill, config, mockClient);

// 3. Execute and verify
const result = await decorator.execute(input, permit);
```

## OpenClaw Integration Testing

These tests verify the integration patterns used when connecting FHE-Agent Shield to OpenClaw.

### Prerequisites for Live Testing

To test with a real OpenClaw instance:

```bash
# 1. Install OpenClaw
npm install -g openclaw@latest

# 2. Start gateway
openclaw gateway --port 18789

# 3. Configure FHE-Agent Shield
export FHE_VAULT_ADDRESS=<deployed-vault-address>
export FHE_MEMORY_ADDRESS=<deployed-memory-address>
export THRESHOLD_RPC=https://rpc.sepolia.org

# 4. Register skills
cp -r skills/* ~/.openclaw/workspace/skills/
```

### Integration Test Patterns

#### Email Skill with FHE

```typescript
const emailSkill = FHESkillDecorator.createEmailSkill(
  {
    inputEncryption: true,
    outputEncryption: true,
    credentialVault: vaultAddress,
    requirePermits: ["send_email"],
  },
  fheClient,
);

await emailSkill.execute(
  {
    to: "recipient@example.com",
    subject: "Encrypted Message",
    body: "Secret content",
  },
  permit,
);
```

#### Browser Skill with FHE

```typescript
const browserSkill = FHESkillDecorator.createBrowserSkill(
  {
    inputEncryption: true,
    outputEncryption: false,
    credentialVault: vaultAddress,
    requirePermits: ["browser_access"],
  },
  fheClient,
);

await browserSkill.execute(
  {
    url: "https://secure-bank.com",
    action: "navigate",
  },
  permit,
);
```

#### File Skill with FHE

```typescript
const fileSkill = FHESkillDecorator.createFileSkill(
  {
    inputEncryption: true,
    outputEncryption: true,
    credentialVault: vaultAddress,
    requirePermits: ["read_files", "write_files"],
  },
  fheClient,
);

await fileSkill.execute(
  {
    path: "/secure/documents/contract.pdf",
    operation: "read",
  },
  permit,
);
```

## Security Test Scenarios

These tests verify security properties:

### Credential Protection

- Credentials encrypted before storage
- Only authorized parties can decrypt
- Credential rotation works correctly

### Context Protection

- Agent context encrypted on-chain
- Snapshots preserve encrypted state
- Multi-agent context isolation

### Skill Protection

- Input encryption prevents prompt injection
- Output encryption protects results
- Permit requirements enforced

## Troubleshooting

### Tests fail with "FHE Client not initialized"

Make sure to clear and reinitialize the mock client between tests:

```typescript
beforeEach(() => {
  mockClient = getMockFHEClient();
  mockClient.clear();
});
```

### Mock data persists between tests

The mock client is a singleton. Always call `mockClient.clear()` in `beforeEach`.

## CI Integration

These tests run as part of the CI pipeline:

```yaml
# .github/workflows/ci.yml
- name: Run TypeScript tests
  run: bun run test:ts

- name: Run Solidity tests
  run: forge test
```
