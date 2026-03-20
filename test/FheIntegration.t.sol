// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { Test, console2 } from "forge-std/src/Test.sol";
import { FheEnabled } from "../util/FheHelper.sol";
import { AgentMemory } from "../src/contracts/AgentMemory.sol";
import { AgentVault } from "../src/contracts/AgentVault.sol";
import { SkillRegistry } from "../src/contracts/SkillRegistry.sol";
import { ActionSealer } from "../src/contracts/ActionSealer.sol";
import { inEuint256, euint256 } from "@fhenixprotocol/contracts/FHE.sol";

/**
 * @title FHE Integration Tests for AgentMemory
 * @notice Tests FHE-encrypted context operations using MockFheOps
 * @dev Uses FheHelper.FheEnabled to mock the FHE precompile at address(128)
 */
contract FheIntegrationTest is Test, FheEnabled {
    AgentMemory public agentMemory;
    AgentVault public agentVault;
    SkillRegistry public skillRegistry;
    ActionSealer public actionSealer;
    address public alice = address(0x1);
    address public agentId;

    function setUp() public {
        initializeFhe();
        
        agentMemory = new AgentMemory();
        agentVault = new AgentVault();
        skillRegistry = new SkillRegistry();
        actionSealer = new ActionSealer();
        
        vm.prank(alice);
        agentId = agentMemory.initializeAgent();
    }

    // =============================================================================
    // TEST SUITE: FHE Context Operations
    // =============================================================================

    function testFhe_AppendEncryptedContext() public {
        vm.prank(alice);
        
        // Create encrypted input using FheHelper
        inEuint256 memory encryptedData = encrypt256(uint256(keccak256("test data")));
        
        // Append context - this should work with MockFheOps
        uint256 newLength = agentMemory.appendContext(agentId, encryptedData);
        
        assertEq(newLength, 1, "Context length should be 1 after first append");
        console2.log("  Appended encrypted context, new length:", newLength);
    }

    function testFhe_MultipleAppends() public {
        inEuint256 memory data1 = encrypt256(100);
        inEuint256 memory data2 = encrypt256(200);
        inEuint256 memory data3 = encrypt256(300);
        
        vm.prank(alice);
        agentMemory.appendContext(agentId, data1);
        
        vm.prank(alice);
        uint256 len2 = agentMemory.appendContext(agentId, data2);
        assertEq(len2, 2);
        
        vm.prank(alice);
        uint256 len3 = agentMemory.appendContext(agentId, data3);
        assertEq(len3, 3);
        
        console2.log("  Multiple encrypted contexts appended successfully");
    }

    function testFhe_GetContextLength() public {
        vm.prank(alice);
        inEuint256 memory data = encrypt256(42);
        agentMemory.appendContext(agentId, data);
        
        uint256 length = agentMemory.getContextLength(agentId);
        assertEq(length, 1, "Context should have 1 entry");
        
        console2.log("  Context length verified:", length);
    }

    function testFhe_ContextIsolation() public {
        address bob = address(0x2);
        
        // Bob initializes his own agent
        vm.prank(bob);
        address bobAgentId = agentMemory.initializeAgent();
        
        // Alice appends to her agent
        vm.prank(alice);
        inEuint256 memory aliceData = encrypt256(111);
        agentMemory.appendContext(agentId, aliceData);
        
        // Bob appends to his agent
        vm.prank(bob);
        inEuint256 memory bobData = encrypt256(222);
        agentMemory.appendContext(bobAgentId, bobData);
        
        // Verify isolation
        uint256 aliceLength = agentMemory.getContextLength(agentId);
        uint256 bobLength = agentMemory.getContextLength(bobAgentId);
        
        assertEq(aliceLength, 1, "Alice should have 1 context entry");
        assertEq(bobLength, 1, "Bob should have 1 context entry");
        
        console2.log("  Context isolation verified: Alice=", aliceLength, ", Bob=", bobLength);
    }

    function testFhe_RevertIfNotOwner() public {
        address bob = address(0x2);
        
        vm.prank(alice);
        inEuint256 memory data = encrypt256(42);
        agentMemory.appendContext(agentId, data);
        
        // Bob tries to append to Alice's agent - should fail
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSignature("NotAgentOwner()"));
        agentMemory.appendContext(agentId, data);
        
        console2.log("  Owner check working correctly");
    }

    function testFhe_RevertIfAgentNotFound() public {
        address fakeAgent = address(0x999);
        
        vm.prank(alice);
        inEuint256 memory data = encrypt256(42);
        
        vm.expectRevert(abi.encodeWithSignature("AgentNotFound()"));
        agentMemory.appendContext(fakeAgent, data);
        
        console2.log("  Agent existence check working correctly");
    }

    // =============================================================================
    // TEST SUITE: Snapshot Operations
    // =============================================================================

    function testFhe_CreateSnapshot() public {
        inEuint256 memory data1 = encrypt256(100);
        inEuint256 memory data2 = encrypt256(200);
        
        vm.prank(alice);
        agentMemory.appendContext(agentId, data1);
        
        vm.prank(alice);
        agentMemory.appendContext(agentId, data2);
        
        vm.prank(alice);
        address snapshotId = agentMemory.snapshotContext(agentId);
        
        assertTrue(snapshotId != address(0), "Snapshot ID should be valid");
        console2.log("  Snapshot created:", snapshotId);
    }

    function testFhe_RestoreFromSnapshot() public {
        inEuint256 memory data1 = encrypt256(100);
        inEuint256 memory data2 = encrypt256(200);
        
        vm.prank(alice);
        agentMemory.appendContext(agentId, data1);
        
        vm.prank(alice);
        agentMemory.appendContext(agentId, data2);
        
        uint256 lengthBefore = agentMemory.getContextLength(agentId);
        assertEq(lengthBefore, 2);
        
        vm.prank(alice);
        address snapshotId = agentMemory.snapshotContext(agentId);
        
        inEuint256 memory data3 = encrypt256(300);
        vm.prank(alice);
        agentMemory.appendContext(agentId, data3);
        
        uint256 lengthAfter = agentMemory.getContextLength(agentId);
        assertEq(lengthAfter, 3);
        
        vm.prank(alice);
        agentMemory.restoreFromSnapshot(snapshotId);
        
        uint256 lengthRestored = agentMemory.getContextLength(agentId);
        assertEq(lengthRestored, 2, "Context should be restored to 2 entries");
        
        console2.log("Snapshot restore: before=", lengthBefore, " after=", lengthAfter);
    }

    // =============================================================================
    // TEST SUITE: Computations on Encrypted Data
    // =============================================================================

    function testFhe_ComputeOnContext() public {
        vm.prank(alice);
        
        inEuint256 memory data = encrypt256(100);
        agentMemory.appendContext(agentId, data);
        
        console2.log("  Compute operation placeholder - mock implementation");
    }

    // =============================================================================
    // TEST SUITE: AgentVault FHE Credential Storage
    // =============================================================================

    function testFhe_StoreCredential() public {
        inEuint256 memory credential = encrypt256(uint256(keccak256("secret_api_key")));
        
        vm.prank(alice);
        bytes32 handle = agentVault.storeCredential(credential);
        
        assertTrue(handle != bytes32(0), "Handle should be valid");
        console2.log("  Credential stored with handle:", uint256(handle));
    }

    function testFhe_RetrieveCredential() public {
        inEuint256 memory credential = encrypt256(uint256(keccak256("secret_api_key")));
        
        vm.prank(alice);
        bytes32 handle = agentVault.storeCredential(credential);
        
        vm.prank(alice);
        euint256 retrieved = agentVault.retrieveCredential(handle);
        
        assertTrue(euint256.unwrap(retrieved) != 0, "Retrieved credential should not be zero");
        console2.log("  Credential retrieved successfully");
    }

    function testFhe_CredentialAccessControl() public {
        address bob = address(0x2);
        
        inEuint256 memory credential = encrypt256(12345);
        
        vm.prank(alice);
        bytes32 handle = agentVault.storeCredential(credential);
        
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSignature("AccessDenied()"));
        agentVault.retrieveCredential(handle);
        
        console2.log("  Access control working correctly");
    }

    function testFhe_DeleteCredential() public {
        inEuint256 memory credential = encrypt256(99999);
        
        vm.prank(alice);
        bytes32 handle = agentVault.storeCredential(credential);
        
        vm.prank(alice);
        agentVault.deleteCredential(handle);
        
        bool exists = agentVault.credentialExists(handle);
        assertTrue(!exists, "Credential should be deleted");
        console2.log("  Credential deleted successfully");
    }

    // =============================================================================
    // TEST SUITE: SkillRegistry FHE Operations
    // =============================================================================

    function testFhe_RateSkill() public {
        bytes32 metadataHash = keccak256("ipfs://QmSkillMetadata");
        bytes32 codeHash = keccak256("ipfs://QmSkillCode");
        
        vm.prank(alice);
        address skillId = skillRegistry.registerSkill(metadataHash, codeHash);
        
        vm.prank(alice);
        skillRegistry.verifySkill(skillId);
        
        inEuint256 memory rating = encrypt256(5);
        vm.prank(address(0x3));
        skillRegistry.rateSkill(skillId, rating);
        
        bool hasRated = skillRegistry.hasUserRated(skillId, address(0x3));
        assertTrue(hasRated, "User should have rated");
        
        console2.log("  Skill rated successfully");
    }

    function testFhe_ExecuteSkill() public {
        bytes32 metadataHash = keccak256("ipfs://QmSkillMetadata");
        bytes32 codeHash = keccak256("ipfs://QmSkillCode");
        
        vm.prank(alice);
        address skillId = skillRegistry.registerSkill(metadataHash, codeHash);
        
        vm.prank(alice);
        skillRegistry.verifySkill(skillId);
        
        inEuint256 memory input = encrypt256(42);
        vm.prank(address(0x4));
        euint256 output = skillRegistry.executeSkill(skillId, input);
        
        assertTrue(euint256.unwrap(output) == 42, "Output should equal input (mock)");
        console2.log("  Skill executed successfully, output:", euint256.unwrap(output));
    }

    function testFhe_ExecuteSkillRevertIfNotVerified() public {
        bytes32 metadataHash = keccak256("ipfs://QmUnverifiedSkill");
        bytes32 codeHash = keccak256("ipfs://QmUnverifiedCode");
        
        vm.prank(alice);
        address skillId = skillRegistry.registerSkill(metadataHash, codeHash);
        
        inEuint256 memory input = encrypt256(100);
        vm.prank(address(0x5));
        vm.expectRevert(abi.encodeWithSignature("SkillNotVerified()"));
        skillRegistry.executeSkill(skillId, input);
        
        console2.log("  Unverified skill execution blocked correctly");
    }

    function testFhe_CannotRateSameSkillTwice() public {
        bytes32 metadataHash = keccak256("ipfs://QmRatingTestSkill");
        bytes32 codeHash = keccak256("ipfs://QmRatingTestCode");
        
        vm.prank(alice);
        address skillId = skillRegistry.registerSkill(metadataHash, codeHash);
        
        vm.prank(alice);
        skillRegistry.verifySkill(skillId);
        
        inEuint256 memory rating1 = encrypt256(4);
        vm.prank(address(0x6));
        skillRegistry.rateSkill(skillId, rating1);
        
        inEuint256 memory rating2 = encrypt256(5);
        vm.prank(address(0x6));
        vm.expectRevert(abi.encodeWithSignature("AlreadyRated()"));
        skillRegistry.rateSkill(skillId, rating2);
        
        console2.log("  Duplicate rating blocked correctly");
    }

    // =============================================================================
    // TEST SUITE: ActionSealer FHE-Aware Operations
    // =============================================================================

    function testFhe_SealAction() public {
        bytes memory encryptedPayload = abi.encode(encrypt256(100));
        
        vm.prank(alice);
        address actionId = actionSealer.sealAction(agentId, encryptedPayload);
        
        assertTrue(actionId != address(0), "Action ID should be valid");
        console2.log("  Action sealed with ID:", actionId);
    }

    function testFhe_RegisterReleaseCondition() public {
        bytes memory encryptedPayload = abi.encode(encrypt256(200));
        
        vm.prank(alice);
        address actionId = actionSealer.sealAction(agentId, encryptedPayload);
        
        vm.prank(alice);
        actionSealer.registerReleaseCondition(actionId, 3, 3600);
        
        (uint8 threshold, uint256 timeout, bool isActive) = actionSealer.getReleaseCondition(actionId);
        
        assertEq(threshold, 3, "Threshold should be 3");
        assertEq(timeout, 3600, "Timeout should be 3600");
        assertTrue(isActive, "Condition should be active");
        
        console2.log("  Release condition registered: threshold=", threshold, ", timeout=", timeout);
    }

    function testFhe_ApproveRelease() public {
        bytes memory encryptedPayload = abi.encode(encrypt256(300));
        
        vm.prank(alice);
        address actionId = actionSealer.sealAction(agentId, encryptedPayload);
        
        vm.prank(alice);
        actionSealer.registerReleaseCondition(actionId, 2, 3600);
        
        address approver1 = address(0x10);
        address approver2 = address(0x11);
        
        vm.prank(approver1);
        actionSealer.approveRelease(actionId);
        
        bool hasApproved1 = actionSealer.hasApproved(actionId, approver1);
        assertTrue(hasApproved1, "Approver1 should have approved");
        
        vm.prank(approver2);
        actionSealer.approveRelease(actionId);
        
        bool hasApproved2 = actionSealer.hasApproved(actionId, approver2);
        assertTrue(hasApproved2, "Approver2 should have approved");
        
        console2.log("  Multiple approvals recorded successfully");
    }

    function testFhe_ReleaseAction() public {
        bytes memory encryptedPayload = abi.encode(encrypt256(400));
        
        vm.prank(alice);
        address actionId = actionSealer.sealAction(agentId, encryptedPayload);
        
        vm.prank(alice);
        actionSealer.registerReleaseCondition(actionId, 1, 3600);
        
        vm.prank(address(0x20));
        actionSealer.approveRelease(actionId);
        
        ActionSealer.ActionStatus statusBefore = actionSealer.getActionStatus(actionId);
        assertEq(uint8(statusBefore), 0, "Status should be Sealed");
        
        vm.prank(alice);
        bytes memory decrypted = actionSealer.releaseAction(actionId);
        
        ActionSealer.ActionStatus statusAfter = actionSealer.getActionStatus(actionId);
        assertEq(uint8(statusAfter), 1, "Status should be Released");
        
        assertTrue(decrypted.length > 0, "Decrypted payload should exist");
        console2.log("  Action released successfully");
    }

    function testFhe_CancelAction() public {
        bytes memory encryptedPayload = abi.encode(encrypt256(500));
        
        vm.prank(alice);
        address actionId = actionSealer.sealAction(agentId, encryptedPayload);
        
        vm.prank(alice);
        actionSealer.cancelAction(actionId);
        
        ActionSealer.ActionStatus status = actionSealer.getActionStatus(actionId);
        assertEq(uint8(status), 2, "Status should be Cancelled");
        
        console2.log("  Action cancelled successfully");
    }

    function testFhe_ActionRevertIfNotOwner() public {
        bytes memory encryptedPayload = abi.encode(encrypt256(600));
        
        vm.prank(alice);
        address actionId = actionSealer.sealAction(agentId, encryptedPayload);
        
        // Bob tries to register condition - should fail
        address bob = address(0x2);
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSignature("NotActionOwner()"));
        actionSealer.registerReleaseCondition(actionId, 3, 3600);
        
        console2.log("  Non-owner blocked from registering condition");
    }

    function testFhe_RevertIfConditionAlreadyRegistered() public {
        bytes memory encryptedPayload = abi.encode(encrypt256(700));
        
        vm.prank(alice);
        address actionId = actionSealer.sealAction(agentId, encryptedPayload);
        
        vm.prank(alice);
        actionSealer.registerReleaseCondition(actionId, 2, 3600);
        
        // Try to register again
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSignature("ConditionAlreadyRegistered()"));
        actionSealer.registerReleaseCondition(actionId, 3, 7200);
        
        console2.log("  Duplicate condition registration blocked");
    }

    function testFhe_RevertIfAlreadyApproved() public {
        bytes memory encryptedPayload = abi.encode(encrypt256(800));
        
        vm.prank(alice);
        address actionId = actionSealer.sealAction(agentId, encryptedPayload);
        
        vm.prank(alice);
        actionSealer.registerReleaseCondition(actionId, 3, 3600);
        
        address approver = address(0x30);
        
        vm.prank(approver);
        actionSealer.approveRelease(actionId);
        
        // Try to approve again
        vm.prank(approver);
        vm.expectRevert(abi.encodeWithSignature("AlreadyApproved()"));
        actionSealer.approveRelease(actionId);
        
        console2.log("  Duplicate approval blocked");
    }

    function testFhe_RevertIfActionNotFound() public {
        address fakeActionId = address(0x999);
        
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSignature("ActionNotFound()"));
        actionSealer.registerReleaseCondition(fakeActionId, 3, 3600);
        
        console2.log("  Non-existent action check working");
    }

    function testFhe_GetActionDetails() public {
        bytes memory encryptedPayload = abi.encode(encrypt256(900));
        
        vm.prank(alice);
        address actionId = actionSealer.sealAction(agentId, encryptedPayload);
        
        (address owner, ActionSealer.ActionStatus status, uint256 createdAt) = actionSealer.getAction(actionId);
        
        assertEq(owner, alice, "Owner should be alice");
        assertEq(uint8(status), 0, "Status should be Sealed");
        assertTrue(createdAt > 0, "CreatedAt should be set");
        
        console2.log("  Action details retrieved: owner=", owner, ", status=", uint8(status));
    }
}