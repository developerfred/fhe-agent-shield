# Solidy-FHE Skill

> **Expertise: FHE-enabled Solidity smart contracts using Foundry + Fhenix CoFHE**

## Quick Reference

### FHE Types (from `@fhenixprotocol/contracts/FHE.sol`)

```solidity
// Encrypted integer types
euint8, euint16, euint32, euint64, euint128, euint256

// Encrypted boolean
ebool

// Input types (for function parameters)
inEuint8, inEuint16, inEuint32, inEuint64, inEuint128, inEuint256
inEbool
```

### Core FHE Operations

```solidity
// Arithmetic
FHE.add(euint32 a, euint32 b) → euint32
FHE.sub(euint32 a, euint32 b) → euint32
FHE.mul(euint32 a, euint32 b) → euint32
FHE.div(euint32 a, euint32 b) → euint32
FHE.rem(euint32 a, euint32 b) → euint32

// Comparison (returns ebool)
FHE.eq(euint32 a, euint32 b) → ebool
FHE.ne(euint32 a, euint32 b) → ebool
FHE.lt(euint32 a, euint32 b) → ebool
FHE.le(euint32 a, euint32 b) → ebool
FHE.gt(euint32 a, euint32 b) → ebool
FHE.ge(euint32 a, euint32 b) → ebool

// Logical
FHE.and(ebool a, ebool b) → ebool
FHE.or(ebool a, ebool b) → ebool
FHE.xor(ebool a, ebool b) → ebool
FHE.not(ebool a) → ebool

// Casting
FHE.asEuint32(uint32 plaintext) → euint32  // Reencrypt plaintext
FHE.asEuint32(euint64 value) → euint32      // Downcast
FHE.cast(fhelix.EuintX memory value) → euintY  // Type cast
```

### Access Control (Permits)

```solidity
// Grant permission for THIS contract to access encrypted state
FHE.allowThis(euint32 value);

// Grant permission for SENDER to access encrypted state
FHE.allowSender(euint32 value);

// Revoke permissions
FHE.disallowThis(euint32 value);
FHE.disallowSender(euint32 value);

// Check permissions (off-chain only via SDK)
```

### Import Pattern

```solidity
import { FHE } from "@fhenixprotocol/contracts/FHE.sol";
import { inEuint256 } from "@fhenixprotocol/contracts/FHE.sol";
```

### Minimal FHE Contract Template

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { FHE } from "@fhenixprotocol/contracts/FHE.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";

contract MyFHEContract is AccessControl {
    euint256 public encryptedValue;

    function setValue(inEuint256 memory value) public {
        encryptedValue = FHE.asEuint256(value);
        FHE.allowThis(encryptedValue);
        FHE.allowSender(encryptedValue);
    }

    function getValue() public view returns (bytes memory) {
        return abi.encode(encryptedValue);
    }
}
```

## Testing with Foundry

### Using forge-std

```solidity
// test/MyContract.t.sol
pragma solidity ^0.8.27;

import { Test } from "forge-std/Test.sol";
import { MyFHEContract } from "../src/MyFHEContract.sol";

contract MyFHEContractTest is Test {
    MyFHEContract public contract;

    function setUp() public {
        contract = new MyFHEContract();
    }
}
```

### Test Utilities (for mock FHE)

When testing without real FHE (local development), use the mock helpers:

```solidity
import { FheHelper, PermissionHelper } from "@fhenixprotocol/contracts/test/TestUtils.sol";
```

### Gas Considerations

- FHE operations cost MORE gas than plaintext operations
- Mock tests will show higher gas than production
- Always test on testnet for accurate gas estimation

## Common Patterns

### 1. Encrypted Counter

```solidity
contract EncryptedCounter {
    euint32 public count;

    function increment() public {
        count = FHE.add(count, FHE.asEuint32(1));
        FHE.allowThis(count);
        FHE.allowSender(count);
    }

    function incrementBy(uint32 amount) public {
        euint32 encAmount = FHE.asEuint32(amount);
        count = FHE.add(count, encAmount);
        FHE.allowThis(count);
        FHE.allowSender(count);
    }
}
```

### 2. Private Voting

```solidity
contract PrivateVoting {
    mapping(bytes32 => euint32) public votes;
    mapping(address => ebool) public hasVoted;

    function castVote(bytes32 proposalId, inEuint32 memory voteValue) public {
        // Prevent double voting
        require(FHE.eq(hasVoted[msg.sender], FHE.asEbool(false)));

        votes[proposalId] = FHE.add(votes[proposalId], voteValue);
        hasVoted[msg.sender] = FHE.asEbool(true);

        FHE.allowThis(votes[proposalId]);
    }
}
```

### 3. Sealed Bid

```solidity
contract SealedBidAuction {
    mapping(bytes32 => euint256) public sealedBids;
    euint256 public highestBid;
    address public highestBidder;

    function submitBid(inEuint256 memory encryptedBid) public {
        sealedBids[msg.sender] = encryptedBid;
        FHE.allowThis(sealedBids[msg.sender]);

        // Compare with current highest (on-chain comparison)
        ebool isHigher = FHE.gt(encryptedBid, highestBid);
        // Note: Real implementation needs threshold decryption to reveal winner
    }
}
```

## Best Practices

1. **Always call `FHE.allowThis()` and `FHE.allowSender()`** after modifying encrypted state
2. **Use `in` types for input parameters** (they're handles/references)
3. **Use plaintext types for output** (caller must decrypt via SDK)
4. **Keep operations on-chain** - don't try to decrypt mid-computation
5. **Batch operations** when possible to reduce threshold decryption calls
6. **Use events sparingly** - they may leak information via topics

## Troubleshooting

| Error                        | Solution                                   |
| ---------------------------- | ------------------------------------------ |
| `Type error: cannot convert` | Use `FHE.asEuintXX()` to convert plaintext |
| `FHE operations require...`  | Import FHE.sol correctly                   |
| `Invalid handle`             | Input type must be `inEXXX`, not `eXXX`    |
| `Gas too high`               | Consider moving computation off-chain      |

## References

- [Fhenix Documentation](https://docs.fhenix.zone)
- [CoFHE Library](https://cofhe-docs.fhenix.zone/fhe-library/introduction/overview)
- [Fhenix Foundry Template](https://github.com/FhenixProtocol/fhenix-foundry-template)
