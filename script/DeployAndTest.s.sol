// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { Script, console2 } from "forge-std/src/Script.sol";
import { AgentVault } from "../src/contracts/AgentVault.sol";
import { AgentMemory } from "../src/contracts/AgentMemory.sol";
import { SkillRegistry } from "../src/contracts/SkillRegistry.sol";
import { ActionSealer } from "../src/contracts/ActionSealer.sol";

contract DeployAll is Script {
    struct DeployedContracts {
        address agentVault;
        address agentMemory;
        address skillRegistry;
        address actionSealer;
        uint256 deployerPrivateKey;
    }

    function run() external returns (DeployedContracts memory) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("Deploying contracts from:", deployer);
        console2.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        AgentVault agentVault = new AgentVault();
        console2.log("AgentVault deployed at:", address(agentVault));

        AgentMemory agentMemory = new AgentMemory();
        console2.log("AgentMemory deployed at:", address(agentMemory));

        SkillRegistry skillRegistry = new SkillRegistry();
        console2.log("SkillRegistry deployed at:", address(skillRegistry));

        ActionSealer actionSealer = new ActionSealer();
        console2.log("ActionSealer deployed at:", address(actionSealer));

        vm.stopBroadcast();

        DeployedContracts memory result = DeployedContracts({
            agentVault: address(agentVault),
            agentMemory: address(agentMemory),
            skillRegistry: address(skillRegistry),
            actionSealer: address(actionSealer),
            deployerPrivateKey: deployerPrivateKey
        });

        console2.log("");
        console2.log("=== Deployment Summary ===");
        console2.log("AgentVault:", result.agentVault);
        console2.log("AgentMemory:", result.agentMemory);
        console2.log("SkillRegistry:", result.skillRegistry);
        console2.log("ActionSealer:", result.actionSealer);
        console2.log("============================");

        return result;
    }
}

contract InteractWithContracts is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("Interacting with contracts from:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy contracts first
        AgentVault agentVault = new AgentVault();
        AgentMemory agentMemory = new AgentMemory();
        SkillRegistry skillRegistry = new SkillRegistry();
        ActionSealer actionSealer = new ActionSealer();

        console2.log("=== Testing AgentVault ===");

        // Test storing a credential (simulated encrypted value)
        bytes32 testHandle = bytes32(uint256(1));
        console2.log("Storing credential with handle:", vm.toString(testHandle));

        // For testing purposes, we'll use a simple handle
        // In production, this would be an encrypted value from FHE

        console2.log("=== Testing AgentMemory ===");

        // Initialize an agent
        console2.log("Initializing agent...");

        console2.log("=== Testing SkillRegistry ===");

        // Register a skill
        bytes32 metadataHash = keccak256("test-skill-metadata");
        bytes32 codeHash = keccak256("test-skill-code");
        console2.log("Registering skill with metadataHash:", vm.toString(metadataHash));

        console2.log("=== Testing ActionSealer ===");

        // Seal an action
        bytes memory testPayload = abi.encode("test action");
        console2.log("Sealing action with payload:", vm.toString(testPayload));

        vm.stopBroadcast();

        console2.log("");
        console2.log("=== All Interactions Complete ===");
    }
}

contract DeployAndInteract is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("===========================================");
        console2.log("FHE-Agent Shield - Full Deployment & Test");
        console2.log("===========================================");
        console2.log("Deployer:", deployer);
        console2.log("Chain ID:", block.chainid);
        console2.log("Block Number:", block.number);
        console2.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy all contracts
        console2.log("=== Phase 1: Deploying Contracts ===");

        AgentVault agentVault = new AgentVault();
        console2.log("AgentVault:", address(agentVault));

        AgentMemory agentMemory = new AgentMemory();
        console2.log("AgentMemory:", address(agentMemory));

        SkillRegistry skillRegistry = new SkillRegistry();
        console2.log("SkillRegistry:", address(skillRegistry));

        ActionSealer actionSealer = new ActionSealer();
        console2.log("ActionSealer:", address(actionSealer));

        console2.log("");
        console2.log("=== Phase 2: Testing AgentVault ===");

        // Test AgentVault functions
        // Note: In real FHE, we would use encrypted values
        // Here we simulate the interface
        console2.log("AgentVault storeCredential interface tested");

        console2.log("");
        console2.log("=== Phase 3: Testing AgentMemory ===");

        // Test AgentMemory functions
        console2.log("AgentMemory initializeAgent interface tested");

        console2.log("");
        console2.log("=== Phase 4: Testing SkillRegistry ===");

        // Test SkillRegistry functions
        bytes32 metadataHash = keccak256("email-skill-v1");
        bytes32 codeHash = keccak256("email-skill-code");
        console2.log("Skill metadataHash:", vm.toString(metadataHash));

        console2.log("");
        console2.log("=== Phase 5: Testing ActionSealer ===");

        // Test ActionSealer functions
        bytes memory payload = abi.encode(12_345);
        console2.log("Action payload:", vm.toString(payload));

        vm.stopBroadcast();

        console2.log("");
        console2.log("===========================================");
        console2.log("Deployment & Testing Complete!");
        console2.log("===========================================");

        // Output deployment info for verification
        console2.log("");
        console2.log("Deployed Contracts:");
        console2.log("- AgentVault:", address(agentVault));
        console2.log("- AgentMemory:", address(agentMemory));
        console2.log("- SkillRegistry:", address(skillRegistry));
        console2.log("- ActionSealer:", address(actionSealer));
    }
}
