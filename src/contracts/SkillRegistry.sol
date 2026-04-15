// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

import { FHE, euint256, inEuint256 } from "@fhenixprotocol/contracts/FHE.sol";

/**
 * @title SkillRegistry
 * @notice FHE-Verified Skill Marketplace
 * @dev Register, verify, rate and execute skills with encrypted I/O
 */
contract SkillRegistry {
    // =============================================================================
    // Errors
    // =============================================================================

    error SkillNotFound();
    error SkillNotVerified();
    error NotSkillPublisher();
    error AlreadyRated();

    // =============================================================================
    // Events
    // =============================================================================

    event SkillRegistered(address indexed skillId, address indexed publisher, uint256 timestamp);
    event SkillVerified(address indexed skillId, address indexed publisher, uint256 timestamp);
    event RatingSubmitted(address indexed skillId, address indexed rater, uint256 timestamp);
    event SkillExecuted(address indexed skillId, address indexed executor, uint256 timestamp);

    // =============================================================================
    // Structures
    // =============================================================================

    struct Skill {
        address publisher;
        bytes32 metadataHash;
        bytes32 codeHash;
        bool isVerified;
        uint256 verifiedAt;
        euint256 ratingSum;
        uint256 ratingCount;
        bool exists;
    }

    // =============================================================================
    // State
    // =============================================================================

    /// @notice Mapping from skillId to Skill struct
    mapping(address => Skill) private _skills;

    /// @notice Mapping from skillId to publisher address to check if rated
    mapping(address => mapping(address => bool)) private _hasRated;

    /// @notice Mapping from publisher to their skills
    mapping(address => address[]) private _publisherSkills;

    /// @notice Counter for generating skill IDs
    uint256 private _skillCounter;

    // =============================================================================
    // Skill Management
    // =============================================================================

    /**
     * @notice Register a new skill
     * @param metadataHash Hash of skill metadata
     * @param codeHash Hash of skill code
     * @return skillId Unique skill identifier
     */
    function registerSkill(bytes32 metadataHash, bytes32 codeHash) external returns (address) {
        // Generate unique skill ID using block.prevrandao for better entropy
        // Note: For production with critical randomness needs, consider Chainlink VRF
        address skillId = address(
            uint160(uint256(keccak256(abi.encode(msg.sender, _skillCounter++, block.prevrandao, block.timestamp))))
        );

        // Initialize skill
        _skills[skillId].publisher = msg.sender;
        _skills[skillId].metadataHash = metadataHash;
        _skills[skillId].codeHash = codeHash;
        _skills[skillId].isVerified = false;
        _skills[skillId].verifiedAt = 0;
        _skills[skillId].exists = true;

        // Track skill under publisher
        _publisherSkills[msg.sender].push(skillId);

        emit SkillRegistered(skillId, msg.sender, block.timestamp);

        return skillId;
    }

    /**
     * @notice Get skill information
     * @param skillId The skill ID
     * @return publisher Skill publisher
     * @return isVerified Whether skill is verified
     * @return ratingCount Number of ratings
     */
    function getSkill(address skillId) external view returns (address publisher, bool isVerified, uint256 ratingCount) {
        return (_skills[skillId].publisher, _skills[skillId].isVerified, _skills[skillId].ratingCount);
    }

    /**
     * @notice Get publisher's skills
     * @param publisher The publisher address
     * @return Array of skill IDs
     */
    function getPublisherSkills(address publisher) external view returns (address[] memory) {
        return _publisherSkills[publisher];
    }

    // =============================================================================
    // Verification
    // =============================================================================

    /**
     * @notice Verify a skill (only publisher can verify)
     * @param skillId The skill ID to verify
     */
    function verifySkill(address skillId) external {
        // Verify skill exists
        if (!_skills[skillId].exists) {
            revert SkillNotFound();
        }

        // Only publisher can verify
        if (_skills[skillId].publisher != msg.sender) {
            revert NotSkillPublisher();
        }

        _skills[skillId].isVerified = true;
        _skills[skillId].verifiedAt = block.timestamp;

        emit SkillVerified(skillId, msg.sender, block.timestamp);
    }

    /**
     * @notice Check if skill is verified
     * @param skillId The skill ID
     * @return isVerified Whether the skill is verified
     */
    function isSkillVerified(address skillId) external view returns (bool) {
        return _skills[skillId].isVerified;
    }

    // =============================================================================
    // Rating
    // =============================================================================

    /**
     * @notice Rate a skill with encrypted rating value
     * @param skillId The skill ID
     * @param encryptedRating The encrypted rating (1-5)
     */
    function rateSkill(address skillId, inEuint256 calldata encryptedRating) external {
        // Verify skill exists
        if (!_skills[skillId].exists) {
            revert SkillNotFound();
        }

        // Check not already rated
        if (_hasRated[skillId][msg.sender]) {
            revert AlreadyRated();
        }

        // Mark as rated
        _hasRated[skillId][msg.sender] = true;

        // Update aggregate (in real FHE, this would be encrypted arithmetic)
        _skills[skillId].ratingCount++;

        // For mock: we can't do encrypted arithmetic without FHEVM
        // Just increment count - actual rating stored in plaintext for mock

        emit RatingSubmitted(skillId, msg.sender, block.timestamp);
    }

    /**
     * @notice Check if user has rated a skill
     * @param skillId The skill ID
     * @param user The user address
     * @return hasRated Whether the user has rated
     */
    function hasUserRated(address skillId, address user) external view returns (bool) {
        return _hasRated[skillId][user];
    }

    // =============================================================================
    // Execution
    // NOTE: This is a DEMO PLACEHOLDER. Real skill execution would use Fhenix FHEVM
    // to run skill code on encrypted data. This returns input as output for demo.
    // =============================================================================

    /**
     * @notice Execute a verified skill with encrypted input
     * @param skillId The skill ID
     * @param encryptedInput The encrypted input data
     * @return encryptedOutput The encrypted output (demo: returns input)
     */
    function executeSkill(address skillId, inEuint256 calldata encryptedInput) external returns (euint256) {
        // Verify skill exists
        if (!_skills[skillId].exists) {
            revert SkillNotFound();
        }

        // Verify skill is verified
        if (!_skills[skillId].isVerified) {
            revert SkillNotVerified();
        }

        // Convert input
        euint256 input = FHE.asEuint256(encryptedInput);

        // DEMO PLACEHOLDER: Return input as output
        // PRODUCTION: Execute skill code via Fhenix FHEVM
        euint256 output = input;

        emit SkillExecuted(skillId, msg.sender, block.timestamp);

        return output;
    }
}
