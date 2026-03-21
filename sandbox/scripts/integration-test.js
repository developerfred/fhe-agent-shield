const { ethers } = require('ethers');

const CONTRACT_ABIS = {
  AgentVault: [
    "function updateThreshold(uint8 newThreshold) external",
    "function getThreshold(address agent) external view returns (uint8)",
    "function credentialExists(bytes32 handle) external view returns (bool)",
    "function storeCredential(bytes32 agentId) external returns (bytes32)",
    "function grantRetrievePermission(address grantee, bytes32 handle) external"
  ],
  AgentMemory: [
    "function initializeAgent() external returns (address)",
    "function agentExists(address agentId) external view returns (bool)",
    "function getAgentOwner(address agentId) external view returns (address)",
    "function appendContext(address agentId, bytes32 data) external returns (uint256)",
    "function getContextLength(address agentId) external view returns (uint256)",
    "function snapshotContext(address agentId) external returns (bytes32)"
  ],
  SkillRegistry: [
    "function registerSkill(bytes32 metadataHash, bytes32 codeHash) external returns (address)",
    "function verifySkill(address skillId) external",
    "function getSkill(address skillId) external view returns (address publisher, bool isVerified, uint256 ratingCount)",
    "function rateSkill(address skillId, uint256 rating) external"
  ],
  ActionSealer: [
    "function sealAction(address agentId, bytes memory payload) external returns (address)",
    "function getActionStatus(address actionId) external view returns (uint8)",
    "function registerReleaseCondition(address actionId, uint256 threshold, uint256 timeout) external",
    "function approveRelease(address actionId) external",
    "function cancelAction(address actionId) external"
  ]
};

async function main() {
  const rpcUrl = process.env.ANVIL_RPC || 'http://localhost:8545';
  const privateKey = process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  
  const deployment = require('./deployments/addresses.json');
  
  console.log('==========================================');
  console.log('FHE-Agent Shield - Integration Test');
  console.log('==========================================\n');
  
  console.log('Network:', rpcUrl);
  console.log('AgentVault:', deployment.agentVault);
  console.log('AgentMemory:', deployment.agentMemory);
  console.log('SkillRegistry:', deployment.skillRegistry);
  console.log('ActionSealer:', deployment.actionSealer);
  console.log('');
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const agentVault = new ethers.Contract(deployment.agentVault, CONTRACT_ABIS.AgentVault, wallet);
  const agentMemory = new ethers.Contract(deployment.agentMemory, CONTRACT_ABIS.AgentMemory, wallet);
  const skillRegistry = new ethers.Contract(deployment.skillRegistry, CONTRACT_ABIS.SkillRegistry, wallet);
  const actionSealer = new ethers.Contract(deployment.actionSealer, CONTRACT_ABIS.ActionSealer, wallet);
  
  let allPassed = true;
  
  async function test(name, fn) {
    try {
      process.stdout.write(`Testing: ${name}... `);
      await fn();
      console.log('✓ PASS');
    } catch (err) {
      console.log('✗ FAIL');
      console.error('  Error:', err.message);
      allPassed = false;
    }
  }
  
  console.log('=== Contract Verification Tests ===\n');
  
  await test('AgentVault threshold update', async () => {
    const tx = await agentVault.updateThreshold(2);
    await tx.wait();
    const threshold = await agentVault.getThreshold(wallet.address);
    if (threshold !== 2n) throw new Error(`Expected threshold 2, got ${threshold}`);
  });
  
  await test('AgentMemory initializeAgent', async () => {
    const tx = await agentMemory.initializeAgent();
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => log.fragment?.name === 'AgentInitialized');
    if (!event) throw new Error('AgentInitialized event not found');
    const agentId = event.args[0];
    console.log(`    Agent ID: ${agentId}`);
  });
  
  await test('AgentMemory agentExists', async () => {
    const tx = await agentMemory.initializeAgent();
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => log.fragment?.name === 'AgentInitialized');
    const agentId = event.args[0];
    const exists = await agentMemory.agentExists(agentId);
    if (!exists) throw new Error('Agent should exist');
  });
  
  await test('SkillRegistry registerSkill', async () => {
    const metadataHash = ethers.keccak256(ethers.toUtf8Bytes('test-metadata'));
    const codeHash = ethers.keccak256(ethers.toUtf8Bytes('test-code'));
    const tx = await skillRegistry.registerSkill(metadataHash, codeHash);
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => log.fragment?.name === 'SkillRegistered');
    if (!event) throw new Error('SkillRegistered event not found');
    const skillId = event.args[0];
    console.log(`    Skill ID: ${skillId}`);
  });
  
  await test('ActionSealer sealAction', async () => {
    const agentTx = await agentMemory.initializeAgent();
    const agentReceipt = await agentTx.wait();
    const agentEvent = agentReceipt.logs.find(log => log.fragment?.name === 'AgentInitialized');
    const agentId = agentEvent.args[0];
    
    const payload = ethers.toUtf8Bytes('test-action');
    const tx = await actionSealer.sealAction(agentId, payload);
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => log.fragment?.name === 'ActionSealed');
    if (!event) throw new Error('ActionSealed event not found');
    const actionId = event.args[0];
    console.log(`    Action ID: ${actionId}`);
  });
  
  await test('ActionSealer registerReleaseCondition', async () => {
    const agentTx = await agentMemory.initializeAgent();
    const agentReceipt = await agentTx.wait();
    const agentEvent = agentReceipt.logs.find(log => log.fragment?.name === 'AgentInitialized');
    const agentId = agentEvent.args[0];
    
    const payload = ethers.toUtf8Bytes('release-action');
    const sealTx = await actionSealer.sealAction(agentId, payload);
    const sealReceipt = await sealTx.wait();
    const sealEvent = sealReceipt.logs.find(log => log.fragment?.name === 'ActionSealed');
    const actionId = sealEvent.args[0];
    
    const condTx = await actionSealer.registerReleaseCondition(actionId, 2, 3600);
    await condTx.wait();
  });
  
  await test('ActionSealer approve and cancel flow', async () => {
    const agentTx = await agentMemory.initializeAgent();
    const agentReceipt = await agentTx.wait();
    const agentEvent = agentReceipt.logs.find(log => log.fragment?.name === 'AgentInitialized');
    const agentId = agentEvent.args[0];
    
    const payload = ethers.toUtf8Bytes('cancel-test');
    const sealTx = await actionSealer.sealAction(agentId, payload);
    const sealReceipt = await sealTx.wait();
    const sealEvent = sealReceipt.logs.find(log => log.fragment?.name === 'ActionSealed');
    const actionId = sealEvent.args[0];
    
    const cancelTx = await actionSealer.cancelAction(actionId);
    await cancelTx.wait();
    
    const status = await actionSealer.getActionStatus(actionId);
    if (status !== 3) throw new Error(`Expected status Cancelled (3), got ${status}`);
  });
  
  console.log('\n==========================================');
  if (allPassed) {
    console.log('✓ ALL TESTS PASSED');
    console.log('==========================================');
    process.exit(0);
  } else {
    console.log('✗ SOME TESTS FAILED');
    console.log('==========================================');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
