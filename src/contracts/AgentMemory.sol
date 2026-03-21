// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

import { FHE, euint256, inEuint256 } from "@fhenixprotocol/contracts/FHE.sol";

/**
 * @title AgentMemory
 * @notice Encrypted agent state management with FHE
 * @dev Stores agent context encrypted, supports snapshots and computations
 */
contract AgentMemory {
    
    // =============================================================================
    // Errors
    // =============================================================================
    
error AgentAlreadyExists();
    error AgentNotFound();
    error NotAgentOwner();
    error OffsetExceedsLength();
    error SnapshotNotFound();
    error UnsupportedOperation();

    // =============================================================================
    // Events
    // =============================================================================
    
    event AgentInitialized(address indexed agentId, address indexed owner, uint256 timestamp);
    event ContextAppended(address indexed agentId, address indexed owner, uint256 chunkIndex, uint256 timestamp);
    event SnapshotCreated(address indexed agentId, address indexed snapshotId, address indexed owner, uint256 contextLength, uint256 timestamp);
    event ContextRestored(address indexed agentId, address indexed owner, uint256 newLength, uint256 timestamp);

    // =============================================================================
    // Structures
    // =============================================================================
    
    struct Agent {
        address owner;
        euint256[] context;
        uint256 snapshotCounter;
    }
    
    struct Snapshot {
        address agentId;
        euint256[] context;
        uint256 timestamp;
    }

    // =============================================================================
    // State
    // =============================================================================
    
    /// @notice Mapping from agentId to Agent struct
    mapping(address => Agent) private _agents;
    
    /// @notice Mapping from snapshotId to Snapshot struct
    mapping(address => Snapshot) private _snapshots;
    
    /// @notice Counter for generating unique agent IDs
    uint256 private _agentCounter;

    // =============================================================================
    // Agent Management
    // =============================================================================
    
    /**
     * @notice Initialize a new agent with caller as owner
     * @return agentId Unique address-based identifier for the agent
     */
    function initializeAgent() external returns (address) {
        address owner = msg.sender;
        address agentId = address(uint160(uint256(keccak256(abi.encode(owner, _agentCounter++)))));
        
        // Check agent doesn't already exist
        if (_agents[agentId].owner != address(0)) {
            revert AgentAlreadyExists();
        }
        
        // Initialize agent with empty context
        _agents[agentId].owner = owner;
        
        emit AgentInitialized(agentId, owner, block.timestamp);
        
        return agentId;
    }
    
    /**
     * @notice Check if agent exists
     * @param agentId The agent ID to check
     * @return exists Whether the agent exists
     */
    function agentExists(address agentId) external view returns (bool) {
        return _agents[agentId].owner != address(0);
    }
    
    /**
     * @notice Get agent owner
     * @param agentId The agent ID
     * @return owner The owner's address
     */
    function getAgentOwner(address agentId) external view returns (address) {
        return _agents[agentId].owner;
    }

    // =============================================================================
    // Context Management
    // =============================================================================
    
    /**
     * @notice Append encrypted context chunk to agent
     * @param agentId The agent ID
     * @param encryptedChunk The encrypted chunk to append
     * @return newLength The new context length
     */
    function appendContext(address agentId, inEuint256 calldata encryptedChunk) external returns (uint256) {
        // Verify agent exists
        if (_agents[agentId].owner == address(0)) {
            revert AgentNotFound();
        }
        
        // Only owner can append
        if (_agents[agentId].owner != msg.sender) {
            revert NotAgentOwner();
        }
        
        // Convert and store
        euint256 chunk = FHE.asEuint256(encryptedChunk);
        _agents[agentId].context.push(chunk);
        
        uint256 newLength = _agents[agentId].context.length;
        
        emit ContextAppended(agentId, msg.sender, newLength - 1, block.timestamp);
        
        return newLength;
    }
    
    /**
     * @notice Get context slice as encrypted values
     * @param agentId The agent ID
     * @param offset Start index
     * @param length Number of chunks to retrieve
     * @return chunks Array of encrypted chunks
     */
    function getContextSlice(address agentId, uint256 offset, uint256 length) external view returns (euint256[] memory) {
        // Verify agent exists
        if (_agents[agentId].owner == address(0)) {
            revert AgentNotFound();
        }
        
        uint256 contextLength = _agents[agentId].context.length;
        
        // Handle offset exceeding length
        if (offset >= contextLength) {
            revert OffsetExceedsLength();
        }
        
        // Adjust length if it exceeds available chunks
        uint256 actualLength = length;
        if (offset + length > contextLength) {
            actualLength = contextLength - offset;
        }
        
        // Return empty array if no chunks available
        if (actualLength == 0) {
            return new euint256[](0);
        }
        
        // Create result array with only accessible chunks
        euint256[] memory result = new euint256[](actualLength);
        for (uint256 i = 0; i < actualLength; i++) {
            result[i] = _agents[agentId].context[offset + i];
        }
        
        return result;
    }
    
    /**
     * @notice Get current context length for an agent
     * @param agentId The agent ID
     * @return length Current context length
     */
    function getContextLength(address agentId) external view returns (uint256) {
        if (_agents[agentId].owner == address(0)) {
            revert AgentNotFound();
        }
        return _agents[agentId].context.length;
    }

    // =============================================================================
    // Snapshot Management
    // =============================================================================
    
    /**
     * @notice Create snapshot of current context
     * @param agentId The agent ID
     * @return snapshotId Unique snapshot identifier
     */
    function snapshotContext(address agentId) external returns (address) {
        // Verify agent exists
        if (_agents[agentId].owner == address(0)) {
            revert AgentNotFound();
        }
        
        // Only owner can snapshot
        if (_agents[agentId].owner != msg.sender) {
            revert NotAgentOwner();
        }
        
        // Generate snapshot ID using block.prevrandao for better entropy
        // Note: For production with critical randomness needs, consider Chainlink VRF
        address snapshotId = address(uint160(uint256(keccak256(abi.encode(
            agentId,
            _agents[agentId].snapshotCounter++,
            block.prevrandao,
            block.timestamp
        )))));
        
        // Copy current context to snapshot
        uint256 contextLength = _agents[agentId].context.length;
        _snapshots[snapshotId].context = new euint256[](contextLength);
        
        for (uint256 i = 0; i < contextLength; i++) {
            _snapshots[snapshotId].context[i] = _agents[agentId].context[i];
        }
        
        _snapshots[snapshotId].agentId = agentId;
        _snapshots[snapshotId].timestamp = block.timestamp;
        
        emit SnapshotCreated(agentId, snapshotId, msg.sender, contextLength, block.timestamp);
        
        return snapshotId;
    }
    
    /**
     * @notice Restore context from snapshot
     * @param snapshotId The snapshot ID to restore from
     */
    function restoreFromSnapshot(address snapshotId) external {
        // Verify snapshot exists
        if (_snapshots[snapshotId].agentId == address(0)) {
            revert SnapshotNotFound();
        }
        
        address agentId = _snapshots[snapshotId].agentId;
        
        // Only agent owner can restore
        if (_agents[agentId].owner != msg.sender) {
            revert NotAgentOwner();
        }
        
        // Verify snapshot belongs to this agent
        if (_snapshots[snapshotId].agentId != agentId) {
            revert SnapshotNotFound();
        }
        
        // Restore context from snapshot
        uint256 snapshotLength = _snapshots[snapshotId].context.length;
        delete _agents[agentId].context;
        _agents[agentId].context = new euint256[](snapshotLength);
        
        for (uint256 i = 0; i < snapshotLength; i++) {
            _agents[agentId].context[i] = _snapshots[snapshotId].context[i];
        }
        
        emit ContextRestored(agentId, msg.sender, snapshotLength, block.timestamp);
    }

    // =============================================================================
    // Computations
    // NOTE: This is a DEMO PLACEHOLDER. Real FHE arithmetic operations require
    // Fhenix FHEVM runtime. This returns encrypted first chunk as demonstration.
    // When integrated with Fhenix CoFHE, replace with actual FHE ops:
    // result = FHE.add(result, _agents[agentId].context[offset + i]);
    // =============================================================================
    
    /**
     * @notice Compute operation on encrypted context slice
     * @param agentId The agent ID
     * @param operation The operation to perform (e.g., "sum", "avg")
     * @param offset Start index
     * @param length Number of chunks
     * @return result The computed encrypted result (demo: returns first chunk)
     */
    function computeOnContext(
        address agentId,
        string calldata operation,
        uint256 offset,
        uint256 length
    ) external view returns (euint256) {
        // Verify agent exists
        if (_agents[agentId].owner == address(0)) {
            revert AgentNotFound();
        }
        
        uint256 contextLength = _agents[agentId].context.length;
        
        if (offset >= contextLength) {
            revert OffsetExceedsLength();
        }
        
        uint256 actualLength = offset + length > contextLength 
            ? contextLength - offset 
            : length;
        
        // DEMO: Return first chunk as placeholder for sum/avg
        // TODO: Replace with FHE.add() loop when using Fhenix FHEVM
        if (keccak256(abi.encodePacked(operation)) == keccak256("sum") ||
            keccak256(abi.encodePacked(operation)) == keccak256("avg")) {
            
            euint256 result = FHE.asEuint256(0);
            
            for (uint256 i = 0; i < actualLength; i++) {
                // DEMO PLACEHOLDER: Return first chunk only
                // PRODUCTION: FHE.add(result, _agents[agentId].context[offset + i]);
                if (i == 0) {
                    result = _agents[agentId].context[offset];
                }
            }
            
            return result;
        }
        
        revert UnsupportedOperation();
    }
}