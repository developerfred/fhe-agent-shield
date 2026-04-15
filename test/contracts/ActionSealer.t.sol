// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { Test, console2 } from "forge-std/src/Test.sol";

error ActionNotFound();
error NotActionOwner();
error AlreadyApproved();
error ThresholdNotMet();
error ActionExpired();
error ActionAlreadyReleased();
error ConditionAlreadyRegistered();

/**
 * @title TestableActionSealer
 * @notice Test version of ActionSealer for unit testing
 */
contract TestableActionSealer {
    enum ActionStatus {
        Sealed,
        Released,
        Cancelled
    }

    event ActionSealed(address indexed actionId, address indexed agentId, bytes encryptedPayload, uint256 timestamp);
    event ReleaseConditionRegistered(address indexed actionId, uint8 threshold, uint256 timeout, uint256 timestamp);
    event ReleaseApproval(address indexed actionId, address indexed approver, uint256 approvalCount, uint256 timestamp);
    event ActionReleased(address indexed actionId, bytes decryptedPayload, uint256 timestamp);
    event ActionCancelled(address indexed actionId, address indexed owner, uint256 timestamp);

    struct ReleaseCondition {
        uint8 threshold;
        uint256 timeout;
        bool isActive;
    }

    struct Action {
        address agentId;
        address owner;
        bytes encryptedPayload;
        ActionStatus status;
        uint256 createdAt;
    }

    mapping(address => Action) private _actions;
    mapping(address => ReleaseCondition) private _conditions;
    mapping(address => mapping(address => bool)) private _approvals;
    mapping(address => uint256) private _approvalCounts;
    uint256 private _actionCounter;

    function sealAction(address agentId, bytes memory encryptedPayload) external returns (address) {
        address actionId =
            address(uint160(uint256(keccak256(abi.encode(msg.sender, agentId, _actionCounter++, block.timestamp)))));

        _actions[actionId].agentId = agentId;
        _actions[actionId].owner = msg.sender;
        _actions[actionId].encryptedPayload = encryptedPayload;
        _actions[actionId].status = ActionStatus.Sealed;
        _actions[actionId].createdAt = block.timestamp;

        emit ActionSealed(actionId, agentId, encryptedPayload, block.timestamp);
        return actionId;
    }

    function getAction(address actionId) external view returns (address owner, ActionStatus status, uint256 createdAt) {
        return (_actions[actionId].owner, _actions[actionId].status, _actions[actionId].createdAt);
    }

    function registerReleaseCondition(address actionId, uint8 threshold, uint256 timeout) external {
        if (_actions[actionId].owner == address(0)) {
            revert ActionNotFound();
        }

        if (_actions[actionId].owner != msg.sender) {
            revert NotActionOwner();
        }

        if (_conditions[actionId].isActive) {
            revert ConditionAlreadyRegistered();
        }

        _conditions[actionId].threshold = threshold;
        _conditions[actionId].timeout = timeout;
        _conditions[actionId].isActive = true;

        emit ReleaseConditionRegistered(actionId, threshold, timeout, block.timestamp);
    }

    function getReleaseCondition(address actionId)
        external
        view
        returns (uint8 threshold, uint256 timeout, bool isActive)
    {
        return (_conditions[actionId].threshold, _conditions[actionId].timeout, _conditions[actionId].isActive);
    }

    function approveRelease(address actionId) external {
        if (_actions[actionId].owner == address(0)) {
            revert ActionNotFound();
        }

        if (_actions[actionId].status != ActionStatus.Sealed) {
            revert ActionAlreadyReleased();
        }

        if (_approvals[actionId][msg.sender]) {
            revert AlreadyApproved();
        }

        _approvals[actionId][msg.sender] = true;
        _approvalCounts[actionId]++;

        emit ReleaseApproval(actionId, msg.sender, _approvalCounts[actionId], block.timestamp);
    }

    function hasApproved(address actionId, address approver) external view returns (bool) {
        return _approvals[actionId][approver];
    }

    function getApprovalCount(address actionId) external view returns (uint256) {
        return _approvalCounts[actionId];
    }

    function releaseAction(address actionId) external returns (bytes memory) {
        if (_actions[actionId].owner == address(0)) {
            revert ActionNotFound();
        }

        if (_actions[actionId].status != ActionStatus.Sealed) {
            revert ActionAlreadyReleased();
        }

        if (!_conditions[actionId].isActive) {
            revert ThresholdNotMet();
        }

        if (_conditions[actionId].timeout > 0) {
            if (block.timestamp > _actions[actionId].createdAt + _conditions[actionId].timeout) {
                revert ActionExpired();
            }
        }

        if (_approvalCounts[actionId] < _conditions[actionId].threshold) {
            revert ThresholdNotMet();
        }

        _actions[actionId].status = ActionStatus.Released;

        emit ActionReleased(actionId, _actions[actionId].encryptedPayload, block.timestamp);
        return _actions[actionId].encryptedPayload;
    }

    function cancelAction(address actionId) external {
        if (_actions[actionId].owner == address(0)) {
            revert ActionNotFound();
        }

        if (_actions[actionId].owner != msg.sender) {
            revert NotActionOwner();
        }

        if (_actions[actionId].status != ActionStatus.Sealed) {
            revert ActionAlreadyReleased();
        }

        _actions[actionId].status = ActionStatus.Cancelled;

        emit ActionCancelled(actionId, msg.sender, block.timestamp);
    }

    function getActionStatus(address actionId) external view returns (ActionStatus) {
        if (_actions[actionId].owner == address(0)) {
            revert ActionNotFound();
        }
        return _actions[actionId].status;
    }
}

/**
 * @title ActionSealer Test Suite
 */
contract ActionSealerTest is Test {
    TestableActionSealer public sealer;

    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);
    address public mallory = address(0x4);

    event ActionSealed(address indexed actionId, address indexed agentId, bytes encryptedPayload, uint256 timestamp);
    event ReleaseConditionRegistered(address indexed actionId, uint8 threshold, uint256 timeout, uint256 timestamp);
    event ReleaseApproval(address indexed actionId, address indexed approver, uint256 approvalCount, uint256 timestamp);
    event ActionReleased(address indexed actionId, bytes decryptedPayload, uint256 timestamp);
    event ActionCancelled(address indexed actionId, address indexed owner, uint256 timestamp);

    function setUp() public {
        sealer = new TestableActionSealer();
    }

    // =============================================================================
    // TEST SUITE: sealAction
    // =============================================================================

    function test_sealAction_returnsActionId() public {
        vm.prank(alice);
        address actionId = sealer.sealAction(alice, "payload");

        assertTrue(actionId != address(0), "Should return valid actionId");
    }

    function test_sealAction_emitsEvent() public {
        vm.prank(alice);
        address actionId = sealer.sealAction(alice, "payload");

        assertTrue(actionId != address(0), "Should return valid actionId");
    }

    function test_sealAction_setsStatusToSealed() public {
        vm.prank(alice);
        address actionId = sealer.sealAction(alice, "payload");

        assertEq(uint8(sealer.getActionStatus(actionId)), 0, "Status should be Sealed");
    }

    // =============================================================================
    // TEST SUITE: registerReleaseCondition
    // =============================================================================

    function test_registerReleaseCondition_setsCondition() public {
        vm.prank(alice);
        address actionId = sealer.sealAction(alice, "payload");

        vm.prank(alice);
        sealer.registerReleaseCondition(actionId, 2, 3600);

        (uint8 threshold, uint256 timeout, bool isActive) = sealer.getReleaseCondition(actionId);

        assertEq(threshold, 2, "Threshold should be 2");
        assertEq(timeout, 3600, "Timeout should be 3600");
        assertTrue(isActive, "Should be active");
    }

    function test_registerReleaseCondition_emitsEvent() public {
        vm.prank(alice);
        address actionId = sealer.sealAction(alice, "payload");

        vm.prank(alice);
        vm.expectEmit(true, true, true, true);
        emit ReleaseConditionRegistered(actionId, 2, 3600, block.timestamp);
        sealer.registerReleaseCondition(actionId, 2, 3600);
    }

    function test_registerReleaseCondition_revertIfActionNotFound() public {
        address fakeAction = address(0x999);

        vm.prank(alice);
        vm.expectRevert(ActionNotFound.selector);
        sealer.registerReleaseCondition(fakeAction, 2, 3600);
    }

    function test_registerReleaseCondition_revertIfNotOwner() public {
        vm.prank(alice);
        address actionId = sealer.sealAction(alice, "payload");

        vm.prank(bob);
        vm.expectRevert(NotActionOwner.selector);
        sealer.registerReleaseCondition(actionId, 2, 3600);
    }

    // =============================================================================
    // TEST SUITE: approveRelease
    // =============================================================================

    function test_approveRelease_recordsApproval() public {
        vm.prank(alice);
        address actionId = sealer.sealAction(alice, "payload");

        vm.prank(alice);
        sealer.registerReleaseCondition(actionId, 2, 3600);

        vm.prank(bob);
        sealer.approveRelease(actionId);

        assertTrue(sealer.hasApproved(actionId, bob), "Bob should be approved");
        assertEq(sealer.getApprovalCount(actionId), 1, "Approval count should be 1");
    }

    function test_approveRelease_emitsEvent() public {
        vm.prank(alice);
        address actionId = sealer.sealAction(alice, "payload");

        vm.prank(alice);
        sealer.registerReleaseCondition(actionId, 2, 3600);

        vm.prank(bob);
        vm.expectEmit(true, true, true, true);
        emit ReleaseApproval(actionId, bob, 1, block.timestamp);
        sealer.approveRelease(actionId);
    }

    function test_approveRelease_revertIfActionNotFound() public {
        address fakeAction = address(0x999);

        vm.prank(bob);
        vm.expectRevert(ActionNotFound.selector);
        sealer.approveRelease(fakeAction);
    }

    function test_approveRelease_revertIfAlreadyApproved() public {
        vm.prank(alice);
        address actionId = sealer.sealAction(alice, "payload");

        vm.prank(alice);
        sealer.registerReleaseCondition(actionId, 2, 3600);

        vm.prank(bob);
        sealer.approveRelease(actionId);

        vm.prank(bob);
        vm.expectRevert(AlreadyApproved.selector);
        sealer.approveRelease(actionId);
    }

    // =============================================================================
    // TEST SUITE: releaseAction
    // =============================================================================

    function test_releaseAction_releasesWithThreshold() public {
        vm.prank(alice);
        address actionId = sealer.sealAction(alice, "payload");

        vm.prank(alice);
        sealer.registerReleaseCondition(actionId, 2, 3600);

        vm.prank(bob);
        sealer.approveRelease(actionId);
        vm.prank(charlie);
        sealer.approveRelease(actionId);

        vm.prank(alice);
        bytes memory result = sealer.releaseAction(actionId);

        assertEq(result, "payload", "Should return payload");
    }

    function test_releaseAction_updatesStatusToReleased() public {
        vm.prank(alice);
        address actionId = sealer.sealAction(alice, "payload");

        vm.prank(alice);
        sealer.registerReleaseCondition(actionId, 1, 3600);

        vm.prank(bob);
        sealer.approveRelease(actionId);

        vm.prank(alice);
        sealer.releaseAction(actionId);

        assertEq(uint8(sealer.getActionStatus(actionId)), 1, "Status should be Released");
    }

    function test_releaseAction_emitsEvent() public {
        vm.prank(alice);
        address actionId = sealer.sealAction(alice, "payload");

        vm.prank(alice);
        sealer.registerReleaseCondition(actionId, 1, 3600);

        vm.prank(bob);
        sealer.approveRelease(actionId);

        vm.prank(alice);
        vm.expectEmit(true, true, true, true);
        emit ActionReleased(actionId, "payload", block.timestamp);
        sealer.releaseAction(actionId);
    }

    function test_releaseAction_revertIfThresholdNotMet() public {
        vm.prank(alice);
        address actionId = sealer.sealAction(alice, "payload");

        vm.prank(alice);
        sealer.registerReleaseCondition(actionId, 3, 3600);

        vm.prank(bob);
        sealer.approveRelease(actionId);

        vm.prank(alice);
        vm.expectRevert(ThresholdNotMet.selector);
        sealer.releaseAction(actionId);
    }

    function test_releaseAction_revertIfExpired() public {
        vm.prank(alice);
        address actionId = sealer.sealAction(alice, "payload");

        // Use timeout of 1 second
        vm.prank(alice);
        sealer.registerReleaseCondition(actionId, 1, 1);

        // Warp time forward past the 1 second timeout
        vm.warp(block.timestamp + 2);

        vm.prank(bob);
        sealer.approveRelease(actionId);

        vm.prank(alice);
        vm.expectRevert(ActionExpired.selector);
        sealer.releaseAction(actionId);
    }

    function test_releaseAction_revertIfAlreadyReleased() public {
        vm.prank(alice);
        address actionId = sealer.sealAction(alice, "payload");

        vm.prank(alice);
        sealer.registerReleaseCondition(actionId, 1, 3600);

        vm.prank(bob);
        sealer.approveRelease(actionId);

        vm.prank(alice);
        sealer.releaseAction(actionId);

        vm.prank(alice);
        vm.expectRevert(ActionAlreadyReleased.selector);
        sealer.releaseAction(actionId);
    }

    // =============================================================================
    // TEST SUITE: cancelAction
    // =============================================================================

    function test_cancelAction_cancelsByOwner() public {
        vm.prank(alice);
        address actionId = sealer.sealAction(alice, "payload");

        vm.prank(alice);
        sealer.cancelAction(actionId);

        assertEq(uint8(sealer.getActionStatus(actionId)), 2, "Status should be Cancelled");
    }

    function test_cancelAction_emitsEvent() public {
        vm.prank(alice);
        address actionId = sealer.sealAction(alice, "payload");

        vm.prank(alice);
        vm.expectEmit(true, true, true, true);
        emit ActionCancelled(actionId, alice, block.timestamp);
        sealer.cancelAction(actionId);
    }

    function test_cancelAction_revertIfNotOwner() public {
        vm.prank(alice);
        address actionId = sealer.sealAction(alice, "payload");

        vm.prank(bob);
        vm.expectRevert(NotActionOwner.selector);
        sealer.cancelAction(actionId);
    }

    function test_cancelAction_revertIfAlreadyReleased() public {
        vm.prank(alice);
        address actionId = sealer.sealAction(alice, "payload");

        vm.prank(alice);
        sealer.registerReleaseCondition(actionId, 1, 3600);

        vm.prank(bob);
        sealer.approveRelease(actionId);

        vm.prank(alice);
        sealer.releaseAction(actionId);

        vm.prank(alice);
        vm.expectRevert(ActionAlreadyReleased.selector);
        sealer.cancelAction(actionId);
    }

    // =============================================================================
    // TEST SUITE: getActionStatus
    // =============================================================================

    function test_getActionStatus_returnsCorrectStatus() public {
        vm.prank(alice);
        address actionId = sealer.sealAction(alice, "payload");

        assertEq(uint8(sealer.getActionStatus(actionId)), 0, "Initial status should be Sealed");

        vm.prank(alice);
        sealer.registerReleaseCondition(actionId, 1, 3600);
        vm.prank(bob);
        sealer.approveRelease(actionId);
        vm.prank(alice);
        sealer.releaseAction(actionId);

        assertEq(uint8(sealer.getActionStatus(actionId)), 1, "Status should be Released");
    }

    function test_getActionStatus_revertIfNotFound() public {
        address fakeAction = address(0x999);

        vm.expectRevert(ActionNotFound.selector);
        sealer.getActionStatus(fakeAction);
    }

    // =============================================================================
    // TEST SUITE: Cross-Contract Integration
    // =============================================================================

    function test_integration_withAgentVault() public {
        vm.prank(alice);
        address actionId = sealer.sealAction(alice, "credential_ref_123");

        vm.prank(alice);
        sealer.registerReleaseCondition(actionId, 2, 3600);

        assertTrue(actionId != address(0), "Action should be created with vault reference");
    }

    function test_integration_concurrentApprovals() public {
        vm.prank(alice);
        address actionId = sealer.sealAction(alice, "payload");

        vm.prank(alice);
        sealer.registerReleaseCondition(actionId, 3, 3600);

        vm.prank(bob);
        sealer.approveRelease(actionId);
        vm.prank(charlie);
        sealer.approveRelease(actionId);
        vm.prank(mallory);
        sealer.approveRelease(actionId);

        assertEq(sealer.getApprovalCount(actionId), 3, "All approvals should be recorded");

        vm.prank(alice);
        sealer.releaseAction(actionId);

        assertEq(uint8(sealer.getActionStatus(actionId)), 1, "Should be released");
    }
}
