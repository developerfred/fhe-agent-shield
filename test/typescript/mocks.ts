/**
 * Mock FHE Client for testing OpenClaw integration
 * Simulates the FHE client behavior without requiring actual Fhenix network
 */

import type { EncryptedValue, Permit, ApiResponse } from '../../src/utils/types';

let mockHandleCounter = 0;

export function resetMockHandleCounter() {
  mockHandleCounter = 0;
}

export function generateMockHandle(data?: string): string {
  mockHandleCounter++;
  const dataHash = data ? Math.abs(hashString(data)).toString(16) : '';
  return `0x${mockHandleCounter.toString(16).padStart(64 - dataHash.length, '0')}${dataHash}`;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

export class MockFHEClient {
  private encryptedData: Map<string, string> = new Map();
  private permissions: Map<string, boolean> = new Map();
  private nonces: Map<string, bigint> = new Map();

  async encryptForStorage(data: string): Promise<EncryptedValue> {
    const handle = generateMockHandle();
    this.encryptedData.set(handle, data);
    return { handle, type: 'euint256' };
  }

  async decryptFromStorage(handle: string, _permit?: Permit): Promise<ApiResponse<string>> {
    const data = this.encryptedData.get(handle);
    if (data === undefined) {
      return { success: false, error: 'Handle not found' };
    }
    return { success: true, data };
  }

  async encryptValue(value: bigint): Promise<EncryptedValue> {
    const handle = generateMockHandle();
    this.encryptedData.set(handle, value.toString());
    return { handle, type: 'euint256' };
  }

  async requestDecryption(handle: string, _permit?: Permit): Promise<ApiResponse<bigint>> {
    const data = this.encryptedData.get(handle);
    if (!data) {
      return { success: false, error: 'Handle not found' };
    }
    return { success: true, data: BigInt(data) };
  }

  async verifyPermission(permit: Permit): Promise<boolean> {
    if (permit.expiresAt < BigInt(Math.floor(Date.now() / 1000))) {
      return false;
    }
    return true;
  }

  async generatePermission(
    _signer: `0x${string}`,
    _user: `0x${string}`,
    _resource: `0x${string}`
  ): Promise<{ expiresAt: bigint; nonce: bigint }> {
    const resource = _resource;
    const currentNonce = this.nonces.get(resource) || 0n;
    this.nonces.set(resource, currentNonce + 1n);
    return {
      expiresAt: BigInt(Math.floor(Date.now() / 1000)) + 3600n,
      nonce: currentNonce,
    };
  }

  async callContract(_method: string, _params: any): Promise<any> {
    return generateMockHandle();
  }

  // Helper to set up test data
  setEncryptedData(handle: string, data: string) {
    this.encryptedData.set(handle, data);
  }

  getEncryptedData(handle: string): string | undefined {
    return this.encryptedData.get(handle);
  }

  clear() {
    this.encryptedData.clear();
    this.permissions.clear();
    this.nonces.clear();
    resetMockHandleCounter();
  }
}

// Global mock instance for tests
let globalMockClient: MockFHEClient | null = null;

export function getMockFHEClient(): MockFHEClient {
  if (!globalMockClient) {
    globalMockClient = new MockFHEClient();
  }
  return globalMockClient;
}

export function createMockPermit(
  overrides: Partial<Permit> = {}
): Permit {
  return {
    signer: '0x' + '11'.repeat(20) as `0x${string}`,
    user: '0x' + '22'.repeat(20) as `0x${string}`,
    resource: '0x' + '33'.repeat(20) as `0x${string}`,
    expiresAt: BigInt(Math.floor(Date.now() / 1000)) + 3600n,
    nonce: 0n,
    v: 27,
    r: '0x' + 'aa'.repeat(32),
    s: '0x' + 'bb'.repeat(32),
    ...overrides,
  };
}