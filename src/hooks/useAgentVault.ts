import type {
  Credential,
  Permit,
  TransactionResult,
  address,
  bytes32,
} from '../utils/types';
import { getFHEClient, type FHEClient } from './useFHEClient';

export interface UseAgentVaultReturn {
  storeCredential: (agentId: address, encryptedValue: bytes32) => Promise<bytes32>;
  requestCredential: (handle: bytes32, permit: Permit) => Promise<bytes32>;
  decryptCredential: (handle: bytes32, permit: Permit) => Promise<string>;
  updatePermissions: (agentId: address, grantee: address, handle: bytes32) => Promise<TransactionResult>;
  getCredentialHandle: (agentId: address) => Promise<bytes32 | null>;
  getCredentialOwner: (handle: bytes32) => Promise<address | null>;
  deleteCredential: (handle: bytes32) => Promise<TransactionResult>;
  grantRetrievePermission: (grantee: address, handle: bytes32) => Promise<TransactionResult>;
  revokeRetrievePermission: (grantee: address, handle: bytes32) => Promise<TransactionResult>;
  getThreshold: (agent: address) => Promise<bigint>;
  updateThreshold: (agent: address, newThreshold: bigint) => Promise<TransactionResult>;
}

export function useAgentVault(): UseAgentVaultReturn {
  const client = getFHEClient();

  async function storeCredential(agentId: address, encryptedValue: bytes32): Promise<bytes32> {
    const handle = await client.callContract('storeCredential', { agentId, encryptedValue });
    return handle as bytes32;
  }

  async function requestCredential(handle: bytes32, permit: Permit): Promise<bytes32> {
    const result = await client.callContract('retrieveCredential', { handle, permit });
    return result as bytes32;
  }

  async function decryptCredential(handle: bytes32, permit: Permit): Promise<string> {
    const result = await client.decryptFromStorage(handle, permit);
    if (!result.success) {
      throw new Error(result.error || 'Decryption failed');
    }
    return result.data!;
  }

  async function updatePermissions(
    agentId: address,
    grantee: address,
    handle: bytes32
  ): Promise<TransactionResult> {
    const tx = await client.callContract('grantRetrievePermission', { grantee, handle });
    return { hash: tx.hash || '', blockNumber: tx.blockNumber || 0n, events: [] };
  }

  async function getCredentialHandle(agentId: address): Promise<bytes32 | null> {
    try {
      const handle = await client.callContract('getCredentialHandle', { agentId });
      return handle as bytes32;
    } catch {
      return null;
    }
  }

  async function getCredentialOwner(handle: bytes32): Promise<address | null> {
    try {
      const owner = await client.callContract('getCredentialOwner', { handle });
      return owner as address;
    } catch {
      return null;
    }
  }

  async function deleteCredential(handle: bytes32): Promise<TransactionResult> {
    const tx = await client.callContract('deleteCredential', { handle });
    return { hash: tx.hash || '', blockNumber: tx.blockNumber || 0n, events: [] };
  }

  async function grantRetrievePermission(
    grantee: address,
    handle: bytes32
  ): Promise<TransactionResult> {
    const tx = await client.callContract('grantRetrievePermission', { grantee, handle });
    return { hash: tx.hash || '', blockNumber: tx.blockNumber || 0n, events: [] };
  }

  async function revokeRetrievePermission(
    grantee: address,
    handle: bytes32
  ): Promise<TransactionResult> {
    const tx = await client.callContract('grantRetrievePermission', { grantee, handle });
    return { hash: tx.hash || '', blockNumber: tx.blockNumber || 0n, events: [] };
  }

  async function getThreshold(agent: address): Promise<bigint> {
    return client.callContract('getThreshold', { agent }) as Promise<bigint>;
  }

  async function updateThreshold(
    agent: address,
    newThreshold: bigint
  ): Promise<TransactionResult> {
    const tx = await client.callContract('updateThreshold', { agent, newThreshold });
    return { hash: tx.hash || '', blockNumber: tx.blockNumber || 0n, events: [] };
  }

  return {
    storeCredential,
    requestCredential,
    decryptCredential,
    updatePermissions,
    getCredentialHandle,
    getCredentialOwner,
    deleteCredential,
    grantRetrievePermission,
    revokeRetrievePermission,
    getThreshold,
    updateThreshold,
  };
}
