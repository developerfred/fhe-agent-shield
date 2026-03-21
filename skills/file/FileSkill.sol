// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

import { FHE, inEuint256, euint256, ebool } from "@fhenixprotocol/contracts/FHE.sol";

contract FileSkill {
    enum FileOperation {
        Read,
        Write,
        Delete,
        Append,
        List
    }

    struct File {
        address owner;
        bytes32 contentHash;
        uint256 size;
        uint256 createdAt;
        uint256 modifiedAt;
        bool isEncrypted;
    }

    mapping(bytes32 => File) public files;
    mapping(bytes32 => mapping(address => bool)) public accessList;
    mapping(address => bytes32[]) public userFiles;

    event FileCreated(bytes32 indexed fileId, address indexed owner, uint256 timestamp);
    event FileWritten(bytes32 indexed fileId, address indexed owner, uint256 timestamp);
    event FileRead(bytes32 indexed fileId, address indexed reader, uint256 timestamp);
    event FileDeleted(bytes32 indexed fileId, address indexed owner, uint256 timestamp);
    event FileEncrypted(bytes32 indexed fileId, uint256 timestamp);
    event AccessGranted(bytes32 indexed fileId, address indexed grantee, uint256 timestamp);
    event AccessRevoked(bytes32 indexed fileId, address indexed grantee, uint256 timestamp);

    function createFile(bytes32 fileId, string calldata initialContent) external {
        require(files[fileId].createdAt == 0, "File already exists");
        bytes32 contentHash = keccak256(abi.encode(initialContent));
        files[fileId].owner = msg.sender;
        files[fileId].contentHash = contentHash;
        files[fileId].size = bytes(initialContent).length;
        files[fileId].createdAt = block.timestamp;
        files[fileId].modifiedAt = block.timestamp;
        files[fileId].isEncrypted = false;
        accessList[fileId][msg.sender] = true;
        userFiles[msg.sender].push(fileId);
        emit FileCreated(fileId, msg.sender, block.timestamp);
    }

    function createEncryptedFile(bytes32 fileId, inEuint256 calldata encryptedContent) external {
        require(files[fileId].createdAt == 0, "File already exists");
        euint256 encContent = FHE.asEuint256(encryptedContent);
        euint256 zero = FHE.asEuint256(0);
        ebool isValid = FHE.ne(encContent, zero);
        require(FHE.decrypt(isValid), "Invalid content");
        bytes32 contentHash = keccak256(abi.encode(encContent));
        files[fileId].owner = msg.sender;
        files[fileId].contentHash = contentHash;
        files[fileId].size = 32;
        files[fileId].createdAt = block.timestamp;
        files[fileId].modifiedAt = block.timestamp;
        files[fileId].isEncrypted = true;
        accessList[fileId][msg.sender] = true;
        userFiles[msg.sender].push(fileId);
        emit FileCreated(fileId, msg.sender, block.timestamp);
        emit FileEncrypted(fileId, block.timestamp);
    }

    function writeFile(bytes32 fileId, string calldata content) external {
        require(hasAccess(fileId, msg.sender), "No access");
        bytes32 contentHash = keccak256(abi.encode(content));
        files[fileId].contentHash = contentHash;
        files[fileId].size = bytes(content).length;
        files[fileId].modifiedAt = block.timestamp;
        emit FileWritten(fileId, msg.sender, block.timestamp);
    }

    function writeEncryptedFile(bytes32 fileId, inEuint256 calldata encryptedContent) external {
        require(hasAccess(fileId, msg.sender), "No access");
        euint256 encContent = FHE.asEuint256(encryptedContent);
        bytes32 contentHash = keccak256(abi.encode(encContent));
        files[fileId].contentHash = contentHash;
        files[fileId].modifiedAt = block.timestamp;
        emit FileWritten(fileId, msg.sender, block.timestamp);
    }

    function readFile(bytes32 fileId) external view returns (
        bytes32 contentHash,
        uint256 size,
        uint256 modifiedAt,
        bool isEncrypted
    ) {
        require(hasAccess(fileId, msg.sender), "No access");
        File storage file = files[fileId];
        return (
            file.contentHash,
            file.size,
            file.modifiedAt,
            file.isEncrypted
        );
    }

    function deleteFile(bytes32 fileId) external {
        require(files[fileId].owner == msg.sender, "Not file owner");
        delete files[fileId];
        emit FileDeleted(fileId, msg.sender, block.timestamp);
    }

    function grantAccess(bytes32 fileId, address grantee) external {
        require(files[fileId].owner == msg.sender, "Not file owner");
        accessList[fileId][grantee] = true;
        emit AccessGranted(fileId, grantee, block.timestamp);
    }

    function revokeAccess(bytes32 fileId, address grantee) external {
        require(files[fileId].owner == msg.sender, "Not file owner");
        accessList[fileId][grantee] = false;
        emit AccessRevoked(fileId, grantee, block.timestamp);
    }

    function hasAccess(bytes32 fileId, address user) public view returns (bool) {
        File storage file = files[fileId];
        return accessList[fileId][user] || file.owner == user;
    }

    function listUserFiles() external view returns (bytes32[] memory) {
        return userFiles[msg.sender];
    }

    function getFileInfo(bytes32 fileId) external view returns (
        address owner,
        uint256 createdAt,
        uint256 modifiedAt,
        bool isEncrypted,
        uint256 accessCount
    ) {
        File storage file = files[fileId];
        uint256 count = 0;
        for (uint256 i = 0; i < userFiles[file.owner].length; i++) {
            if (userFiles[file.owner][i] == fileId) {
                count++;
            }
        }
        return (
            file.owner,
            file.createdAt,
            file.modifiedAt,
            file.isEncrypted,
            count
        );
    }
}
