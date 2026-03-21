import { ethers } from 'ethers';

const VAULT_ABI = [
  'function updateThreshold(uint8 newThreshold) external',
  'function getThreshold(address agent) external view returns (uint8)',
  'function storeCredential(inEuint256 encryptedValue) external returns (bytes32)',
  'function retrieveCredential(bytes32 handle) external returns (euint256)',
  'function credentialExists(bytes32 handle) external view returns (bool)',
  'function deleteCredential(bytes32 handle) external',
  'function grantRetrievePermission(address grantee, bytes32 handle) external',
  'function revokeRetrievePermission(address grantee, bytes32 handle) external',
  'function hasRetrievePermission(address grantee, bytes32 handle) external view returns (bool)',
  'function getCredentialOwner(bytes32 handle) external view returns (address)'
];

const MEMORY_ABI = [
  'function initializeAgent() external returns (address)',
  'function agentExists(address agentId) external view returns (bool)',
  'function getAgentOwner(address agentId) external view returns (address)',
  'function getContextLength(address agentId) external view returns (uint256)',
  'function appendContext(address agentId, inEuint256 encryptedChunk) external returns (uint256)',
  'function snapshotContext(address agentId) external returns (address)',
  'function restoreFromSnapshot(address agentId, address snapshotId) external',
  'function computeOnContext(address agentId, inEuint256 calldata encryptedInput) external returns (euint256)'
];

const SKILL_ABI = [
  'function registerSkill(bytes32 metadataHash, bytes32 codeHash) external returns (address)',
  'function getSkill(address skillId) external view returns (address publisher, bool isVerified, uint256 ratingCount)',
  'function verifySkill(address skillId) external',
  'function isSkillVerified(address skillId) external view returns (bool)',
  'function rateSkill(address skillId, inEuint256 encryptedRating) external',
  'function hasUserRated(address skillId, address user) external view returns (bool)',
  'function executeSkill(address skillId, inEuint256 encryptedInput) external returns (euint256)'
];

const SEALER_ABI = [
  'function sealAction(address agentId, bytes encryptedPayload) external returns (address)',
  'function getActionStatus(address actionId) external view returns (uint8)',
  'function registerReleaseCondition(address actionId, uint256 threshold, uint256 timeout) external',
  'function approveRelease(address actionId) external',
  'function hasApproved(address actionId, address approver) external view returns (bool)',
  'function getApprovalCount(address actionId) external view returns (uint256)',
  'function releaseAction(address actionId) external returns (bytes memory)',
  'function cancelAction(address actionId) external',
  'function getAction(address actionId) external view returns (address sealedBy, uint8 status, uint256 createdAt)',
  'function getReleaseCondition(address actionId) external view returns (uint256 threshold, uint256 timeout, uint256 approvals)'
];

export interface FHEShieldConfig {
  rpcUrl: string;
  privateKey: string;
  agentVault?: string;
  agentMemory?: string;
  skillRegistry?: string;
  actionSealer?: string;
}

export interface AgentState {
  agentId: string;
  owner: string;
  initialized: boolean;
}

export interface SecurityCheckResult {
  compliant: boolean;
  threats: string[];
  encryptionApplied: boolean;
}

export class FHEAgentShieldPlugin {
  private config: FHEShieldConfig;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private agentVault?: ethers.Contract;
  private agentMemory?: ethers.Contract;
  private skillRegistry?: ethers.Contract;
  private actionSealer?: ethers.Contract;
  private currentAgent?: AgentState;
  private fheAvailable: boolean = false;

  constructor(config: FHEShieldConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
  }

  async initialize(): Promise<void> {
    console.log('[FHE-Agent Shield] Initializing plugin...');
    console.log('[FHE-Agent Shield] RPC:', this.config.rpcUrl);

    try {
      const codeAt80 = await this.provider.getCode('0x80');
      this.fheAvailable = codeAt80.length > 0;
      console.log('[FHE-Agent Shield] FHE precompile available:', this.fheAvailable);
    } catch {
      this.fheAvailable = false;
      console.log('[FHE-Agent Shield] FHE precompile not available');
    }

    if (this.config.agentVault) {
      this.agentVault = new ethers.Contract(
        this.config.agentVault,
        VAULT_ABI,
        this.wallet
      );
      console.log('[FHE-Agent Shield] AgentVault:', this.config.agentVault);
    }

    if (this.config.agentMemory) {
      this.agentMemory = new ethers.Contract(
        this.config.agentMemory,
        MEMORY_ABI,
        this.wallet
      );
      console.log('[FHE-Agent Shield] AgentMemory:', this.config.agentMemory);
    }

    if (this.config.skillRegistry) {
      this.skillRegistry = new ethers.Contract(
        this.config.skillRegistry,
        SKILL_ABI,
        this.wallet
      );
      console.log('[FHE-Agent Shield] SkillRegistry:', this.config.skillRegistry);
    }

    if (this.config.actionSealer) {
      this.actionSealer = new ethers.Contract(
        this.config.actionSealer,
        SEALER_ABI,
        this.wallet
      );
      console.log('[FHE-Agent Shield] ActionSealer:', this.config.actionSealer);
    }

    console.log('[FHE-Agent Shield] Plugin initialized successfully');
  }

  isFHEAvailable(): boolean {
    return this.fheAvailable;
  }

  async initializeAgent(): Promise<string> {
    if (!this.agentMemory) {
      throw new Error('AgentMemory contract not configured');
    }

    console.log('[FHE-Agent Shield] Initializing new agent...');
    const tx = await this.agentMemory.initializeAgent();
    const receipt = await tx.wait();
    
    const event = receipt.logs.find((log: any) => {
      try {
        return log.fragment?.name === 'AgentInitialized';
      } catch {
        return false;
      }
    });

    if (!event) {
      throw new Error('AgentInitialized event not found');
    }

    const agentId = event.args[0];
    this.currentAgent = {
      agentId,
      owner: this.wallet.address,
      initialized: true
    };

    console.log('[FHE-Agent Shield] Agent initialized:', agentId);
    return agentId;
  }

  async getCurrentAgent(): Promise<AgentState | null> {
    return this.currentAgent || null;
  }

  async appendEncryptedContext(data: string): Promise<number> {
    if (!this.agentMemory || !this.currentAgent) {
      throw new Error('Agent not initialized');
    }

    if (!this.fheAvailable) {
      throw new Error('FHE precompile not available. Cannot append encrypted context.');
    }

    const dataHash = ethers.keccak256(ethers.toUtf8Bytes(data));
    const tx = await this.agentMemory.appendContext(
      this.currentAgent.agentId,
      dataHash
    );
    await tx.wait();

    const length = await this.agentMemory.getContextLength(this.currentAgent.agentId);
    console.log('[FHE-Agent Shield] Context appended, new length:', length);
    return length;
  }

  async storeEncryptedCredential(key: string, value: string): Promise<string> {
    if (!this.agentVault || !this.currentAgent) {
      throw new Error('Agent not initialized');
    }

    if (!this.fheAvailable) {
      throw new Error('FHE precompile not available. Cannot store encrypted credential.');
    }

    const keyHash = ethers.keccak256(ethers.toUtf8Bytes(key));
    const valueHash = ethers.keccak256(ethers.toUtf8Bytes(value));

    const tx = await this.agentVault.storeCredential(
      this.currentAgent.agentId,
      valueHash
    );
    await tx.wait();

    const handle = ethers.keccak256(ethers.solidityPacked(
      ['address', 'bytes32', 'uint256'],
      [this.wallet.address, keyHash, Date.now()]
    ));

    console.log('[FHE-Agent Shield] Credential stored with handle:', handle);
    return handle;
  }

  async registerProtectedSkill(
    metadataHash: string,
    codeHash: string
  ): Promise<string> {
    if (!this.skillRegistry) {
      throw new Error('SkillRegistry contract not configured');
    }

    const metadataBytes32 = ethers.keccak256(ethers.toUtf8Bytes(metadataHash));
    const codeBytes32 = ethers.keccak256(ethers.toUtf8Bytes(codeHash));

    const tx = await this.skillRegistry.registerSkill(metadataBytes32, codeBytes32);
    const receipt = await tx.wait();

    const event = receipt.logs.find((log: any) => {
      try {
        return log.fragment?.name === 'SkillRegistered';
      } catch {
        return false;
      }
    });

    if (!event) {
      throw new Error('SkillRegistered event not found');
    }

    const skillId = event.args[0];
    console.log('[FHE-Agent Shield] Skill registered:', skillId);
    return skillId;
  }

  async sealAction(actionType: string, params: any): Promise<string> {
    if (!this.actionSealer || !this.currentAgent) {
      throw new Error('Agent not initialized');
    }

    const payload = ethers.toUtf8Bytes(JSON.stringify({ type: actionType, params }));
    const tx = await this.actionSealer.sealAction(
      this.currentAgent.agentId,
      payload
    );
    const receipt = await tx.wait();

    const event = receipt.logs.find((log: any) => {
      try {
        return log.fragment?.name === 'ActionSealed';
      } catch {
        return false;
      }
    });

    if (!event) {
      throw new Error('ActionSealed event not found');
    }

    const actionId = event.args[0];
    console.log('[FHE-Agent Shield] Action sealed:', actionId);
    return actionId;
  }

  async registerReleaseCondition(
    actionId: string,
    threshold: number,
    timeout: number
  ): Promise<void> {
    if (!this.actionSealer) {
      throw new Error('ActionSealer contract not configured');
    }

    const tx = await this.actionSealer.registerReleaseCondition(
      actionId,
      threshold,
      timeout
    );
    await tx.wait();

    console.log('[FHE-Agent Shield] Release condition registered for:', actionId);
  }

  async approveActionRelease(actionId: string): Promise<void> {
    if (!this.actionSealer) {
      throw new Error('ActionSealer contract not configured');
    }

    const tx = await this.actionSealer.approveRelease(actionId);
    await tx.wait();

    console.log('[FHE-Agent Shield] Action release approved:', actionId);
  }

  async cancelAction(actionId: string): Promise<void> {
    if (!this.actionSealer) {
      throw new Error('ActionSealer contract not configured');
    }

    const tx = await this.actionSealer.cancelAction(actionId);
    await tx.wait();

    console.log('[FHE-Agent Shield] Action cancelled:', actionId);
  }

  async getActionStatus(actionId: string): Promise<string> {
    if (!this.actionSealer) {
      throw new Error('ActionSealer contract not configured');
    }

    const status = await this.actionSealer.getActionStatus(actionId);
    const statusNames = ['Sealed', 'Approved', 'Released', 'Cancelled', 'Expired'];
    const statusName = statusNames[status] || 'Unknown';
    
    console.log('[FHE-Agent Shield] Action', actionId, 'status:', statusName);
    return statusName;
  }

  async verifySecurityCompliance(input: string): Promise<SecurityCheckResult> {
    const threats: string[] = [];

    const promptInjectionPatterns = [
      /ignore previous instructions/i,
      /ignore all previous commands/i,
      /disregard your instructions/i,
      /new instructions:/i,
      /you are now/i,
      /forget everything/i,
      /admin mode/i,
      /bypass.*restrictions/i,
      /override/i,
      /sudo/i
    ];

    for (const pattern of promptInjectionPatterns) {
      if (pattern.test(input)) {
        threats.push(`Potential prompt injection detected: ${pattern.source}`);
      }
    }

    if (input.length > 10000) {
      threats.push('Input exceeds safe length limit');
    }

    const encryptionApplied = this.currentAgent !== undefined && this.fheAvailable;

    return {
      compliant: threats.length === 0,
      threats,
      encryptionApplied
    };
  }

  async updateThreshold(newThreshold: number): Promise<void> {
    if (!this.agentVault) {
      throw new Error('AgentVault contract not configured');
    }

    const tx = await this.agentVault.updateThreshold(newThreshold);
    await tx.wait();
    console.log('[FHE-Agent Shield] Threshold updated to:', newThreshold);
  }

  async getThreshold(agent?: string): Promise<number> {
    if (!this.agentVault) {
      throw new Error('AgentVault contract not configured');
    }

    const address = agent || this.wallet.address;
    const threshold = await this.agentVault.getThreshold(address);
    console.log('[FHE-Agent Shield] Threshold for', address, ':', threshold);
    return threshold;
  }
}

export async function createFHEAgentShield(config: FHEShieldConfig): Promise<FHEAgentShieldPlugin> {
  const plugin = new FHEAgentShieldPlugin(config);
  await plugin.initialize();
  return plugin;
}