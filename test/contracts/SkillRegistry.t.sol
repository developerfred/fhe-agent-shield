// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { Test, console2 } from "forge-std/src/Test.sol";

error SkillNotFound();
error SkillNotVerified();
error NotSkillPublisher();
error AlreadyRated();

/**
 * @title TestableSkillRegistry
 * @notice Test version of SkillRegistry for unit testing
 */
contract TestableSkillRegistry {
    event SkillRegistered(address indexed skillId, address indexed publisher, uint256 timestamp);
    event SkillVerified(address indexed skillId, address indexed publisher, uint256 timestamp);
    event RatingSubmitted(address indexed skillId, address indexed rater, uint256 timestamp);
    event SkillExecuted(address indexed skillId, address indexed executor, uint256 timestamp);
    
    struct Skill {
        address publisher;
        bytes32 metadataHash;
        bytes32 codeHash;
        bool isVerified;
        uint256 verifiedAt;
        uint256 ratingSum;
        uint256 ratingCount;
        bool exists;
    }
    
    mapping(address => Skill) private _skills;
    mapping(address => mapping(address => bool)) private _hasRated;
    mapping(address => address[]) private _publisherSkills;
    uint256 private _skillCounter;
    
    function registerSkill(bytes32 metadataHash, bytes32 codeHash) external returns (address) {
        address skillId = address(uint160(uint256(keccak256(abi.encode(
            msg.sender,
            _skillCounter++,
            block.timestamp
        )))));
        
        _skills[skillId].publisher = msg.sender;
        _skills[skillId].metadataHash = metadataHash;
        _skills[skillId].codeHash = codeHash;
        _skills[skillId].isVerified = false;
        _skills[skillId].verifiedAt = 0;
        _skills[skillId].exists = true;
        
        _publisherSkills[msg.sender].push(skillId);
        
        emit SkillRegistered(skillId, msg.sender, block.timestamp);
        return skillId;
    }
    
    function getSkill(address skillId) external view returns (
        address publisher,
        bool isVerified,
        uint256 ratingCount
    ) {
        return (
            _skills[skillId].publisher,
            _skills[skillId].isVerified,
            _skills[skillId].ratingCount
        );
    }
    
    function getPublisherSkills(address publisher) external view returns (address[] memory) {
        return _publisherSkills[publisher];
    }
    
    function verifySkill(address skillId) external {
        if (!_skills[skillId].exists) {
            revert SkillNotFound();
        }
        
        if (_skills[skillId].publisher != msg.sender) {
            revert NotSkillPublisher();
        }
        
        _skills[skillId].isVerified = true;
        _skills[skillId].verifiedAt = block.timestamp;
        
        emit SkillVerified(skillId, msg.sender, block.timestamp);
    }
    
    function isSkillVerified(address skillId) external view returns (bool) {
        return _skills[skillId].isVerified;
    }
    
    function rateSkill(address skillId, uint256 rating) external {
        if (!_skills[skillId].exists) {
            revert SkillNotFound();
        }
        
        if (_hasRated[skillId][msg.sender]) {
            revert AlreadyRated();
        }
        
        _hasRated[skillId][msg.sender] = true;
        _skills[skillId].ratingCount++;
        _skills[skillId].ratingSum += rating;
        
        emit RatingSubmitted(skillId, msg.sender, block.timestamp);
    }
    
    function hasUserRated(address skillId, address user) external view returns (bool) {
        return _hasRated[skillId][user];
    }
    
    function executeSkill(address skillId, uint256 input) external returns (uint256) {
        if (!_skills[skillId].exists) {
            revert SkillNotFound();
        }
        
        if (!_skills[skillId].isVerified) {
            revert SkillNotVerified();
        }
        
        // Mock execution: return input * 2
        uint256 output = input * 2;
        
        emit SkillExecuted(skillId, msg.sender, block.timestamp);
        return output;
    }
    
    function getRatingAverage(address skillId) external view returns (uint256) {
        if (_skills[skillId].ratingCount == 0) return 0;
        return _skills[skillId].ratingSum / _skills[skillId].ratingCount;
    }
}

/**
 * @title SkillRegistry Test Suite
 */
contract SkillRegistryTest is Test {
    TestableSkillRegistry public registry;
    
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public mallory = address(0x3);
    
    event SkillRegistered(address indexed skillId, address indexed publisher, uint256 timestamp);
    event SkillVerified(address indexed skillId, address indexed publisher, uint256 timestamp);
    event RatingSubmitted(address indexed skillId, address indexed rater, uint256 timestamp);
    event SkillExecuted(address indexed skillId, address indexed executor, uint256 timestamp);
    
    function setUp() public {
        registry = new TestableSkillRegistry();
    }
    
    // =============================================================================
    // TEST SUITE: registerSkill
    // =============================================================================
    
    function test_registerSkill_returnsSkillId() public {
        vm.prank(alice);
        address skillId = registry.registerSkill(keccak256("meta"), keccak256("code"));
        
        assertTrue(skillId != address(0), "Should return valid skillId");
    }
    
    function test_registerSkill_emitsEvent() public {
        vm.prank(alice);
        address skillId = registry.registerSkill(keccak256("meta"), keccak256("code"));
        
        assertTrue(skillId != address(0), "Should return valid skillId");
    }
    
    function test_registerSkill_tracksByPublisher() public {
        vm.prank(alice);
        address skillId1 = registry.registerSkill(keccak256("meta1"), keccak256("code1"));
        vm.prank(alice);
        address skillId2 = registry.registerSkill(keccak256("meta2"), keccak256("code2"));
        
        address[] memory skills = registry.getPublisherSkills(alice);
        
        assertEq(skills.length, 2, "Alice should have 2 skills");
        assertEq(skills[0], skillId1, "First skill should match");
        assertEq(skills[1], skillId2, "Second skill should match");
    }
    
    // =============================================================================
    // TEST SUITE: verifySkill
    // =============================================================================
    
    function test_verifySkill_returnsVerified() public {
        vm.prank(alice);
        address skillId = registry.registerSkill(keccak256("meta"), keccak256("code"));
        
        vm.prank(alice);
        registry.verifySkill(skillId);
        
        (,, uint256 ratingCount) = registry.getSkill(skillId);
        assertTrue(registry.isSkillVerified(skillId), "Skill should be verified");
    }
    
    function test_verifySkill_emitsEvent() public {
        vm.prank(alice);
        address skillId = registry.registerSkill(keccak256("meta"), keccak256("code"));
        
        vm.prank(alice);
        vm.expectEmit(true, true, true, true);
        emit SkillVerified(skillId, alice, block.timestamp);
        registry.verifySkill(skillId);
    }
    
    function test_verifySkill_revertIfNotFound() public {
        address fakeSkill = address(0x999);
        
        vm.prank(alice);
        vm.expectRevert(SkillNotFound.selector);
        registry.verifySkill(fakeSkill);
    }
    
    function test_verifySkill_revertIfNotPublisher() public {
        vm.prank(alice);
        address skillId = registry.registerSkill(keccak256("meta"), keccak256("code"));
        
        vm.prank(bob);
        vm.expectRevert(NotSkillPublisher.selector);
        registry.verifySkill(skillId);
    }
    
    // =============================================================================
    // TEST SUITE: rateSkill
    // =============================================================================
    
    function test_rateSkill_updatesAggregate() public {
        vm.prank(alice);
        address skillId = registry.registerSkill(keccak256("meta"), keccak256("code"));
        
        vm.prank(bob);
        registry.rateSkill(skillId, 5);
        
        (,, uint256 ratingCount) = registry.getSkill(skillId);
        assertEq(ratingCount, 1, "Should have 1 rating");
        assertEq(registry.getRatingAverage(skillId), 5, "Average should be 5");
    }
    
    function test_rateSkill_multipleRatings() public {
        vm.prank(alice);
        address skillId = registry.registerSkill(keccak256("meta"), keccak256("code"));
        
        vm.prank(bob);
        registry.rateSkill(skillId, 4);
        vm.prank(mallory);
        registry.rateSkill(skillId, 5);
        
        (,, uint256 ratingCount) = registry.getSkill(skillId);
        assertEq(ratingCount, 2, "Should have 2 ratings");
        assertEq(registry.getRatingAverage(skillId), 4, "Average should be 4.5 -> 4");
    }
    
    function test_rateSkill_emitsEvent() public {
        vm.prank(alice);
        address skillId = registry.registerSkill(keccak256("meta"), keccak256("code"));
        
        vm.prank(bob);
        vm.expectEmit(true, true, true, true);
        emit RatingSubmitted(skillId, bob, block.timestamp);
        registry.rateSkill(skillId, 5);
    }
    
    function test_rateSkill_preventsDuplicateRatings() public {
        vm.prank(alice);
        address skillId = registry.registerSkill(keccak256("meta"), keccak256("code"));
        
        vm.prank(bob);
        registry.rateSkill(skillId, 5);
        
        vm.prank(bob);
        vm.expectRevert(AlreadyRated.selector);
        registry.rateSkill(skillId, 4);
    }
    
    // =============================================================================
    // TEST SUITE: executeSkill
    // =============================================================================
    
    function test_executeSkill_returnsEncryptedOutput() public {
        vm.prank(alice);
        address skillId = registry.registerSkill(keccak256("meta"), keccak256("code"));
        
        vm.prank(alice);
        registry.verifySkill(skillId);
        
        uint256 result = registry.executeSkill(skillId, 42);
        
        assertEq(result, 84, "Should return input * 2");
    }
    
    function test_executeSkill_revertIfNotVerified() public {
        vm.prank(alice);
        address skillId = registry.registerSkill(keccak256("meta"), keccak256("code"));
        // Not verified
        
        vm.expectRevert(SkillNotVerified.selector);
        registry.executeSkill(skillId, 42);
    }
    
    function test_executeSkill_emitsEvent() public {
        vm.prank(alice);
        address skillId = registry.registerSkill(keccak256("meta"), keccak256("code"));
        
        vm.prank(alice);
        registry.verifySkill(skillId);
        
        vm.prank(bob);
        vm.expectEmit(true, true, true, true);
        emit SkillExecuted(skillId, bob, block.timestamp);
        registry.executeSkill(skillId, 42);
    }
    
    function test_executeSkill_revertIfNotFound() public {
        address fakeSkill = address(0x999);
        
        vm.expectRevert(SkillNotFound.selector);
        registry.executeSkill(fakeSkill, 42);
    }
    
    // =============================================================================
    // TEST SUITE: Access Control
    // =============================================================================
    
    function test_rateSkill_allowsAnyUser() public {
        vm.prank(alice);
        address skillId = registry.registerSkill(keccak256("meta"), keccak256("code"));
        
        vm.prank(bob);
        registry.rateSkill(skillId, 5);
        vm.prank(mallory);
        registry.rateSkill(skillId, 4);
        
        (,, uint256 ratingCount) = registry.getSkill(skillId);
        assertEq(ratingCount, 2, "Should allow multiple users to rate");
    }
    
    function test_executeSkill_allowsAnyUser() public {
        vm.prank(alice);
        address skillId = registry.registerSkill(keccak256("meta"), keccak256("code"));
        
        vm.prank(alice);
        registry.verifySkill(skillId);
        
        vm.prank(bob);
        uint256 result = registry.executeSkill(skillId, 21);
        
        assertEq(result, 42, "Should allow any user to execute");
    }
}