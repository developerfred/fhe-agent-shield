// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

import { FHE, inEuint256, ebool, euint256 } from "@fhenixprotocol/contracts/FHE.sol";

contract BrowserSkill {
    enum BrowserAction {
        Navigate,
        Click,
        Fill,
        Submit,
        Screenshot
    }

    struct BrowserSession {
        address owner;
        string currentUrl;
        uint256 createdAt;
        bool isActive;
        uint256 actionCount;
    }

    mapping(bytes32 => BrowserSession) public sessions;
    mapping(bytes32 => mapping(uint256 => BrowserAction)) public actionHistory;
    mapping(address => bytes32[]) public userSessions;

    event SessionCreated(bytes32 indexed sessionId, address indexed owner, uint256 timestamp);
    event PageNavigated(bytes32 indexed sessionId, string indexed url, uint256 timestamp);
    event ActionPerformed(bytes32 indexed sessionId, BrowserAction action, uint256 timestamp);
    event SessionClosed(bytes32 indexed sessionId, uint256 timestamp);

    function createSession() external returns (bytes32 sessionId) {
        sessionId = generateSessionId(msg.sender, block.timestamp);
        sessions[sessionId] = BrowserSession({
            owner: msg.sender,
            currentUrl: "",
            createdAt: block.timestamp,
            isActive: true,
            actionCount: 0
        });
        userSessions[msg.sender].push(sessionId);
        emit SessionCreated(sessionId, msg.sender, block.timestamp);
    }

    function navigateTo(bytes32 sessionId, string calldata url) external {
        require(sessions[sessionId].isActive, "Session not active");
        require(sessions[sessionId].owner == msg.sender, "Not session owner");
        sessions[sessionId].currentUrl = url;
        sessions[sessionId].actionCount++;
        uint256 actionIndex = sessions[sessionId].actionCount;
        actionHistory[sessionId][actionIndex] = BrowserAction.Navigate;
        emit PageNavigated(sessionId, url, block.timestamp);
        emit ActionPerformed(sessionId, BrowserAction.Navigate, block.timestamp);
    }

    function encryptedNavigateTo(bytes32 sessionId, inEuint256 calldata encryptedUrl) external {
        require(sessions[sessionId].isActive, "Session not active");
        require(sessions[sessionId].owner == msg.sender, "Not session owner");

        euint256 encUrl = FHE.asEuint256(encryptedUrl);
        ebool isValidUrl = FHE.ne(encUrl, FHE.asEuint256(0));

        require(FHE.decrypt(isValidUrl), "Invalid URL");

        bytes32 urlHash = keccak256(abi.encode(encUrl));
        string memory url = string(abi.encodePacked("encrypted://", urlHash));

        sessions[sessionId].currentUrl = url;
        sessions[sessionId].actionCount++;
        uint256 actionIndex = sessions[sessionId].actionCount;
        actionHistory[sessionId][actionIndex] = BrowserAction.Navigate;
        emit PageNavigated(sessionId, "[ENCRYPTED_URL]", block.timestamp);
        emit ActionPerformed(sessionId, BrowserAction.Navigate, block.timestamp);
    }

    function performClick(bytes32 sessionId, string calldata selector) external {
        require(sessions[sessionId].isActive, "Session not active");
        require(sessions[sessionId].owner == msg.sender, "Not session owner");
        sessions[sessionId].actionCount++;
        uint256 actionIndex = sessions[sessionId].actionCount;
        actionHistory[sessionId][actionIndex] = BrowserAction.Click;
        emit ActionPerformed(sessionId, BrowserAction.Click, block.timestamp);
    }

    function fillForm(bytes32 sessionId, string calldata field, string calldata value) external {
        require(sessions[sessionId].isActive, "Session not active");
        require(sessions[sessionId].owner == msg.sender, "Not session owner");
        sessions[sessionId].actionCount++;
        uint256 actionIndex = sessions[sessionId].actionCount;
        actionHistory[sessionId][actionIndex] = BrowserAction.Fill;
        emit ActionPerformed(sessionId, BrowserAction.Fill, block.timestamp);
    }

    function submitForm(bytes32 sessionId) external {
        require(sessions[sessionId].isActive, "Session not active");
        require(sessions[sessionId].owner == msg.sender, "Not session owner");
        sessions[sessionId].actionCount++;
        uint256 actionIndex = sessions[sessionId].actionCount;
        actionHistory[sessionId][actionIndex] = BrowserAction.Submit;
        emit ActionPerformed(sessionId, BrowserAction.Submit, block.timestamp);
    }

    function closeSession(bytes32 sessionId) external {
        require(sessions[sessionId].owner == msg.sender, "Not session owner");
        sessions[sessionId].isActive = false;
        emit SessionClosed(sessionId, block.timestamp);
    }

    function getSession(bytes32 sessionId) external view returns (
        address owner,
        string memory currentUrl,
        uint256 createdAt,
        bool isActive,
        uint256 actionCount
    ) {
        BrowserSession storage session = sessions[sessionId];
        return (
            session.owner,
            session.currentUrl,
            session.createdAt,
            session.isActive,
            session.actionCount
        );
    }

    function getSessionCount(address user) external view returns (uint256) {
        return userSessions[user].length;
    }

    function generateSessionId(address owner, uint256 timestamp) internal view returns (bytes32) {
        return keccak256(abi.encode(owner, timestamp, block.prevrandao));
    }
}
