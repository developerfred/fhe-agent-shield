// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

import { FHE, inEuint256, euint256, ebool } from "@fhenixprotocol/contracts/FHE.sol";

contract EmailSkill {
    struct Email {
        address from;
        address recipient;
        string subject;
        string body;
        uint256 timestamp;
        bool isEncrypted;
    }

    mapping(bytes32 => Email) public emails;
    mapping(address => bytes32[]) public sentEmails;
    mapping(address => bytes32[]) public receivedEmails;

    event EmailSent(bytes32 indexed emailId, address indexed from, address indexed to, uint256 timestamp);
    event EmailReceived(bytes32 indexed emailId, address indexed to, uint256 timestamp);
    event EmailEncrypted(bytes32 indexed emailId);

    function sendEmail(
        address recipient,
        string calldata subject,
        string calldata body
    ) external returns (bytes32 emailId) {
        emailId = generateEmailId(msg.sender, recipient, block.timestamp);

        emails[emailId] = Email({
            from: msg.sender,
            recipient: recipient,
            subject: subject,
            body: body,
            timestamp: block.timestamp,
            isEncrypted: false
        });

        sentEmails[msg.sender].push(emailId);
        receivedEmails[recipient].push(emailId);

        emit EmailSent(emailId, msg.sender, recipient, block.timestamp);
    }

    function sendEncryptedEmail(
        inEuint256 calldata encryptedRecipient,
        inEuint256 calldata encryptedSubject,
        inEuint256 calldata encryptedBody
    ) external returns (bytes32 emailId) {
        euint256 encRecipient = FHE.asEuint256(encryptedRecipient);
        euint256 encSubject = FHE.asEuint256(encryptedSubject);
        euint256 encBody = FHE.asEuint256(encryptedBody);

        ebool isValid = FHE.ne(encRecipient, FHE.asEuint256(0));
        require(FHE.decrypt(isValid), "Invalid recipient");

        address recipient = address(uint160(FHE.decrypt(encRecipient)));

        emailId = generateEmailId(msg.sender, recipient, block.timestamp);

        emails[emailId] = Email({
            from: msg.sender,
            recipient: recipient,
            subject: "",
            body: "",
            timestamp: block.timestamp,
            isEncrypted: true
        });

        sentEmails[msg.sender].push(emailId);
        receivedEmails[recipient].push(emailId);

        emit EmailSent(emailId, msg.sender, recipient, block.timestamp);
        emit EmailEncrypted(emailId);
    }

    function getEmail(bytes32 emailId) external view returns (
        address from,
        address to,
        string memory subject,
        string memory body,
        uint256 timestamp,
        bool isEncrypted
    ) {
        Email storage email = emails[emailId];
        require(email.timestamp > 0, "Email not found");

        for (uint256 i = 0; i < sentEmails[msg.sender].length; i++) {
            if (sentEmails[msg.sender][i] == emailId) {
                return (msg.sender, email.recipient, email.subject, email.body, email.timestamp, false);
            }
        }

        for (uint256 i = 0; i < receivedEmails[msg.sender].length; i++) {
            if (receivedEmails[msg.sender][i] == emailId) {
                return (email.from, msg.sender, email.subject, email.body, email.timestamp, false);
            }
        }

        revert("Not authorized to view this email");
    }

    function getSentCount(address sender) external view returns (uint256) {
        return sentEmails[sender].length;
    }

    function getReceivedCount(address recipient) external view returns (uint256) {
        return receivedEmails[recipient].length;
    }

    function generateEmailId(address from, address to, uint256 timestamp) internal view returns (bytes32) {
        return keccak256(abi.encode(from, to, timestamp, block.prevrandao));
    }
}
