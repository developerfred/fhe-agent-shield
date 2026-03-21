// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.25 <0.9.0;

import { Test } from "forge-std/src/Test.sol";
import { console2 } from "forge-std/src/console2.sol";
import { AgentVault } from "../../src/contracts/AgentVault.sol";
import { AgentMemory } from "../../src/contracts/AgentMemory.sol";
import { SkillRegistry } from "../../src/contracts/SkillRegistry.sol";
import { ActionSealer } from "../../src/contracts/ActionSealer.sol";

contract ForkTest is Test {
    uint256 constant FHENIX_RPC_THRESHOLD = 100_000 gwei;

    struct DeployedContracts {
        address agentVault;
        address agentMemory;
        address skillRegistry;
        address actionSealer;
    }

    function setUp() public {
        try vm.envString("FHENIX_RPC_URL") returns (string memory rpcUrl) {
            if (bytes(rpcUrl).length > 0) {
                vm.createSelectFork(rpcUrl);
                console2.log("Forked to Fhenix at block:", block.number);
            }
        } catch {
            console2.log("FHENIX_RPC_URL not set, running as local test");
        }
    }

    function testForkAgentVaultDeployment() public {
        if (block.number < 1) {
            console2.log("Not on fork, skipping");
            return;
        }

        AgentVault agentVault = new AgentVault();
        assertTrue(address(agentVault) != address(0));
        console2.log("AgentVault deployed at:", address(agentVault));
    }

    function testForkAgentMemoryDeployment() public {
        if (block.number < 1) {
            console2.log("Not on fork, skipping");
            return;
        }

        AgentMemory agentMemory = new AgentMemory();
        assertTrue(address(agentMemory) != address(0));
        console2.log("AgentMemory deployed at:", address(agentMemory));
    }

    function testForkSkillRegistryDeployment() public {
        if (block.number < 1) {
            console2.log("Not on fork, skipping");
            return;
        }

        SkillRegistry skillRegistry = new SkillRegistry();
        assertTrue(address(skillRegistry) != address(0));
        console2.log("SkillRegistry deployed at:", address(skillRegistry));
    }

    function testForkActionSealerDeployment() public {
        if (block.number < 1) {
            console2.log("Not on fork, skipping");
            return;
        }

        ActionSealer actionSealer = new ActionSealer();
        assertTrue(address(actionSealer) != address(0));
        console2.log("ActionSealer deployed at:", address(actionSealer));
    }

    function testForkCanReadChainId() public {
        uint256 chainId = block.chainid;
        console2.log("Chain ID:", chainId);
        assertTrue(chainId > 0);
    }

    function testForkCanReadBlockNumber() public {
        uint256 blockNum = block.number;
        console2.log("Block number:", blockNum);
        assertTrue(blockNum > 0);
    }
}
