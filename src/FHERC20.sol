// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { FHERC20 } from "@fhenixprotocol/contracts/experimental/token/FHERC20/FHERC20.sol";
import { inEuint128 } from "@fhenixprotocol/contracts/FHE.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";

event MintEncrypted(address indexed recipient, uint256 amount);

contract ExampleToken is FHERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 public immutable initialSupply;

    constructor(string memory tokenName, string memory tokenSymbol, uint256 initialBalance) FHERC20(tokenName, tokenSymbol) {
        initialSupply = initialBalance;
        if (!_grantRole(MINTER_ROLE, msg.sender)) {
            revert RoleGrantFailed();
        }
        _mint(msg.sender, initialBalance);
    }

    error RoleGrantFailed();

    function mintEncrypted(address recipient, inEuint128 memory encryptedAmount) external onlyRole(MINTER_ROLE) {
        _mintEncrypted(recipient, encryptedAmount);
        emit MintEncrypted(recipient, 0); // Amount is encrypted, cannot log unsealed value
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
}
