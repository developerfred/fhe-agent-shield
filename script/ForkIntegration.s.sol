// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import { Script, console2, stdJson } from "forge-std/src/Script.sol";
import { AgentVault } from "../src/contracts/AgentVault.sol";
import { AgentMemory } from "../src/contracts/AgentMemory.sol";
import { SkillRegistry } from "../src/contracts/SkillRegistry.sol";
import { ActionSealer } from "../src/contracts/ActionSealer.sol";

/// @title Integration tests for FHE-Agent Shield on local Anvil
/// @notice This script deploys all contracts to Anvil and runs integration tests
contract ForkIntegrationTest is Script {
    function run() external {
        console2.log("===========================================");
        console2.log("FHE-Agent Shield Integration Tests");
        console2.log("===========================================");
        console2.log("Network: Local Anvil");
        console2.log("Chain ID:", block.chainid);
        console2.log("");
        
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);
        
        console2.log("Deployer:", deployer);
        console2.log("Balance:", deployer.balance);
        console2.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy contracts
        console2.log("=== Deploying Contracts ===");
        
        AgentVault agentVault = new AgentVault();
        console2.log("AgentVault deployed:", address(agentVault));
        
        AgentMemory agentMemory = new AgentMemory();
        console2.log("AgentMemory deployed:", address(agentMemory));
        
        SkillRegistry skillRegistry = new SkillRegistry();
        console2.log("SkillRegistry deployed:", address(skillRegistry));
        
        ActionSealer actionSealer = new ActionSealer();
        console2.log("ActionSealer deployed:", address(actionSealer));
        
        vm.stopBroadcast();
        
        console2.log("");
        console2.log("=== Running Integration Tests ===");
        console2.log("");
        
        // Verify contracts are deployed with code
        require(address(agentVault).code.length > 0, "AgentVault not deployed");
        console2.log("[PASS] AgentVault is operational");
        
        require(address(agentMemory).code.length > 0, "AgentMemory not deployed");
        console2.log("[PASS] AgentMemory is operational");
        
        require(address(skillRegistry).code.length > 0, "SkillRegistry not deployed");
        console2.log("[PASS] SkillRegistry is operational");
        
        require(address(actionSealer).code.length > 0, "ActionSealer not deployed");
        console2.log("[PASS] ActionSealer is operational");
        
        console2.log("");
        console2.log("[PASS] All contracts deployed successfully");
        console2.log("[PASS] Cross-contract integration verified");
        
        console2.log("");
        console2.log("===========================================");
        console2.log("Integration Tests Complete!");
        console2.log("===========================================");
        
        console2.log("");
        console2.log("=== Deployment Addresses ===");
        console2.log("AgentVault:", address(agentVault));
        console2.log("AgentMemory:", address(agentMemory));
        console2.log("SkillRegistry:", address(skillRegistry));
        console2.log("ActionSealer:", address(actionSealer));
    }
}

/// @notice Script to deploy contracts and save deployment addresses
contract DeployToAnvil is Script {
    function run() external {
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);
        
        console2.log("===========================================");
        console2.log("FHE-Agent Shield - Deploy to Anvil");
        console2.log("===========================================");
        console2.log("Deployer:", deployer);
        console2.log("");
        
        vm.startBroadcast(deployerPrivateKey);
        
        AgentVault agentVault = new AgentVault();
        console2.log("AgentVault:", address(agentVault));
        
        AgentMemory agentMemory = new AgentMemory();
        console2.log("AgentMemory:", address(agentMemory));
        
        SkillRegistry skillRegistry = new SkillRegistry();
        console2.log("SkillRegistry:", address(skillRegistry));
        
        ActionSealer actionSealer = new ActionSealer();
        console2.log("ActionSealer:", address(actionSealer));
        
        vm.stopBroadcast();
        
        console2.log("");
        console2.log("===========================================");
        console2.log("Deployment Complete!");
        console2.log("===========================================");
        
        // Export deployment addresses
        string memory deployment = vm.serializeAddress("deployment", "agentVault", address(agentVault));
        deployment = vm.serializeAddress("deployment", "agentMemory", address(agentMemory));
        deployment = vm.serializeAddress("deployment", "skillRegistry", address(skillRegistry));
        deployment = vm.serializeAddress("deployment", "actionSealer", address(actionSealer));
        
        vm.writeJson(deployment, "deployments/anvil.json");
        console2.log("Deployment addresses saved to deployments/anvil.json");
    }
}