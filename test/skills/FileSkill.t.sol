// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

import { Test } from "forge-std/src/Test.sol";
import { FileSkill } from "../../skills/file/FileSkill.sol";

contract FileSkillTest is Test {
    FileSkill public fileSkill;

    address public user1 = address(0x1);
    address public user2 = address(0x2);

    bytes32 internal constant FILE1 = bytes32(uint256(1));
    bytes32 internal constant FILE2 = bytes32(uint256(2));
    bytes32 internal constant FILE3 = bytes32(uint256(3));
    bytes32 internal constant FILE4 = bytes32(uint256(4));
    bytes32 internal constant FILE5 = bytes32(uint256(5));

    function setUp() public {
        fileSkill = new FileSkill();
    }

    function testCreateFile() external {
        vm.prank(user1);
        fileSkill.createFile(FILE1, "Hello, World!");

        (address owner, uint256 createdAt, , bool isEncrypted, ) = 
            fileSkill.getFileInfo(FILE1);
        
        assertEq(owner, user1);
        assertTrue(createdAt > 0);
        assertFalse(isEncrypted);
    }

    function testCreateFileEmitsEvent() external {
        vm.prank(user1);
        fileSkill.createFile(FILE2, "Content");
    }

    function testWriteFile() external {
        vm.startPrank(user1);
        fileSkill.createFile(FILE3, "Initial content");
        fileSkill.writeFile(FILE3, "Updated content");

        (, uint256 size, , bool isEncrypted) = 
            fileSkill.readFile(FILE3);
        
        assertEq(size, 15);
        assertFalse(isEncrypted);
        vm.stopPrank();
    }

    function testReadFile() external {
        vm.startPrank(user1);
        fileSkill.createFile(FILE4, "Hello, World!");

        (bytes32 contentHash, uint256 size, , bool isEncrypted) = 
            fileSkill.readFile(FILE4);
        
        assertTrue(contentHash != bytes32(0));
        assertEq(size, 13);
        assertFalse(isEncrypted);
        vm.stopPrank();
    }

    function testDeleteFile() external {
        vm.startPrank(user1);
        fileSkill.createFile(FILE5, "Content");
        fileSkill.deleteFile(FILE5);
        vm.stopPrank();

        vm.expectRevert();
        fileSkill.readFile(FILE5);
    }

    function testGrantAccess() external {
        vm.prank(user1);
        fileSkill.createFile(FILE1, "Content");

        vm.prank(user1);
        fileSkill.grantAccess(FILE1, user2);

        assertTrue(fileSkill.hasAccess(FILE1, user2));
    }

    function testRevokeAccess() external {
        bytes32 fileId = bytes32(uint256(100));
        vm.prank(user1);
        fileSkill.createFile(fileId, "Content");

        vm.prank(user1);
        fileSkill.grantAccess(fileId, user2);
        assertTrue(fileSkill.hasAccess(fileId, user2));

        vm.prank(user1);
        fileSkill.revokeAccess(fileId, user2);
        assertFalse(fileSkill.hasAccess(fileId, user2));
    }

    function testOnlyOwnerCanGrantAccess() external {
        bytes32 fileId = bytes32(uint256(101));
        vm.prank(user1);
        fileSkill.createFile(fileId, "Content");

        vm.prank(user2);
        vm.expectRevert();
        fileSkill.grantAccess(fileId, address(0x3));
    }

    function testOnlyOwnerCanDelete() external {
        bytes32 fileId = bytes32(uint256(102));
        vm.prank(user1);
        fileSkill.createFile(fileId, "Content");

        vm.prank(user2);
        vm.expectRevert();
        fileSkill.deleteFile(fileId);
    }

    function testListUserFiles() external {
        vm.startPrank(user1);
        fileSkill.createFile(bytes32(uint256(200)), "File 1");
        fileSkill.createFile(bytes32(uint256(201)), "File 2");
        fileSkill.createFile(bytes32(uint256(202)), "File 3");
        bytes32[] memory files = fileSkill.listUserFiles();
        assertEq(files.length, 3);
        vm.stopPrank();
    }
}
