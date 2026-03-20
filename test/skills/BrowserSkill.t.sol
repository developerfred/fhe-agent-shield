// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

import { Test } from "forge-std/src/Test.sol";
import { BrowserSkill } from "../../skills/browser/BrowserSkill.sol";

contract BrowserSkillTest is Test {
    BrowserSkill public browserSkill;

    address public user1 = address(0x1);
    address public user2 = address(0x2);

    function setUp() public {
        browserSkill = new BrowserSkill();
    }

    function testCreateSession() external {
        vm.prank(user1);
        bytes32 sessionId = browserSkill.createSession();

        assertTrue(sessionId != bytes32(0));
        assertEq(browserSkill.getSessionCount(user1), 1);
    }

    function testNavigateTo() external {
        vm.prank(user1);
        bytes32 sessionId = browserSkill.createSession();

        vm.prank(user1);
        browserSkill.navigateTo(sessionId, "https://example.com");

        (address owner, string memory url, uint256 createdAt, bool isActive, uint256 actionCount) = 
            browserSkill.getSession(sessionId);
        
        assertEq(owner, user1);
        assertEq(url, "https://example.com");
        assertTrue(isActive);
        assertEq(actionCount, 1);
    }

    function testPerformClick() external {
        vm.prank(user1);
        bytes32 sessionId = browserSkill.createSession();

        vm.prank(user1);
        browserSkill.performClick(sessionId, "#submit-button");

        (, , , , uint256 actionCount) = browserSkill.getSession(sessionId);
        assertEq(actionCount, 1);
    }

    function testFillForm() external {
        vm.prank(user1);
        bytes32 sessionId = browserSkill.createSession();

        vm.prank(user1);
        browserSkill.fillForm(sessionId, "#email", "test@example.com");

        (, , , , uint256 actionCount) = browserSkill.getSession(sessionId);
        assertEq(actionCount, 1);
    }

    function testSubmitForm() external {
        vm.prank(user1);
        bytes32 sessionId = browserSkill.createSession();

        vm.prank(user1);
        browserSkill.submitForm(sessionId);

        (, , , , uint256 actionCount) = browserSkill.getSession(sessionId);
        assertEq(actionCount, 1);
    }

    function testCloseSession() external {
        vm.prank(user1);
        bytes32 sessionId = browserSkill.createSession();

        vm.prank(user1);
        browserSkill.closeSession(sessionId);

        (, , , bool isActive, ) = browserSkill.getSession(sessionId);
        assertFalse(isActive);
    }

    function testOnlyOwnerCanNavigate() external {
        vm.prank(user1);
        bytes32 sessionId = browserSkill.createSession();

        vm.prank(user2);
        vm.expectRevert();
        browserSkill.navigateTo(sessionId, "https://evil.com");
    }

    function testCannotNavigateOnClosedSession() external {
        vm.prank(user1);
        bytes32 sessionId = browserSkill.createSession();

        vm.prank(user1);
        browserSkill.closeSession(sessionId);

        vm.prank(user1);
        vm.expectRevert();
        browserSkill.navigateTo(sessionId, "https://example.com");
    }
}
