import type {
  FHEAgentMemoryProviderConfig,
  EncryptedAgentState,
  Snapshot,
  Permit,
  address,
} from '../utils/types';
import { getFHEClient } from '../hooks/useFHEClient';

export class FHEAgentMemoryProvider {
  private config: FHEAgentMemoryProviderConfig;
  private agentStates: Map<address, EncryptedAgentState> = new Map();
  private snapshots: Map<address, Snapshot[]> = new Map();

  constructor(config: FHEAgentMemoryProviderConfig) {
    this.config = config;
  }

  async initializeAgent(agentId: address): Promise<void> {
    const client = getFHEClient();
    await client.callContract('initializeAgent', { agentId });
    this.agentStates.set(agentId, {
      agentId,
      isInitialized: true,
      contextHandle: null,
      credentialCount: 0,
      lastActivity: new Date(),
    });
  }

  async appendContext(agentId: address, data: string): Promise<bigint> {
    const client = getFHEClient();
    const encrypted = await client.encryptForStorage(data);
    const newLength = await client.callContract('appendContext', {
      agentId,
      data: encrypted.handle,
    });
    const state = this.agentStates.get(agentId);
    if (state) {
      state.lastActivity = new Date();
      this.agentStates.set(agentId, state);
    }
    return newLength as bigint;
  }

  async getContext(agentId: address, permit: Permit): Promise<string> {
    const client = getFHEClient();
    const state = this.agentStates.get(agentId);
    if (!state?.contextHandle) {
      throw new Error('No context found for agent');
    }
    const result = await client.decryptFromStorage(state.contextHandle, permit);
    if (!result.success) {
      throw new Error(result.error || 'Decryption failed');
    }
    return result.data!;
  }

  async createSnapshot(agentId: address): Promise<Snapshot> {
    const client = getFHEClient();
    const snapshotId = await client.callContract('snapshotContext', { agentId });
    const snapshot: Snapshot = {
      id: snapshotId as address,
      agentId,
      contextLength: 0n,
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
    };
    const existing = this.snapshots.get(agentId) || [];
    existing.push(snapshot);
    this.snapshots.set(agentId, existing);
    return snapshot;
  }

  async restoreFromSnapshot(agentId: address, snapshotId: address): Promise<void> {
    const client = getFHEClient();
    await client.callContract('restoreFromSnapshot', { agentId, snapshotId });
  }

  async getSnapshots(agentId: address): Promise<Snapshot[]> {
    return this.snapshots.get(agentId) || [];
  }

  getAgentState(agentId: address): EncryptedAgentState | null {
    return this.agentStates.get(agentId) || null;
  }

  getConfig(): FHEAgentMemoryProviderConfig {
    return { ...this.config };
  }

  static async create(config: FHEAgentMemoryProviderConfig): Promise<FHEAgentMemoryProvider> {
    return new FHEAgentMemoryProvider(config);
  }
}
