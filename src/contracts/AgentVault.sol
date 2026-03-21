// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

import { FHE, euint256, inEuint256, ebool } from "@fhenixprotocol/contracts/FHE.sol";

/**
 * @title AgentVault
 * @notice Encrypted credential storage with FHE
 * @dev Stores credentials encrypted using FHE, accessible via permission checks
 */
contract AgentVault {
    
    // =============================================================================
    // Errors
    // =============================================================================
    
    error CredentialNotFound();
    error AccessDenied();
    error NotCredentialOwner();
    error ThresholdMustBeGreaterThanZero();
    error ThresholdExceedsMaximum();
    error CredentialNotDeleted();

    // =============================================================================
    // Events
    // =============================================================================
    
    event CredentialStored(address indexed agentId, bytes32 indexed handle, uint256 timestamp);
    event CredentialAccessed(address indexed agentId, address indexed accessor, bytes32 indexed handle, uint256 timestamp);
    event CredentialDeleted(address indexed agentId, bytes32 indexed handle, uint256 timestamp);
    event PermissionUpdated(address indexed agentId, address indexed grantee, bytes32 indexed handle);
    event ThresholdUpdated(address indexed agentId, uint8 newThreshold);

    // =============================================================================
    // Constants
    // =============================================================================
    
    uint8 public constant MAX_THRESHOLD = 255;
    
    // =============================================================================
    // State
    // =============================================================================
    
    /// @notice Mapping from handle to encrypted credential value
    mapping(bytes32 => euint256) private _encryptedCredentials;
    
    /// @notice Mapping from handle to owner (agent) address
    mapping(bytes32 => address) private _credentialOwners;
    
    /// @notice Mapping from handle to permitted addresses
    mapping(bytes32 => mapping(address => bool)) private _permissions;
    
    /// @notice Mapping from agent to default threshold for retrieval
    mapping(address => uint8) private _thresholds;
    
    /// @notice Mapping from handle to deletion status
    mapping(bytes32 => bool) private _deleted;
    
    /// @notice Counter for generating unique handles
    uint256 private _credentialCounter;

    // =============================================================================
    // Credential Management
    // =============================================================================
    
    /**
     * @notice Store an encrypted credential
     * @param encryptedValue The encrypted credential value
     * @return handle Unique handle referencing the stored credential
     */
    function storeCredential(inEuint256 calldata encryptedValue) external returns (bytes32) {
        // Convert to euint256 for storage
        euint256 encValue = FHE.asEuint256(encryptedValue);
        
        // Generate unique handle
        bytes32 handle = keccak256(abi.encode(msg.sender, _credentialCounter++));
        
        // Store the encrypted credential
        _encryptedCredentials[handle] = encValue;
        _credentialOwners[handle] = msg.sender;
        
        // Set default threshold if not set
        if (_thresholds[msg.sender] == 0) {
            _thresholds[msg.sender] = 1;
        }
        
        // Grant permission to the owner
        _permissions[handle][msg.sender] = true;
        
        emit CredentialStored(msg.sender, handle, block.timestamp);
        
        return handle;
    }
    
    /**
     * @notice Retrieve an encrypted credential
     * @param handle The credential handle
     * @return encryptedValue The encrypted credential value
     */
    function retrieveCredential(bytes32 handle) external returns (euint256) {
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
    
    /**
     * @notice Delete a credential
     * @param handle The credential handle
     */
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
    
    /**
     * @notice Check if a credential exists
     * @param handle The credential handle
     * @return exists Whether the credential exists and is not deleted
     */
    function credentialExists(bytes32 handle) external view returns (bool) {
        return _credentialOwners[handle] != address(0) && !_deleted[handle];
    }

    // =============================================================================
    // Permission Management
    // =============================================================================
    
    /**
     * @notice Grant retrieve permission to an address
     * @param grantee The address to grant permission to
     * @param handle The credential handle
     */
    function grantRetrievePermission(address grantee, bytes32 handle) external {
        if (_credentialOwners[handle] != msg.sender) {
            revert NotCredentialOwner();
        }
        
        _permissions[handle][grantee] = true;
        
        emit PermissionUpdated(msg.sender, grantee, handle);
    }
    
    /**
     * @notice Revoke retrieve permission from an address
     * @param grantee The address to revoke permission from
     * @param handle The credential handle
     */
    function revokeRetrievePermission(address grantee, bytes32 handle) external {
        if (_credentialOwners[handle] != msg.sender) {
            revert NotCredentialOwner();
        }
        
        _permissions[handle][grantee] = false;
        
        emit PermissionUpdated(msg.sender, grantee, handle);
    }
    
    /**
     * @notice Check if an address has retrieve permission
     * @param grantee The address to check
     * @param handle The credential handle
     * @return hasPermission Whether the address has permission
     */
    function hasRetrievePermission(address grantee, bytes32 handle) external view returns (bool) {
        return _permissions[handle][grantee];
    }

    // =============================================================================
    // Threshold Management
    // =============================================================================
    
    /**
     * @notice Update the threshold for retrieval
     * @param newThreshold The new threshold value
     */
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
    
    /**
     * @notice Get the threshold for an agent
     * @param agent The agent address
     * @return threshold The current threshold
     */
    function getThreshold(address agent) external view returns (uint8) {
        uint8 threshold = _thresholds[agent];
        return threshold > 0 ? threshold : 1;
    }

    // =============================================================================
    // View Functions
    // =============================================================================
    
    /**
     * @notice Get the owner of a credential
     * @param handle The credential handle
     * @return owner The owner address
     */
    function getCredentialOwner(bytes32 handle) external view returns (address) {
        return _credentialOwners[handle];
    }
}
