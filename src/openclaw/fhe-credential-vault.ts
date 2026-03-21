import type {
  FHECredentialVaultConfig,
  Credential,
  Permit,
  address,
  bytes32,
} from '../utils/types';
import { getFHEClient } from '../hooks/useFHEClient';

export class FHECredentialVault {
  private config: FHECredentialVaultConfig;
  private credentialHandles: Map<address, Map<string, bytes32>> = new Map();

  constructor(config: FHECredentialVaultConfig) {
    this.config = config;
  }

  async storeCredential(agentId: address, key: string, value: string): Promise<bytes32> {
    const client = getFHEClient();
    const encrypted = await client.encryptForStorage(value);
    const handle = await client.callContract('storeCredential', {
      agentId,
      encryptedValue: encrypted.handle,
    });
    this.setHandle(agentId, key, handle as bytes32);
    return handle as bytes32;
  }

  async retrieveCredential(
    agentId: address,
    key: string,
    permit: Permit
  ): Promise<string> {
    const handle = this.getHandle(agentId, key);
    if (!handle) {
      throw new Error('Credential not found');
    }
    const client = getFHEClient();
    const result = await client.decryptFromStorage(handle, permit);
    if (!result.success) {
      throw new Error(result.error || 'Decryption failed');
    }
    return result.data!;
  }

  async requestCredentialAccess(
    agentId: address,
    key: string,
    permit: Permit
  ): Promise<bytes32> {
    const handle = this.getHandle(agentId, key);
    if (!handle) {
      throw new Error('Credential not found');
    }
    const client = getFHEClient();
    return client.requestCredential(handle, permit) as Promise<bytes32>;
  }

  async grantAccess(grantee: address, agentId: address, key: string): Promise<void> {
    const handle = this.getHandle(agentId, key);
    if (!handle) {
      throw new Error('Credential not found');
    }
    const client = getFHEClient();
    await client.callContract('grantRetrievePermission', { grantee, handle });
  }

  async revokeAccess(grantee: address, agentId: address, key: string): Promise<void> {
    const handle = this.getHandle(agentId, key);
    if (!handle) {
      throw new Error('Credential not found');
    }
    const client = getFHEClient();
    await client.callContract('grantRetrievePermission', { grantee, handle });
  }

  async deleteCredential(agentId: address, key: string): Promise<void> {
    const handle = this.getHandle(agentId, key);
    if (!handle) {
      throw new Error('Credential not found');
    }
    const client = getFHEClient();
    await client.callContract('deleteCredential', { handle });
    this.removeHandle(agentId, key);
  }

  async rotateCredential(agentId: address, key: string, newValue: string): Promise<bytes32> {
    await this.deleteCredential(agentId, key);
    return this.storeCredential(agentId, key, newValue);
  }

  hasCredential(agentId: address, key: string): boolean {
    return this.getHandle(agentId, key) !== null;
  }

  getAllKeys(agentId: address): string[] {
    const agentCreds = this.credentialHandles.get(agentId);
    if (!agentCreds) return [];
    return Array.from(agentCreds.keys());
  }

  getCredentialCount(agentId: address): number {
    return this.getAllKeys(agentId).length;
  }

  private getHandle(agentId: address, key: string): bytes32 | null {
    const agentCreds = this.credentialHandles.get(agentId);
    if (!agentCreds) return null;
    return agentCreds.get(key) || null;
  }

  private setHandle(agentId: address, key: string, handle: bytes32): void {
    let agentCreds = this.credentialHandles.get(agentId);
    if (!agentCreds) {
      agentCreds = new Map();
      this.credentialHandles.set(agentId, agentCreds);
    }
    agentCreds.set(key, handle);
  }

  private removeHandle(agentId: address, key: string): void {
    const agentCreds = this.credentialHandles.get(agentId);
    if (agentCreds) {
      agentCreds.delete(key);
    }
  }

  getConfig(): FHECredentialVaultConfig {
    return { ...this.config };
  }

  static async create(config: FHECredentialVaultConfig): Promise<FHECredentialVault> {
    return new FHECredentialVault(config);
  }
}
