// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.25 <0.9.0;

import { Script } from "forge-std/src/Script.sol";
import { console2 } from "forge-std/src/console2.sol";
import { AgentVault } from "../src/contracts/AgentVault.sol";
import { AgentMemory } from "../src/contracts/AgentMemory.sol";
import { SkillRegistry } from "../src/contracts/SkillRegistry.sol";
import { ActionSealer } from "../src/contracts/ActionSealer.sol";
import { ExampleToken } from "../src/FHERC20.sol";

contract Deploy is Script {
    struct DeployedContracts {
        address agentVault;
        address agentMemory;
        address skillRegistry;
        address actionSealer;
        address exampleToken;
        uint256 deployBlock;
    }

    function run() public returns (DeployedContracts memory) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("Deployer address:", deployer);
        console2.log("Deploying to Fhenix testnet...");

        vm.startBroadcast(deployerPrivateKey);

        AgentVault agentVault = new AgentVault();
        console2.log("AgentVault deployed at:", address(agentVault));

        AgentMemory agentMemory = new AgentMemory();
        console2.log("AgentMemory deployed at:", address(agentMemory));

        SkillRegistry skillRegistry = new SkillRegistry();
        console2.log("SkillRegistry deployed at:", address(skillRegistry));

        ActionSealer actionSealer = new ActionSealer();
        console2.log("ActionSealer deployed at:", address(actionSealer));

        ExampleToken exampleToken = new ExampleToken("FHE Agent Token", "FHET", 1000000);
        console2.log("ExampleToken deployed at:", address(exampleToken));

        vm.stopBroadcast();

        DeployedContracts memory deployed = DeployedContracts({
            agentVault: address(agentVault),
            agentMemory: address(agentMemory),
            skillRegistry: address(skillRegistry),
            actionSealer: address(actionSealer),
            exampleToken: address(exampleToken),
            deployBlock: block.number
        });

        console2.log("");
        console2.log("=== Deployment Summary ===");
        console2.log("AgentVault:", deployed.agentVault);
        console2.log("AgentMemory:", deployed.agentMemory);
        console2.log("SkillRegistry:", deployed.skillRegistry);
        console2.log("ActionSealer:", deployed.actionSealer);
        console2.log("ExampleToken:", deployed.exampleToken);
        console2.log("DeployBlock:", deployed.deployBlock);

        return deployed;
    }
}
