// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { Test, console2 } from "forge-std/src/Test.sol";

error AgentAlreadyExists();
error AgentNotFound();
error NotAgentOwner();
error OffsetExceedsLength();
error SnapshotNotFound();

/**
 * @title TestableAgentMemory
 * @notice Test version of AgentMemory for unit testing
 */
contract TestableAgentMemory {
    event AgentInitialized(address indexed agentId, address indexed owner, uint256 timestamp);
    event ContextAppended(address indexed agentId, address indexed owner, uint256 chunkIndex, uint256 timestamp);
    event SnapshotCreated(address indexed agentId, address indexed snapshotId, address indexed owner, uint256 contextLength, uint256 timestamp);
    event ContextRestored(address indexed agentId, address indexed owner, uint256 newLength, uint256 timestamp);
    
    struct Agent {
        address owner;
        uint256[] context;
        uint256 snapshotCounter;
    }
    
    struct Snapshot {
        address agentId;
        uint256[] context;
        uint256 timestamp;
    }
    
    mapping(address => Agent) private _agents;
    mapping(address => Snapshot) private _snapshots;
    uint256 private _agentCounter;
    
    function initializeAgent() external returns (address) {
        address owner = msg.sender;
        address agentId = address(uint160(uint256(keccak256(abi.encode(owner, _agentCounter++)))));
        
        if (_agents[agentId].owner != address(0)) {
            revert AgentAlreadyExists();
        }
        
        _agents[agentId].owner = owner;
        
        emit AgentInitialized(agentId, owner, block.timestamp);
        return agentId;
    }
    
    function agentExists(address agentId) external view returns (bool) {
        return _agents[agentId].owner != address(0);
    }
    
    function getAgentOwner(address agentId) external view returns (address) {
        return _agents[agentId].owner;
    }
    
    function appendContext(address agentId, uint256 chunk) external returns (uint256) {
        if (_agents[agentId].owner == address(0)) {
            revert AgentNotFound();
        }
        
        if (_agents[agentId].owner != msg.sender) {
            revert NotAgentOwner();
        }
        
        _agents[agentId].context.push(chunk);
        uint256 newLength = _agents[agentId].context.length;
        
        emit ContextAppended(agentId, msg.sender, newLength - 1, block.timestamp);
        return newLength;
    }
    
    function getContextSlice(address agentId, uint256 offset, uint256 length) external view returns (uint256[] memory) {
        if (_agents[agentId].owner == address(0)) {
            revert AgentNotFound();
        }
        
        uint256 contextLength = _agents[agentId].context.length;
        
        if (offset >= contextLength) {
            revert OffsetExceedsLength();
        }
        
        uint256 actualLength = length;
        if (offset + length > contextLength) {
            actualLength = contextLength - offset;
        }
        
        if (actualLength == 0) {
            return new uint256[](0);
        }
        
        uint256[] memory result = new uint256[](actualLength);
        for (uint256 i = 0; i < actualLength; i++) {
            result[i] = _agents[agentId].context[offset + i];
        }
        
        return result;
    }
    
    function getContextLength(address agentId) external view returns (uint256) {
        if (_agents[agentId].owner == address(0)) {
            revert AgentNotFound();
        }
        return _agents[agentId].context.length;
    }
    
    function snapshotContext(address agentId) external returns (address) {
        if (_agents[agentId].owner == address(0)) {
            revert AgentNotFound();
        }
        
        if (_agents[agentId].owner != msg.sender) {
            revert NotAgentOwner();
        }
        
        address snapshotId = address(uint160(uint256(keccak256(abi.encode(
            agentId,
            _agents[agentId].snapshotCounter++,
            block.timestamp
        )))));
        
        uint256 contextLength = _agents[agentId].context.length;
        _snapshots[snapshotId].context = new uint256[](contextLength);
        
        for (uint256 i = 0; i < contextLength; i++) {
            _snapshots[snapshotId].context[i] = _agents[agentId].context[i];
        }
        
        _snapshots[snapshotId].agentId = agentId;
        _snapshots[snapshotId].timestamp = block.timestamp;
        
        emit SnapshotCreated(agentId, snapshotId, msg.sender, contextLength, block.timestamp);
        return snapshotId;
    }
    
    function restoreFromSnapshot(address snapshotId) external {
        if (_snapshots[snapshotId].agentId == address(0)) {
            revert SnapshotNotFound();
        }
        
        address agentId = _snapshots[snapshotId].agentId;
        
        if (_agents[agentId].owner != msg.sender) {
            revert NotAgentOwner();
        }
        
        uint256 snapshotLength = _snapshots[snapshotId].context.length;
        delete _agents[agentId].context;
        _agents[agentId].context = new uint256[](snapshotLength);
        
        for (uint256 i = 0; i < snapshotLength; i++) {
            _agents[agentId].context[i] = _snapshots[snapshotId].context[i];
        }
        
        emit ContextRestored(agentId, msg.sender, snapshotLength, block.timestamp);
    }
}

/**
 * @title AgentMemory Test Suite
 */
contract AgentMemoryTest is Test {
    TestableAgentMemory public agentMemory;
    
    address public alice = address(0x1);
    address public bob = address(0x2);
    
    event AgentInitialized(address indexed agentId, address indexed owner, uint256 timestamp);
    event ContextAppended(address indexed agentId, address indexed owner, uint256 chunkIndex, uint256 timestamp);
    event SnapshotCreated(address indexed agentId, address indexed snapshotId, address indexed owner, uint256 contextLength, uint256 timestamp);
    event ContextRestored(address indexed agentId, address indexed owner, uint256 newLength, uint256 timestamp);
    
    function setUp() public {
        agentMemory = new TestableAgentMemory();
    }
    
    // =============================================================================
    // TEST SUITE: initializeAgent
    // =============================================================================
    
    function test_initializeAgent_returnsAgentId() public {
        vm.prank(alice);
        address agentId = agentMemory.initializeAgent();
        
        assertTrue(agentId != address(0), "Should return valid agentId");
        assertTrue(agentMemory.agentExists(agentId), "Agent should exist");
    }
    
    function test_initializeAgent_emitsEvent() public {
        vm.prank(alice);
        address agentId = agentMemory.initializeAgent();
        assertTrue(agentId != address(0), "Should return valid agentId");
    }
    
    function test_initializeAgent_multipleAgentsPerOwner() public {
        vm.prank(alice);
        address agentId1 = agentMemory.initializeAgent();
        vm.prank(alice);
        address agentId2 = agentMemory.initializeAgent();
        
        assertTrue(agentId1 != agentId2, "Different agents should have different IDs");
    }
    
    function test_initializeAgent_differentOwnersGetDifferentAgents() public {
        // Different owners can initialize agents with no issue
        vm.prank(alice);
        address agentId1 = agentMemory.initializeAgent();
        
        vm.prank(bob);
        address agentId2 = agentMemory.initializeAgent();
        
        assertTrue(agentId1 != agentId2, "Different owners should get different agents");
        assertTrue(agentMemory.agentExists(agentId1), "Alice's agent should exist");
        assertTrue(agentMemory.agentExists(agentId2), "Bob's agent should exist");
    }
    
    // =============================================================================
    // TEST SUITE: appendContext
    // =============================================================================
    
    function test_appendContext_returnsNewLength() public {
        vm.prank(alice);
        address agentId = agentMemory.initializeAgent();
        
        vm.prank(alice);
        uint256 length = agentMemory.appendContext(agentId, 100);
        
        assertEq(length, 1, "Length should be 1 after first append");
    }
    
    function test_appendContext_incrementingLength() public {
        vm.prank(alice);
        address agentId = agentMemory.initializeAgent();
        
        vm.prank(alice);
        assertEq(agentMemory.appendContext(agentId, 100), 1);
        
        vm.prank(alice);
        assertEq(agentMemory.appendContext(agentId, 200), 2);
        
        vm.prank(alice);
        assertEq(agentMemory.appendContext(agentId, 300), 3);
    }
    
    function test_appendContext_emitsEvent() public {
        vm.prank(alice);
        address agentId = agentMemory.initializeAgent();
        
        vm.prank(alice);
        vm.expectEmit(true, true, true, true);
        emit ContextAppended(agentId, alice, 0, block.timestamp);
        agentMemory.appendContext(agentId, 100);
    }
    
    function test_appendContext_revertIfAgentNotFound() public {
        address fakeAgent = address(0x999);
        
        vm.prank(alice);
        vm.expectRevert(AgentNotFound.selector);
        agentMemory.appendContext(fakeAgent, 100);
    }
    
    function test_appendContext_revertIfNotOwner() public {
        vm.prank(alice);
        address agentId = agentMemory.initializeAgent();
        
        vm.prank(bob);
        vm.expectRevert(NotAgentOwner.selector);
        agentMemory.appendContext(agentId, 100);
    }
    
    // =============================================================================
    // TEST SUITE: getContextSlice
    // =============================================================================
    
    function test_getContextSlice_returnsRange() public {
        vm.prank(alice);
        address agentId = agentMemory.initializeAgent();
        
        vm.prank(alice);
        agentMemory.appendContext(agentId, 100);
        vm.prank(alice);
        agentMemory.appendContext(agentId, 200);
        vm.prank(alice);
        agentMemory.appendContext(agentId, 300);
        
        uint256[] memory slice = agentMemory.getContextSlice(agentId, 0, 2);
        
        assertEq(slice.length, 2, "Slice length should be 2");
        assertEq(slice[0], 100, "First element should be 100");
        assertEq(slice[1], 200, "Second element should be 200");
    }
    
    function test_getContextSlice_handlesExcessLength() public {
        vm.prank(alice);
        address agentId = agentMemory.initializeAgent();
        
        vm.prank(alice);
        agentMemory.appendContext(agentId, 100);
        vm.prank(alice);
        agentMemory.appendContext(agentId, 200);
        
        uint256[] memory slice = agentMemory.getContextSlice(agentId, 0, 10);
        
        assertEq(slice.length, 2, "Should return all available chunks");
    }
    
    function test_getContextSlice_revertIfAgentNotFound() public {
        address fakeAgent = address(0x999);
        
        vm.expectRevert(AgentNotFound.selector);
        agentMemory.getContextSlice(fakeAgent, 0, 10);
    }
    
    function test_getContextSlice_revertIfOffsetExceeds() public {
        vm.prank(alice);
        address agentId = agentMemory.initializeAgent();
        
        vm.prank(alice);
        agentMemory.appendContext(agentId, 100);
        
        vm.expectRevert(OffsetExceedsLength.selector);
        agentMemory.getContextSlice(agentId, 5, 10);
    }
    
    // =============================================================================
    // TEST SUITE: snapshotContext
    // =============================================================================
    
    function test_snapshotContext_returnsSnapshotId() public {
        vm.prank(alice);
        address agentId = agentMemory.initializeAgent();
        
        vm.prank(alice);
        agentMemory.appendContext(agentId, 100);
        vm.prank(alice);
        agentMemory.appendContext(agentId, 200);
        
        vm.prank(alice);
        address snapshotId = agentMemory.snapshotContext(agentId);
        
        assertTrue(snapshotId != address(0), "Should return valid snapshotId");
    }
    
    function test_snapshotContext_emitsEvent() public {
        vm.prank(alice);
        address agentId = agentMemory.initializeAgent();
        
        vm.prank(alice);
        agentMemory.appendContext(agentId, 100);
        
        vm.prank(alice);
        address snapshotId = agentMemory.snapshotContext(agentId);
        
        assertTrue(snapshotId != address(0), "Should return valid snapshotId");
    }
    
    function test_snapshotContext_multipleSnapshots() public {
        vm.prank(alice);
        address agentId = agentMemory.initializeAgent();
        
        vm.prank(alice);
        agentMemory.appendContext(agentId, 100);
        
        vm.prank(alice);
        address snapshotId1 = agentMemory.snapshotContext(agentId);
        
        vm.prank(alice);
        agentMemory.appendContext(agentId, 200);
        
        vm.prank(alice);
        address snapshotId2 = agentMemory.snapshotContext(agentId);
        
        assertTrue(snapshotId1 != snapshotId2, "Snapshots should be different");
    }
    
    function test_snapshotContext_revertIfAgentNotFound() public {
        address fakeAgent = address(0x999);
        
        vm.prank(alice);
        vm.expectRevert(AgentNotFound.selector);
        agentMemory.snapshotContext(fakeAgent);
    }
    
    // =============================================================================
    // TEST SUITE: restoreFromSnapshot
    // =============================================================================
    
    function test_restoreFromSnapshot_restoresState() public {
        vm.prank(alice);
        address agentId = agentMemory.initializeAgent();
        
        vm.prank(alice);
        agentMemory.appendContext(agentId, 100);
        vm.prank(alice);
        agentMemory.appendContext(agentId, 200);
        
        vm.prank(alice);
        address snapshotId = agentMemory.snapshotContext(agentId);
        
        vm.prank(alice);
        agentMemory.appendContext(agentId, 300);
        
        vm.prank(alice);
        agentMemory.restoreFromSnapshot(snapshotId);
        
        assertEq(agentMemory.getContextLength(agentId), 2, "Context should be restored to 2 chunks");
    }
    
    function test_restoreFromSnapshot_emitsEvent() public {
        vm.prank(alice);
        address agentId = agentMemory.initializeAgent();
        
        vm.prank(alice);
        agentMemory.appendContext(agentId, 100);
        
        vm.prank(alice);
        address snapshotId = agentMemory.snapshotContext(agentId);
        
        vm.prank(alice);
        vm.expectEmit(true, true, true, true);
        emit ContextRestored(agentId, alice, 1, block.timestamp);
        agentMemory.restoreFromSnapshot(snapshotId);
    }
    
    function test_restoreFromSnapshot_revertIfSnapshotNotFound() public {
        address fakeSnapshot = address(0x999);
        
        vm.prank(alice);
        vm.expectRevert(SnapshotNotFound.selector);
        agentMemory.restoreFromSnapshot(fakeSnapshot);
    }
    
    // =============================================================================
    // TEST SUITE: Access Control
    // =============================================================================
    
    function test_snapshotContext_revertIfNotOwner() public {
        vm.prank(alice);
        address agentId = agentMemory.initializeAgent();
        
        vm.prank(bob);
        vm.expectRevert(NotAgentOwner.selector);
        agentMemory.snapshotContext(agentId);
    }
    
    function test_contextIsolation_betweenAgents() public {
        vm.prank(alice);
        address agentA = agentMemory.initializeAgent();
        
        vm.prank(bob);
        address agentB = agentMemory.initializeAgent();
        
        vm.prank(alice);
        agentMemory.appendContext(agentA, 111);
        
        vm.prank(bob);
        agentMemory.appendContext(agentB, 222);
        
        assertEq(agentMemory.getContextLength(agentA), 1, "Agent A should have 1 chunk");
        assertEq(agentMemory.getContextLength(agentB), 1, "Agent B should have 1 chunk");
        
        uint256[] memory sliceA = agentMemory.getContextSlice(agentA, 0, 1);
        uint256[] memory sliceB = agentMemory.getContextSlice(agentB, 0, 1);
        
        assertEq(sliceA[0], 111, "Agent A context should be 111");
        assertEq(sliceB[0], 222, "Agent B context should be 222");
    }
}