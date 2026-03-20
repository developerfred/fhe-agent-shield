import { describe, it, expect, beforeEach } from 'vitest';
import { MockFHEClient, getMockFHEClient, createMockPermit, resetMockHandleCounter } from './mocks';

const TEST_MEMORY_ADDRESS = '0x' + '11'.repeat(20) as `0x${string}`;
const TEST_VAULT_ADDRESS = '0x' + '22'.repeat(20) as `0x${string}`;
const TEST_AGENT_ID = '0x' + '33'.repeat(20) as `0x${string}`;

interface EncryptedAgentState {
  agentId: `0x${string}`;
  isInitialized: boolean;
  contextHandle: string | null;
  credentialCount: number;
  lastActivity: Date | null;
}

interface Snapshot {
  id: `0x${string}`;
  agentId: `0x${string}`;
  contextLength: bigint;
  createdAt: bigint;
}

interface FHEAgentMemoryProviderConfig {
  contractAddress: `0x${string}`;
  thresholdNetworkUrl: string;
  minApprovals: bigint;
}

class FHEAgentMemoryProvider {
  private config: FHEAgentMemoryProviderConfig;
  private agentStates: Map<string, EncryptedAgentState> = new Map();
  private snapshots: Map<string, Snapshot[]> = new Map();
  private contextLengths: Map<string, bigint> = new Map();
  private fheClient: MockFHEClient;

  constructor(config: FHEAgentMemoryProviderConfig, fheClient: MockFHEClient) {
    this.config = config;
    this.fheClient = fheClient;
  }

  async initializeAgent(agentId: `0x${string}`): Promise<void> {
    const encrypted = await this.fheClient.encryptForStorage('initialized');
    this.agentStates.set(agentId, {
      agentId,
      isInitialized: true,
      contextHandle: encrypted.handle,
      credentialCount: 0,
      lastActivity: new Date(),
    });
    this.contextLengths.set(agentId, 0n);
  }

  async appendContext(agentId: `0x${string}`, data: string): Promise<bigint> {
    const state = this.agentStates.get(agentId);
    if (!state?.isInitialized) {
      throw new Error('Agent not initialized');
    }

    const encrypted = await this.fheClient.encryptForStorage(data);
    state.contextHandle = encrypted.handle;
    state.lastActivity = new Date();

    const currentLength = this.contextLengths.get(agentId) || 0n;
    const newLength = currentLength + 1n;
    this.contextLengths.set(agentId, newLength);
    return newLength;
  }

  async getContext(agentId: `0x${string}`, _permit?: any): Promise<string> {
    const state = this.agentStates.get(agentId);
    if (!state?.contextHandle) {
      throw new Error('No context found for agent');
    }

    const decrypted = await this.fheClient.decryptFromStorage(state.contextHandle);
    if (!decrypted.success) {
      throw new Error('Decryption failed');
    }
    return decrypted.data as string;
  }

  async createSnapshot(agentId: `0x${string}`): Promise<Snapshot> {
    const state = this.agentStates.get(agentId);
    if (!state?.isInitialized) {
      throw new Error('Agent not initialized');
    }

    const contextLength = this.contextLengths.get(agentId) || 0n;
    const snapshotId = ('0x' + Math.random().toString(16).slice(2) + agentId.slice(2)) as `0x${string}`;

    const snapshot: Snapshot = {
      id: snapshotId,
      agentId,
      contextLength,
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
    };

    const existing = this.snapshots.get(agentId) || [];
    existing.push(snapshot);
    this.snapshots.set(agentId, existing);

    return snapshot;
  }

  async restoreFromSnapshot(agentId: `0x${string}`, snapshotId: `0x${string}`): Promise<void> {
    const snapshots = this.snapshots.get(agentId);
    const snapshot = snapshots?.find(s => s.id === snapshotId);

    if (!snapshot) {
      throw new Error('Snapshot not found');
    }

    const state = this.agentStates.get(agentId);
    if (state) {
      state.lastActivity = new Date();
    }
  }

  async getSnapshots(agentId: `0x${string}`): Promise<Snapshot[]> {
    return this.snapshots.get(agentId) || [];
  }

  async getContextLength(agentId: `0x${string}`): Promise<bigint> {
    return this.contextLengths.get(agentId) || 0n;
  }

  getAgentState(agentId: `0x${string}`): EncryptedAgentState | null {
    return this.agentStates.get(agentId) || null;
  }

  getConfig(): FHEAgentMemoryProviderConfig {
    return { ...this.config };
  }

  clear(): void {
    this.agentStates.clear();
    this.snapshots.clear();
    this.contextLengths.clear();
  }
}

let mockClient: MockFHEClient;

describe('FHEAgentMemoryProvider', () => {
  beforeEach(() => {
    mockClient = getMockFHEClient();
    mockClient.clear();
  });

  describe('initialization', () => {
    it('should initialize an agent', async () => {
      const provider = new FHEAgentMemoryProvider({
        contractAddress: TEST_MEMORY_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        minApprovals: 2n,
      }, mockClient);

      await provider.initializeAgent(TEST_AGENT_ID);

      const state = provider.getAgentState(TEST_AGENT_ID);
      expect(state).not.toBeNull();
      expect(state?.isInitialized).toBe(true);
      expect(state?.agentId).toBe(TEST_AGENT_ID);
    });

    it('should track initialization timestamp', async () => {
      const provider = new FHEAgentMemoryProvider({
        contractAddress: TEST_MEMORY_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        minApprovals: 2n,
      }, mockClient);

      await provider.initializeAgent(TEST_AGENT_ID);

      const state = provider.getAgentState(TEST_AGENT_ID);
      expect(state?.lastActivity).toBeInstanceOf(Date);
    });
  });

  describe('context operations', () => {
    it('should append context to initialized agent', async () => {
      const provider = new FHEAgentMemoryProvider({
        contractAddress: TEST_MEMORY_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        minApprovals: 2n,
      }, mockClient);

      await provider.initializeAgent(TEST_AGENT_ID);
      const newLength = await provider.appendContext(TEST_AGENT_ID, 'context data');

      expect(newLength).toBeGreaterThan(0n);
    });

    it('should throw when appending to uninitialized agent', async () => {
      const provider = new FHEAgentMemoryProvider({
        contractAddress: TEST_MEMORY_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        minApprovals: 2n,
      }, mockClient);

      await expect(provider.appendContext(TEST_AGENT_ID, 'data')).rejects.toThrow('Agent not initialized');
    });

    it('should retrieve encrypted context', async () => {
      const provider = new FHEAgentMemoryProvider({
        contractAddress: TEST_MEMORY_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        minApprovals: 2n,
      }, mockClient);

      const testData = 'sensitive agent context';
      await provider.initializeAgent(TEST_AGENT_ID);
      await provider.appendContext(TEST_AGENT_ID, testData);

      const retrieved = await provider.getContext(TEST_AGENT_ID);
      expect(retrieved).toBe(testData);
    });

    it('should throw when getting context for uninitialized agent', async () => {
      const provider = new FHEAgentMemoryProvider({
        contractAddress: TEST_MEMORY_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        minApprovals: 2n,
      }, mockClient);

      await expect(provider.getContext(TEST_AGENT_ID)).rejects.toThrow('No context found');
    });
  });

  describe('snapshot operations', () => {
    it('should create snapshots', async () => {
      const provider = new FHEAgentMemoryProvider({
        contractAddress: TEST_MEMORY_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        minApprovals: 2n,
      }, mockClient);

      await provider.initializeAgent(TEST_AGENT_ID);
      await provider.appendContext(TEST_AGENT_ID, 'data1');
      const snapshot1 = await provider.createSnapshot(TEST_AGENT_ID);
      await provider.appendContext(TEST_AGENT_ID, 'data2');
      await provider.appendContext(TEST_AGENT_ID, 'data3');
      const snapshot2 = await provider.createSnapshot(TEST_AGENT_ID);

      const snapshots = await provider.getSnapshots(TEST_AGENT_ID);
      expect(snapshots.length).toBe(2);
      expect(snapshot1.contextLength).toBe(1n);
      expect(snapshot2.contextLength).toBe(3n);
    });

    it('should restore from snapshot', async () => {
      const provider = new FHEAgentMemoryProvider({
        contractAddress: TEST_MEMORY_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        minApprovals: 2n,
      }, mockClient);

      await provider.initializeAgent(TEST_AGENT_ID);
      await provider.appendContext(TEST_AGENT_ID, 'data1');
      const snapshot = await provider.createSnapshot(TEST_AGENT_ID);
      await provider.appendContext(TEST_AGENT_ID, 'data2');

      await provider.restoreFromSnapshot(TEST_AGENT_ID, snapshot.id);

      const snapshots = await provider.getSnapshots(TEST_AGENT_ID);
      expect(snapshots.length).toBe(1);
    });

    it('should throw when restoring non-existent snapshot', async () => {
      const provider = new FHEAgentMemoryProvider({
        contractAddress: TEST_MEMORY_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        minApprovals: 2n,
      }, mockClient);

      await provider.initializeAgent(TEST_AGENT_ID);

      await expect(provider.restoreFromSnapshot(TEST_AGENT_ID, '0x' + 'ff'.repeat(20))).rejects.toThrow('Snapshot not found');
    });

    it('should throw when snapshotting uninitialized agent', async () => {
      const provider = new FHEAgentMemoryProvider({
        contractAddress: TEST_MEMORY_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        minApprovals: 2n,
      }, mockClient);

      await expect(provider.createSnapshot(TEST_AGENT_ID)).rejects.toThrow('Agent not initialized');
    });
  });

  describe('context length tracking', () => {
    it('should track context length correctly', async () => {
      const provider = new FHEAgentMemoryProvider({
        contractAddress: TEST_MEMORY_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        minApprovals: 2n,
      }, mockClient);

      await provider.initializeAgent(TEST_AGENT_ID);

      let length = await provider.getContextLength(TEST_AGENT_ID);
      expect(length).toBe(0n);

      await provider.appendContext(TEST_AGENT_ID, 'chunk1');
      length = await provider.getContextLength(TEST_AGENT_ID);
      expect(length).toBe(1n);

      await provider.appendContext(TEST_AGENT_ID, 'chunk2');
      length = await provider.getContextLength(TEST_AGENT_ID);
      expect(length).toBe(2n);

      await provider.appendContext(TEST_AGENT_ID, 'chunk3');
      length = await provider.getContextLength(TEST_AGENT_ID);
      expect(length).toBe(3n);
    });

    it('should preserve context length across snapshots', async () => {
      const provider = new FHEAgentMemoryProvider({
        contractAddress: TEST_MEMORY_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        minApprovals: 2n,
      }, mockClient);

      await provider.initializeAgent(TEST_AGENT_ID);
      await provider.appendContext(TEST_AGENT_ID, 'data1');
      await provider.appendContext(TEST_AGENT_ID, 'data2');
      const snapshot = await provider.createSnapshot(TEST_AGENT_ID);

      expect(snapshot.contextLength).toBe(2n);
    });
  });

  describe('multi-agent isolation', () => {
    it('should isolate contexts between agents', async () => {
      const provider = new FHEAgentMemoryProvider({
        contractAddress: TEST_MEMORY_ADDRESS,
        thresholdNetworkUrl: 'https://test.example.com',
        minApprovals: 2n,
      }, mockClient);

      const agent1 = '0x' + '11'.repeat(20) as `0x${string}`;
      const agent2 = '0x' + '22'.repeat(20) as `0x${string}`;

      await provider.initializeAgent(agent1);
      await provider.appendContext(agent1, 'agent1 context');
      await provider.createSnapshot(agent1);

      await provider.initializeAgent(agent2);
      await provider.appendContext(agent2, 'agent2 context');
      await provider.createSnapshot(agent2);

      const snapshots1 = await provider.getSnapshots(agent1);
      const snapshots2 = await provider.getSnapshots(agent2);

      expect(snapshots1.length).toBe(1);
      expect(snapshots2.length).toBe(1);

      expect(snapshots1[0].contextLength).toBe(1n);
      expect(snapshots2[0].contextLength).toBe(1n);
    });
  });
});

describe('FHEAgentMemoryProvider Integration Scenarios', () => {
  beforeEach(() => {
    mockClient = getMockFHEClient();
    mockClient.clear();
  });

  it('should simulate agent memory workflow', async () => {
    const provider = new FHEAgentMemoryProvider({
      contractAddress: TEST_MEMORY_ADDRESS,
      thresholdNetworkUrl: 'https://test.example.com',
      minApprovals: 2n,
    }, mockClient);

    await provider.initializeAgent(TEST_AGENT_ID);

    await provider.appendContext(TEST_AGENT_ID, JSON.stringify({
      role: 'user',
      content: 'Schedule a meeting for tomorrow',
    }));

    await provider.appendContext(TEST_AGENT_ID, JSON.stringify({
      role: 'assistant',
      content: 'What time works for you?',
    }));

    const snapshot = await provider.createSnapshot(TEST_AGENT_ID);
    expect(snapshot.contextLength).toBe(2n);

    await provider.appendContext(TEST_AGENT_ID, JSON.stringify({
      role: 'user',
      content: '10 AM works',
    }));

    await provider.restoreFromSnapshot(TEST_AGENT_ID, snapshot.id);

    const length = await provider.getContextLength(TEST_AGENT_ID);
    expect(length).toBe(3n);
  });

  it('should demonstrate encrypted context preservation', async () => {
    const provider = new FHEAgentMemoryProvider({
      contractAddress: TEST_MEMORY_ADDRESS,
      thresholdNetworkUrl: 'https://test.example.com',
      minApprovals: 2n,
    }, mockClient);

    const sensitiveContext = 'API_KEY=sk-secret-12345 USER_DATA=JohnDoe';

    await provider.initializeAgent(TEST_AGENT_ID);
    await provider.appendContext(TEST_AGENT_ID, sensitiveContext);

    const retrieved = await provider.getContext(TEST_AGENT_ID);
    expect(retrieved).toBe(sensitiveContext);
  });
});