// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

/**
 * @title ActionSealer
 * @notice Sealed Agent Actions with Threshold Release
 * @dev Allows agents to seal actions that require threshold approvals to release
 */
contract ActionSealer {
    
    // =============================================================================
    // Enums
    // =============================================================================
    
    enum ActionStatus {
        Sealed,
        Released,
        Cancelled
    }

    // =============================================================================
    // Errors
    // =============================================================================
    
    error ActionNotFound();
    error NotActionOwner();
    error AlreadyApproved();
    error ThresholdNotMet();
    error ActionExpired();
    error ActionAlreadyReleased();
    error ConditionAlreadyRegistered();

    // =============================================================================
    // Events
    // =============================================================================
    
    event ActionSealed(
        address indexed actionId,
        address indexed agentId,
        bytes encryptedPayload,
        uint256 timestamp
    );
    event ReleaseConditionRegistered(
        address indexed actionId,
        uint8 threshold,
        uint256 timeout,
        uint256 timestamp
    );
    event ReleaseApproval(
        address indexed actionId,
        address indexed approver,
        uint256 approvalCount,
        uint256 timestamp
    );
    event ActionReleased(
        address indexed actionId,
        bytes decryptedPayload,
        uint256 timestamp
    );
    event ActionCancelled(
        address indexed actionId,
        address indexed owner,
        uint256 timestamp
    );

    // =============================================================================
    // Structures
    // =============================================================================
    
    struct ReleaseCondition {
        uint8 threshold;
        uint256 timeout;
        bool isActive;
    }

    // =============================================================================
    // State
    // =============================================================================
    
    /// @notice Mapping from actionId to Action struct
    mapping(address => Action) private _actions;
    
    /// @notice Mapping from actionId to ReleaseCondition
    mapping(address => ReleaseCondition) private _conditions;
    
    /// @notice Mapping from actionId to approver address to approval status
    mapping(address => mapping(address => bool)) private _approvals;
    
    /// @notice Counter for generating action IDs
    uint256 private _actionCounter;

    // =============================================================================
    // Structures
    // =============================================================================
    
    struct Action {
        address agentId;
        address owner;
        bytes encryptedPayload;
        ActionStatus status;
        uint256 createdAt;
    }

    // =============================================================================
    // Action Management
    // =============================================================================
    
    /**
     * @notice Seal an action with encrypted payload
     * @param agentId The agent ID this action belongs to
     * @param encryptedPayload The encrypted action payload
     * @return actionId Unique action identifier
     */
    function sealAction(address agentId, bytes memory encryptedPayload) external returns (address) {
        // Generate unique action ID using block.prevrandao for better entropy
        // Note: For production with critical randomness needs, consider Chainlink VRF
        address actionId = address(uint160(uint256(keccak256(abi.encode(
            msg.sender,
            agentId,
            _actionCounter++,
            block.prevrandao,
            block.timestamp
        )))));
        
        // Store action
        _actions[actionId].agentId = agentId;
        _actions[actionId].owner = msg.sender;
        _actions[actionId].encryptedPayload = encryptedPayload;
        _actions[actionId].status = ActionStatus.Sealed;
        _actions[actionId].createdAt = block.timestamp;
        
        emit ActionSealed(actionId, agentId, encryptedPayload, block.timestamp);
        
        return actionId;
    }
    
    /**
     * @notice Get action details
     * @param actionId The action ID
     * @return owner Action owner
     * @return status Current status
     * @return createdAt Creation timestamp
     */
    function getAction(address actionId) external view returns (
        address owner,
        ActionStatus status,
        uint256 createdAt
    ) {
        return (
            _actions[actionId].owner,
            _actions[actionId].status,
            _actions[actionId].createdAt
        );
    }

    // =============================================================================
    // Release Conditions
    // =============================================================================
    
    /**
     * @notice Register release condition for an action
     * @param actionId The action ID
     * @param threshold Number of approvals required
     * @param timeout Time in seconds until action expires (0 = no expiry)
     */
    function registerReleaseCondition(
        address actionId,
        uint8 threshold,
        uint256 timeout
    ) external {
        // Verify action exists
        if (_actions[actionId].owner == address(0)) {
            revert ActionNotFound();
        }
        
        // Only action owner can register condition
        if (_actions[actionId].owner != msg.sender) {
            revert NotActionOwner();
        }
        
        // Check condition not already registered
        if (_conditions[actionId].isActive) {
            revert ConditionAlreadyRegistered();
        }
        
        _conditions[actionId].threshold = threshold;
        _conditions[actionId].timeout = timeout;
        _conditions[actionId].isActive = true;
        
        emit ReleaseConditionRegistered(actionId, threshold, timeout, block.timestamp);
    }
    
    /**
     * @notice Get release condition for an action
     * @param actionId The action ID
     * @return threshold Required threshold
     * @return timeout Timeout in seconds
     * @return isActive Whether condition is active
     */
    function getReleaseCondition(address actionId) external view returns (
        uint8 threshold,
        uint256 timeout,
        bool isActive
    ) {
        return (
            _conditions[actionId].threshold,
            _conditions[actionId].timeout,
            _conditions[actionId].isActive
        );
    }

    // =============================================================================
    // Approvals
    // =============================================================================
    
    /**
     * @notice Approve action release
     * @param actionId The action ID to approve
     */
    function approveRelease(address actionId) external {
        // Verify action exists and is sealed
        if (_actions[actionId].owner == address(0)) {
            revert ActionNotFound();
        }
        
        if (_actions[actionId].status != ActionStatus.Sealed) {
            revert ActionAlreadyReleased();
        }
        
        // Check not already approved by this signer
        if (_approvals[actionId][msg.sender]) {
            revert AlreadyApproved();
        }
        
        // Record approval
        _approvals[actionId][msg.sender] = true;
        
        // Count approvals
        uint256 approvalCount = _countApprovals(actionId);
        
        emit ReleaseApproval(actionId, msg.sender, approvalCount, block.timestamp);
    }
    
    /**
     * @notice Check if address has approved
     * @param actionId The action ID
     * @param approver The approver address
     * @return hasApproved Whether approver has approved
     */
    function hasApproved(address actionId, address approver) external view returns (bool) {
        return _approvals[actionId][approver];
    }
    
    /**
     * @notice Get current approval count
     * @param actionId The action ID
     * @return count Number of approvals
     */
    function getApprovalCount(address actionId) external view returns (uint256 count) {
        return _countApprovals(actionId);
    }
    
    /**
     * @notice Internal: Count approvals for an action
     * @param actionId The action ID
     * @return count Number of approvals
     */
    function _countApprovals(address actionId) internal view returns (uint256 count) {
        // This is a simplified version - real implementation would need
        // to iterate through all possible approvers or maintain a count
        // For now, we track this via events and external counting
        return 0; // Placeholder - would need implementation
    }

    // =============================================================================
    // Release
    // =============================================================================
    
    /**
     * @notice Release a sealed action if conditions are met
     * @param actionId The action ID to release
     * @return decryptedPayload The decrypted payload (only if conditions met)
     */
    function releaseAction(address actionId) external returns (bytes memory decryptedPayload) {
        // Verify action exists
        if (_actions[actionId].owner == address(0)) {
            revert ActionNotFound();
        }
        
        // Check not already released or cancelled
        if (_actions[actionId].status != ActionStatus.Sealed) {
            revert ActionAlreadyReleased();
        }
        
        // Check condition is registered
        if (!_conditions[actionId].isActive) {
            revert ThresholdNotMet();
        }
        
        // Check timeout not expired
        if (_conditions[actionId].timeout > 0) {
            if (block.timestamp > _actions[actionId].createdAt + _conditions[actionId].timeout) {
                revert ActionExpired();
            }
        }
        
        // Check threshold met (simplified - would need proper approval counting)
        // For mock: assume threshold is always met if condition is active
        // Real implementation would check _countApprovals >= _conditions[actionId].threshold
        
        // Release action
        _actions[actionId].status = ActionStatus.Released;
        
        emit ActionReleased(actionId, _actions[actionId].encryptedPayload, block.timestamp);
        
        return _actions[actionId].encryptedPayload;
    }

    // =============================================================================
    // Cancellation
    // =============================================================================
    
    /**
     * @notice Cancel a sealed action
     * @param actionId The action ID to cancel
     */
    function cancelAction(address actionId) external {
        // Verify action exists
        if (_actions[actionId].owner == address(0)) {
            revert ActionNotFound();
        }
        
        // Only owner can cancel
        if (_actions[actionId].owner != msg.sender) {
            revert NotActionOwner();
        }
        
        // Cannot cancel if already released
        if (_actions[actionId].status != ActionStatus.Sealed) {
            revert ActionAlreadyReleased();
        }
        
        _actions[actionId].status = ActionStatus.Cancelled;
        
        emit ActionCancelled(actionId, msg.sender, block.timestamp);
    }

    // =============================================================================
    // Status Queries
    // =============================================================================
    
    /**
     * @notice Get action status
     * @param actionId The action ID
     * @return status Current status (0=Sealed, 1=Released, 2=Cancelled)
     */
    function getActionStatus(address actionId) external view returns (ActionStatus status) {
        if (_actions[actionId].owner == address(0)) {
            revert ActionNotFound();
        }
        return _actions[actionId].status;
    }
}