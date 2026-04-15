// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.25 <0.9.0;

import { Test, console2 } from "forge-std/src/Test.sol";
import { AgentMemory } from "../src/contracts/AgentMemory.sol";
import { SkillRegistry } from "../src/contracts/SkillRegistry.sol";
import { ActionSealer } from "../src/contracts/ActionSealer.sol";

contract IntegrationTest is Test {
    AgentMemory public agentMemory;
    SkillRegistry public skillRegistry;
    ActionSealer public actionSealer;

    address public deployer;
    address public user1 = address(0x1);
    address public user2 = address(0x2);

    function setUp() public {
        string memory rpcUrl = vm.envOr("FHENIX_RPC_URL", string(""));

        if (bytes(rpcUrl).length > 0) {
            console2.log("Running on Fhenix testnet fork");
            uint256 forkId = vm.createFork(rpcUrl);
            vm.selectFork(forkId);
            console2.log("Block:", block.number, "Chain:", block.chainid);
        }

        deployer = msg.sender;

        vm.prank(deployer);
        agentMemory = new AgentMemory();
        console2.log("AgentMemory:", address(agentMemory));

        vm.prank(deployer);
        skillRegistry = new SkillRegistry();
        console2.log("SkillRegistry:", address(skillRegistry));

        vm.prank(deployer);
        actionSealer = new ActionSealer();
        console2.log("ActionSealer:", address(actionSealer));
    }

    function test_Integration_DeployAll() external {
        assertTrue(address(agentMemory) != address(0));
        assertTrue(address(skillRegistry) != address(0));
        assertTrue(address(actionSealer) != address(0));
        console2.log("PASS: All contracts deployed");
    }

    function test_Integration_AgentMemory() external {
        vm.prank(user1);
        address agentId = agentMemory.initializeAgent();
        assertTrue(agentId != address(0));
        assertEq(agentMemory.getAgentOwner(agentId), user1);
        assertEq(agentMemory.getContextLength(agentId), 0);
        console2.log("PASS: AgentMemory working");
    }

    function test_Integration_SkillRegistry() external {
        bytes32 metadataHash = keccak256("ipfs://QmSkill");
        bytes32 codeHash = keccak256("ipfs://QmSkillCode");

        vm.prank(user1);
        address skillId = skillRegistry.registerSkill(metadataHash, codeHash);
        assertTrue(skillId != address(0));

        (address publisher, bool isVerified, uint256 ratingCount) = skillRegistry.getSkill(skillId);
        assertEq(publisher, user1);
        assertFalse(isVerified);
        assertEq(ratingCount, 0);

        vm.prank(user1);
        skillRegistry.verifySkill(skillId);
        console2.log("PASS: SkillRegistry working");
    }

    function test_Integration_ActionSealer() external {
        address agentId = user1;
        bytes memory payload = abi.encode("transfer", 1000);

        vm.prank(user1);
        address actionId = actionSealer.sealAction(agentId, payload);
        assertTrue(actionId != address(0));

        ActionSealer.ActionStatus status = actionSealer.getActionStatus(actionId);
        assertTrue(status == ActionSealer.ActionStatus.Sealed);

        vm.prank(user1);
        actionSealer.cancelAction(actionId);
        assertTrue(actionSealer.getActionStatus(actionId) == ActionSealer.ActionStatus.Cancelled);
        console2.log("PASS: ActionSealer working");
    }

    function test_Integration_ActionSealer_ReleaseCondition() external {
        address agentId = user1;
        bytes memory payload = abi.encode("transfer", 1000);

        vm.prank(user1);
        address actionId = actionSealer.sealAction(agentId, payload);

        vm.prank(user1);
        actionSealer.registerReleaseCondition(actionId, 2, 3600);

        (uint8 threshold, uint256 timeout, bool isActive) = actionSealer.getReleaseCondition(actionId);
        assertEq(threshold, 2);
        assertEq(timeout, 3600);
        assertTrue(isActive);
        console2.log("PASS: Release condition working");
    }

    function test_Integration_FullWorkflow() external {
        console2.log("");
        console2.log("===========================================");
        console2.log("FHE-Agent Shield Full Workflow Demo");
        console2.log("===========================================");

        vm.prank(user1);
        address agentId = agentMemory.initializeAgent();
        console2.log("1. Agent initialized");

        bytes32 metadataHash = keccak256("ipfs://QmEmail");
        bytes32 codeHash = keccak256("ipfs://QmEmailCode");

        vm.prank(user1);
        address skillId = skillRegistry.registerSkill(metadataHash, codeHash);
        console2.log("2. Skill registered");

        vm.prank(user1);
        skillRegistry.verifySkill(skillId);
        console2.log("3. Skill verified");

        bytes memory payload = abi.encode("execute", skillId);
        vm.prank(user1);
        address actionId = actionSealer.sealAction(agentId, payload);
        console2.log("4. Action sealed");

        vm.prank(user1);
        actionSealer.registerReleaseCondition(actionId, 2, 3600);
        console2.log("5. Release condition set (2/3, 1hr)");

        console2.log("");
        console2.log("===========================================");
        console2.log("FULL WORKFLOW COMPLETE!");
        console2.log("===========================================");
        console2.log("");
        console2.log("Contracts:");
        console2.log("  AgentMemory:  ", address(agentMemory));
        console2.log("  SkillRegistry:", address(skillRegistry));
        console2.log("  ActionSealer: ", address(actionSealer));
    }
}
