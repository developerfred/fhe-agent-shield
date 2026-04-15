# React Hooks for FHE Integration

> **Expertise: Building React interfaces for FHE-enabled contracts using @cofhe/sdk and @cofhe/react**

## Core Hooks

### useFHEClient()

```typescript
import { useFHEClient } from "@cofhe/react";

function useFHEClient() {
  const { client, isReady, error } = useFHEClient();

  if (isReady) {
    return { client, isReady, error };
  }

  return { client: null, isReady: false, error };
}
```

**Returns:**

- `client: FheTypes.Client | null` - The FHE client instance
- `isReady: boolean` - Whether client is initialized
- `error: Error | null` - Any initialization errors

### useEncrypt()

```typescript
import { useEncrypt } from "@cofhe/react";
import { Encryptable } from "@cofhe/sdk";

function MyComponent() {
  const { encrypt, encryptedValues, isEncrypting, error } = useEncrypt();

  const handleEncrypt = async (value: bigint) => {
    const result = await encrypt([Encryptable.uint256(value)]);
    console.log("Encrypted:", result);
  };
}
```

**Parameters:** Array of `Encryptable` values **Returns:**

- `encrypt(values: Encryptable[]): Promise<EncryptedNumber[]>` - Encrypt values
- `encryptedValues: EncryptedNumber[]` - Last encrypted values
- `isEncrypting: boolean` - Loading state
- `error: Error | null` - Any errors

### useDecrypt()

```typescript
import { useDecrypt } from "@cofhe/react";
import { FheTypes } from "@cofhe/sdk";

function MyComponent() {
  const { decrypt, decryptedValue, isDecrypting, error } = useDecrypt();

  const handleDecrypt = async (encryptedHandle: string) => {
    const result = await decrypt(encryptedHandle, FheTypes.Uint256);
    console.log("Decrypted:", result);
  };
}
```

**Parameters:**

- `encryptedHandle: string` - The encrypted value handle
- `type: FheTypes` - The plaintext type (Uint256, Uint32, etc.)

**Returns:**

- `decrypt(handle, type): Promise<bigint>` - Decrypt and return plaintext
- `decryptedValue: bigint | null` - Last decrypted value
- `isDecrypting: boolean` - Loading state
- `error: Error | null` - Any errors

### useWrite()

```typescript
import { useWrite } from "@cofhe/react";

function MyContractComponent() {
  const { write, isWriting, txHash, error } = useWrite();

  const incrementCounter = async () => {
    const tx = await write({
      contractAddress: "0x...",
      contractName: "Counter",
      method: "increment",
      params: [],
    });
    console.log("Transaction:", tx.hash);
  };
}
```

**Parameters:** WriteConfig object

```typescript
interface WriteConfig {
  contractAddress: string;
  contractName: string;
  method: string;
  params?: any[];
  value?: bigint;
}
```

**Returns:**

- `write(config): Promise<TransactionResponse>` - Execute transaction
- `isWriting: boolean` - Transaction pending state
- `txHash: string | null` - Last transaction hash
- `error: Error | null` - Any errors

## Contract Interaction Patterns

### 1. Reading Encrypted State

```typescript
import { useContractRead } from 'wagmi';
import { useFHEClient } from '@cofhe/react';

function EncryptedBalance() {
  const { client, isReady } = useFHEClient();

  // Standard contract read
  const { data: encryptedBalance } = useContractRead({
    address: '0x...',
    abi: [...],
    functionName: 'encryptedBalanceOf',
    args: [address],
  });

  // Decrypt when client is ready
  const { decrypt } = useDecrypt();

  useEffect(() => {
    if (encryptedBalance && isReady && client) {
      decrypt(encryptedBalance, FheTypes.Uint256)
        .then(setBalance);
    }
  }, [encryptedBalance, isReady, client]);
}
```

### 2. Writing with Encryption

```typescript
function SetValueComponent() {
  const { client, isReady } = useFHEClient();
  const { encrypt } = useEncrypt();
  const { write } = useWrite();

  const setValue = async (newValue: bigint) => {
    if (!isReady || !client) return;

    // Step 1: Encrypt the input
    const [encryptedValue] = await encrypt([Encryptable.uint256(newValue)]);

    // Step 2: Send transaction with encrypted input
    await write({
      contractAddress: "0x...",
      contractName: "MyContract",
      method: "setValue",
      params: [encryptedValue],
    });
  };
}
```

### 3. Full Encrypted Token Transfer

```typescript
function TransferComponent() {
  const { client, isReady } = useFHEClient();
  const { encrypt } = useEncrypt();
  const { write } = useWrite();

  const transfer = async (to: string, amount: bigint) => {
    if (!isReady || !client) return;

    // Encrypt amount (no need to encrypt 'to' - it's an address)
    const [encryptedAmount] = await encrypt([Encryptable.uint256(amount)]);

    await write({
      contractAddress: "0x...",
      contractName: "FHERC20",
      method: "transferEncrypted",
      params: [to, encryptedAmount],
    });
  };
}
```

## Provider Setup

### FHEProvider

```typescript
import { FHEProvider } from '@cofhe/react';
import { BrowserProvider } from 'ethers';

function App() {
  return (
    <FHEProvider
      config={{
        provider: browserProvider, // from wagmi or ethers
        network: 'arbitrumSepolia', // or 'baseSepolia', 'sepolia'
      }}
    >
      <YourApp />
    </FHEProvider>
  );
}
```

## Error Handling

```typescript
function SecureComponent() {
  const { client, isReady, error: clientError } = useFHEClient();
  const { decrypt, error: decryptError } = useDecrypt();
  const { write, error: writeError } = useWrite();

  // Combine errors
  const error = clientError || decryptError || writeError;

  if (error) {
    return <ErrorBoundary error={error} />;
  }

  if (!isReady) {
    return <Loading />;
  }

  return <SecureContent />;
}
```

## Best Practices

1. **Always check `isReady`** before performing operations
2. **Use `Permit`** for authorization when decrypting
3. **Handle loading states** - FHE operations are async
4. **Catch errors** - encryption/decryption can fail
5. **Batch when possible** - reduce round trips

## Common Issues

| Issue                    | Solution                                  |
| ------------------------ | ----------------------------------------- |
| "Client not initialized" | Wrap in `FHEProvider`                     |
| "Invalid handle"         | Check encrypted value is properly encoded |
| "Permit required"        | Use `.withPermit()` before decrypt        |
| "Network mismatch"       | Verify network config in FHEProvider      |

## Example: Complete Encrypted Counter

```typescript
import { useState } from 'react';
import { useFHEClient, useEncrypt, useDecrypt, useWrite } from '@cofhe/react';
import { Encryptable, FheTypes } from '@cofhe/sdk';
import { useContractRead } from 'wagmi';

export function EncryptedCounter({ contractAddress }: { contractAddress: string }) {
  const [localCount, setLocalCount] = useState<bigint | null>(null);
  const { client, isReady } = useFHEClient();
  const { encrypt } = useEncrypt();
  const { decrypt } = useDecrypt();
  const { write, isWriting } = useWrite();

  // Read encrypted count
  const { data: encryptedCount } = useContractRead({
    address: contractAddress,
    abi: ['function count() view returns (bytes)'],
    functionName: 'count',
  });

  // Auto-decrypt when value changes
  useEffect(() => {
    if (encryptedCount && isReady && client) {
      decrypt(encryptedCount, FheTypes.Uint32).then(setLocalCount);
    }
  }, [encryptedCount, isReady]);

  const increment = async () => {
    if (!isReady) return;
    await write({
      contractAddress,
      contractName: 'Counter',
      method: 'increment',
      params: [],
    });
  };

  const incrementBy = async (amount: number) => {
    if (!isReady) return;
    const [encrypted] = await encrypt([Encryptable.uint32(amount)]);
    await write({
      contractAddress,
      contractName: 'Counter',
      method: 'incrementBy',
      params: [encrypted],
    });
  };

  return (
    <div>
      <p>Count: {localCount?.toString() ?? '...'}</p>
      <button onClick={increment} disabled={!isReady || isWriting}>
        Increment
      </button>
      <button onClick={() => incrementBy(5)} disabled={!isReady || isWriting}>
        Increment by 5
      </button>
    </div>
  );
}
```

## References

- [@cofhe/sdk](https://github.com/FhenixProtocol/cofhesdk)
- [@cofhe/react](https://github.com/FhenixProtocol/cofhesdk)
- [CoFHE React Documentation](https://cofhe-docs.fhenix.zone/cofhejs/introduction/overview)
