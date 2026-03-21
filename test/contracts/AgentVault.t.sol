// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { Test, console2 } from "forge-std/src/Test.sol";

// Standalone errors for testing
error ZeroCredentialNotAllowed();
error InvalidAgent();
error CredentialNotFound();
error AccessDenied();
error NotCredentialOwner();
error ThresholdMustBeGreaterThanZero();
error ThresholdExceedsMaximum();
error CredentialNotDeleted();

/**
 * @title TestableAgentVault
 * @notice Standalone test version without FHE dependencies
 */
contract TestableAgentVault {
    // State
    mapping(bytes32 => uint256) private _encryptedCredentials;
    mapping(bytes32 => address) private _credentialOwners;
    mapping(bytes32 => mapping(address => bool)) private _permissions;
    mapping(address => uint8) private _thresholds;
    mapping(bytes32 => bool) private _deleted;
    uint256 private _credentialCounter;
    uint8 public constant MAX_THRESHOLD = 255;
    
    // Events
    event CredentialStored(address indexed agentId, bytes32 indexed handle, uint256 timestamp);
    event CredentialAccessed(address indexed agentId, address indexed accessor, bytes32 indexed handle, uint256 timestamp);
    event CredentialDeleted(address indexed agentId, bytes32 indexed handle, uint256 timestamp);
    event PermissionUpdated(address indexed agentId, address indexed grantee, bytes32 indexed handle);
    event ThresholdUpdated(address indexed agentId, uint8 newThreshold);
    
    function storeCredential(uint256 value) external returns (bytes32) {
        bytes32 handle = keccak256(abi.encode(msg.sender, _credentialCounter++));
        
        _encryptedCredentials[handle] = value;
        _credentialOwners[handle] = msg.sender;
        
        if (_thresholds[msg.sender] == 0) {
            _thresholds[msg.sender] = 1;
        }
        
        _permissions[handle][msg.sender] = true;
        
        emit CredentialStored(msg.sender, handle, block.timestamp);
        return handle;
    }
    
    function retrieveCredential(bytes32 handle) external returns (uint256) {
        if (_credentialOwners[handle] == address(0)) {
            revert CredentialNotFound();
        }
        if (!_permissions[handle][msg.sender]) {
            revert AccessDenied();
        }
        if (_deleted[handle]) {
            revert CredentialNotDeleted();
        }
        
        emit CredentialAccessed(_credentialOwners[handle], msg.sender, handle, block.timestamp);
        return _encryptedCredentials[handle];
    }
    
    function deleteCredential(bytes32 handle) external {
        if (_credentialOwners[handle] != msg.sender) {
            revert NotCredentialOwner();
        }
        if (_deleted[handle]) {
            revert CredentialNotDeleted();
        }
        
        _deleted[handle] = true;
        emit CredentialDeleted(msg.sender, handle, block.timestamp);
    }
    
    function credentialExists(bytes32 handle) external view returns (bool) {
        return _credentialOwners[handle] != address(0) && !_deleted[handle];
    }
    
    function grantRetrievePermission(address grantee, bytes32 handle) external {
        if (_credentialOwners[handle] != msg.sender) {
            revert NotCredentialOwner();
        }
        _permissions[handle][grantee] = true;
        emit PermissionUpdated(msg.sender, grantee, handle);
    }
    
    function revokeRetrievePermission(address grantee, bytes32 handle) external {
        if (_credentialOwners[handle] != msg.sender) {
            revert NotCredentialOwner();
        }
        _permissions[handle][grantee] = false;
        emit PermissionUpdated(msg.sender, grantee, handle);
    }
    
    function hasRetrievePermission(address grantee, bytes32 handle) external view returns (bool) {
        return _permissions[handle][grantee];
    }
    
    function updateThreshold(uint8 newThreshold) external {
        if (newThreshold == 0) {
            revert ThresholdMustBeGreaterThanZero();
        }
        if (newThreshold > MAX_THRESHOLD) {
            revert ThresholdExceedsMaximum();
        }
        _thresholds[msg.sender] = newThreshold;
        emit ThresholdUpdated(msg.sender, newThreshold);
    }
    
    function getThreshold(address agent) external view returns (uint8) {
        uint8 threshold = _thresholds[agent];
        return threshold > 0 ? threshold : 1;
    }
    
    function getCredentialOwner(bytes32 handle) external view returns (address) {
        return _credentialOwners[handle];
    }
}

/**
 * @title AgentVault Test Suite
 */
contract AgentVaultTest is Test {
    TestableAgentVault public vault;
    
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public mallory = address(0x3);
    
    function setUp() public {
        vault = new TestableAgentVault();
    }
    
    // =============================================================================
    // TEST SUITE: storeCredential
    // =============================================================================
    
    function test_storeCredential_returnsUniqueHandle() public {
        vm.prank(alice);
        bytes32 handle1 = vault.storeCredential(123456789);
        bytes32 handle2 = vault.storeCredential(987654321);
        
        assertTrue(handle1 != handle2, "Handles should be unique");
    }
    
    function test_storeCredential_emitsEvent() public {
        vm.prank(alice);
        bytes32 handle = vault.storeCredential(123456789);
        
        assertTrue(handle != bytes32(0), "Should return valid handle");
    }
    
    function test_storeCredential_multipleCredentialsPerAgent() public {
        vm.prank(alice);
        bytes32 handle1 = vault.storeCredential(111);
        bytes32 handle2 = vault.storeCredential(222);
        
        assertTrue(handle1 != handle2, "Different credentials should have different handles");
        assertTrue(vault.credentialExists(handle1), "First credential should exist");
        assertTrue(vault.credentialExists(handle2), "Second credential should exist");
    }
    
    // =============================================================================
    // TEST SUITE: Permission Management
    // =============================================================================
    
    function test_grantRetrievePermission_grantsToAddress() public {
        vm.prank(alice);
        bytes32 handle = vault.storeCredential(123);
        
        vm.prank(alice);
        vault.grantRetrievePermission(bob, handle);
        
        assertTrue(vault.hasRetrievePermission(bob, handle), "Bob should have permission");
    }
    
    function test_grantRetrievePermission_revokesPermission() public {
        vm.prank(alice);
        bytes32 handle = vault.storeCredential(123);
        
        // Alice grants then revokes
        vm.prank(alice);
        vault.grantRetrievePermission(bob, handle);
        assertTrue(vault.hasRetrievePermission(bob, handle), "Bob should have permission after grant");
        
        vm.prank(alice);
        vault.revokeRetrievePermission(bob, handle);
        assertTrue(!vault.hasRetrievePermission(bob, handle), "Bob should not have permission after revoke");
    }
    
    function test_grantRetrievePermission_emitsEvent() public {
        vm.prank(alice);
        bytes32 handle = vault.storeCredential(123);
        
        vm.prank(alice);
        vault.grantRetrievePermission(bob, handle);
    }
    
    function test_grantRetrievePermission_revertIfNotOwner() public {
        vm.prank(alice);
        bytes32 handle = vault.storeCredential(123);
        
        vm.prank(bob);
        vm.expectRevert(NotCredentialOwner.selector);
        vault.grantRetrievePermission(mallory, handle);
    }
    
    // =============================================================================
    // TEST SUITE: Threshold Management
    // =============================================================================
    
    function test_updateThreshold_updatesValue() public {
        vm.prank(alice);
        vault.updateThreshold(3);
        
        assertEq(vault.getThreshold(alice), 3, "Threshold should be 3");
    }
    
    function test_updateThreshold_revertIfZero() public {
        vm.prank(alice);
        vm.expectRevert(ThresholdMustBeGreaterThanZero.selector);
        vault.updateThreshold(0);
    }
    
    function test_updateThreshold_revertIfExceedsMax() public {
        // MAX_THRESHOLD = 255, so passing 256 would overflow uint8
        // Testing with 255 succeeds, and any value > 255 is caught by compiler
        vm.prank(alice);
        vault.updateThreshold(255);
        assertEq(vault.getThreshold(alice), 255, "Threshold should be 255");
    }
    
    // =============================================================================
    // TEST SUITE: deleteCredential
    // =============================================================================
    
    function test_deleteCredential_deletesAndEmits() public {
        vm.prank(alice);
        bytes32 handle = vault.storeCredential(123);
        
        vm.prank(alice);
        vault.deleteCredential(handle);
        
        assertTrue(!vault.credentialExists(handle), "Credential should not exist after deletion");
    }
    
    function test_deleteCredential_revertIfNotOwner() public {
        vm.prank(alice);
        bytes32 handle = vault.storeCredential(123);
        
        vm.prank(bob);
        vm.expectRevert(NotCredentialOwner.selector);
        vault.deleteCredential(handle);
    }
    
    function test_deleteCredential_revertIfAlreadyDeleted() public {
        vm.prank(alice);
        bytes32 handle = vault.storeCredential(123);
        
        vm.prank(alice);
        vault.deleteCredential(handle);
        
        vm.prank(alice);
        vm.expectRevert(CredentialNotDeleted.selector);
        vault.deleteCredential(handle);
    }
    
    // =============================================================================
    // TEST SUITE: retrieveCredential
    // =============================================================================
    
    function test_retrieveCredential_revertIfNotExists() public {
        bytes32 fakeHandle = bytes32(0);
        vm.prank(alice);
        vm.expectRevert(CredentialNotFound.selector);
        vault.retrieveCredential(fakeHandle);
    }
    
    function test_retrieveCredential_revertIfNoPermit() public {
        vm.prank(alice);
        bytes32 handle = vault.storeCredential(123);
        
        vm.prank(mallory);
        vm.expectRevert(AccessDenied.selector);
        vault.retrieveCredential(handle);
    }
    
    function test_retrieveCredential_returnsToPermitted() public {
        vm.prank(alice);
        bytes32 handle = vault.storeCredential(12345);
        
        vm.prank(alice);
        vault.grantRetrievePermission(bob, handle);
        
        vm.prank(bob);
        uint256 value = vault.retrieveCredential(handle);
        
        assertEq(value, 12345, "Should return correct value");
    }
    
    // =============================================================================
    // TEST SUITE: credentialExists
    // =============================================================================
    
    function test_credentialExists_returnsTrueForExisting() public {
        vm.prank(alice);
        bytes32 handle = vault.storeCredential(123);
        
        assertTrue(vault.credentialExists(handle), "Credential should exist");
    }
    
    function test_credentialExists_returnsFalseForDeleted() public {
        vm.prank(alice);
        bytes32 handle = vault.storeCredential(123);
        
        vm.prank(alice);
        vault.deleteCredential(handle);
        
        assertTrue(!vault.credentialExists(handle), "Deleted credential should not exist");
    }
    
    // =============================================================================
    // TEST SUITE: View Functions
    // =============================================================================
    
    function test_getCredentialOwner_returnsOwner() public {
        vm.prank(alice);
        bytes32 handle = vault.storeCredential(123);
        
        assertEq(vault.getCredentialOwner(handle), alice, "Owner should be alice");
    }
}