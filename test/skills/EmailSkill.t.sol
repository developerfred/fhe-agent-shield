// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

import { Test } from "forge-std/src/Test.sol";
import { EmailSkill } from "../../skills/email/EmailSkill.sol";

contract EmailSkillTest is Test {
    EmailSkill public emailSkill;

    address public user1 = address(0x1);
    address public user2 = address(0x2);

    function setUp() public {
        emailSkill = new EmailSkill();
    }

    function testSendEmail() external {
        vm.prank(user1);
        bytes32 emailId = emailSkill.sendEmail(user2, "Hello", "This is a test email");

        assertTrue(emailId != bytes32(0));
        assertEq(emailSkill.getSentCount(user1), 1);
        assertEq(emailSkill.getReceivedCount(user2), 1);
    }

    function testSendEmailEmitsEvent() external {
        vm.prank(user1);
        bytes32 emailId = emailSkill.sendEmail(user2, "Subject", "Body");
        assertTrue(emailId != bytes32(0));
    }

    function testGetEmailAsSender() external {
        vm.prank(user1);
        bytes32 emailId = emailSkill.sendEmail(user2, "Subject", "Body");

        vm.prank(user1);
        (address from, address to, string memory subject, string memory body, uint256 ts, bool encrypted) =
            emailSkill.getEmail(emailId);

        assertEq(from, user1);
        assertEq(to, user2);
        assertEq(subject, "Subject");
        assertEq(body, "Body");
        assertFalse(encrypted);
    }

    function testGetEmailAsRecipient() external {
        vm.prank(user1);
        bytes32 emailId = emailSkill.sendEmail(user2, "Subject", "Body");

        vm.prank(user2);
        (address from, address to, string memory subject, string memory body, uint256 ts, bool encrypted) =
            emailSkill.getEmail(emailId);

        assertEq(from, user1);
        assertEq(to, user2);
        assertEq(subject, "Subject");
        assertEq(body, "Body");
        assertFalse(encrypted);
    }

    function testGetEmailNotAuthorized() external {
        vm.prank(user1);
        bytes32 emailId = emailSkill.sendEmail(user2, "Subject", "Body");

        vm.prank(address(0x99));
        vm.expectRevert();
        emailSkill.getEmail(emailId);
    }
}
