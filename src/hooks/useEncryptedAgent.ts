import type {
  EncryptedAgentState,
  EncryptedContextResult,
  Snapshot,
  Permit,
  TransactionResult,
  address,
  bytes32,
} from '../utils/types';
import { getFHEClient, type FHEClient } from './useFHEClient';

export interface UseEncryptedAgentOptions {
  /** Agent ID */
  agentId: address;
  /** Auto-initialize if not exists */
  autoInit?: boolean;
  /** Callback when state changes */
  onStateChange?: (state: EncryptedAgentState) => void;
}

export interface UseEncryptedAgentReturn {
  state: EncryptedAgentState | null;
  isLoading: boolean;
  error: string | null;
  initializeAgent: () => Promise<TransactionResult>;
  encryptContext: (data: string) => Promise<bytes32>;
  appendContext: (handle: bytes32, encryptedData: bytes32) => Promise<EncryptedContextResult>;
  getDecryptedContext: (handle: bytes32, permit: Permit) => Promise<string>;
  snapshot: () => Promise<Snapshot>;
  restore: (snapshotId: address) => Promise<TransactionResult>;
  getSnapshot: (snapshotId: address) => Promise<Snapshot | null>;
}

export function useEncryptedAgent(options: UseEncryptedAgentOptions): UseEncryptedAgentReturn {
  const { agentId, autoInit = true } = options;
  const client = getFHEClient();

  let state: EncryptedAgentState | null = null;
  let isLoading = false;
  let error: string | null = null;

  async function checkAgentExists(): Promise<boolean> {
    return client.callContract('agentExists', { agentId }) as Promise<boolean>;
  }

  async function initializeAgent(): Promise<TransactionResult> {
    isLoading = true;
    error = null;
    try {
      const exists = await checkAgentExists();
      if (!exists && autoInit) {
        const tx = await client.callContract('initializeAgent', { agentId });
        state = {
          agentId,
          isInitialized: true,
          contextHandle: null,
          credentialCount: 0,
          lastActivity: new Date(),
        };
        return tx;
      }
      state = {
        agentId,
        isInitialized: exists,
        contextHandle: null,
        credentialCount: 0,
        lastActivity: null,
      };
      return { hash: '', blockNumber: 0n, events: [] };
    } catch (e) {
      error = String(e);
      throw e;
    } finally {
      isLoading = false;
    }
  }

  async function encryptContext(data: string): Promise<bytes32> {
    const encrypted = await client.encryptForStorage(data);
    return encrypted.handle as bytes32;
  }

  async function appendContext(handle: bytes32, encryptedData: bytes32): Promise<EncryptedContextResult> {
    const newLength = await client.callContract('appendContext', { agentId, data: encryptedData });
    state = state ? { ...state, lastActivity: new Date() } : null;
    return {
      newLength: newLength as bigint,
      transactionHash: '0x' + Math.random().toString(16).slice(2),
    };
  }

  async function getDecryptedContext(handle: bytes32, permit: Permit): Promise<string> {
    const result = await client.decryptFromStorage(handle, permit);
    if (!result.success) {
      throw new Error(result.error || 'Decryption failed');
    }
    return result.data!;
  }

  async function snapshot(): Promise<Snapshot> {
    const snapshotId = await client.callContract('snapshotContext', { agentId });
    return {
      id: snapshotId as address,
      agentId,
      contextLength: 0n,
      createdAt: BigInt(Math.floor(Date.now() / 1000)),
    };
  }

  async function restore(snapshotId: address): Promise<TransactionResult> {
    const tx = await client.callContract('restoreFromSnapshot', { agentId, snapshotId });
    return { hash: tx.hash || '', blockNumber: tx.blockNumber || 0n, events: [] };
  }

  async function getSnapshot(snapshotId: address): Promise<Snapshot | null> {
    try {
      const snapshot = await client.callContract('getSnapshot', { agentId, snapshotId });
      return snapshot as Snapshot;
    } catch {
      return null;
    }
  }

  return {
    get state() {
      return state;
    },
    get isLoading() {
      return isLoading;
    },
    get error() {
      return error;
    },
    initializeAgent,
    encryptContext,
    appendContext,
    getDecryptedContext,
    snapshot,
    restore,
    getSnapshot,
  };
}
