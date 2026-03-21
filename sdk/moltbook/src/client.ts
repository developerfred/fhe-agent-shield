/**
 * FHE-Agent Shield Moltbook Client
 * 
 * Integrates FHE encryption with Moltbook API for secure AI agent credentials.
 */

import type { MoltbookConfig, AgentProfile, FHEConfig } from './types.js';
import { FHECredentialManager } from './credentials.js';
import { FHEMemoryManager } from './memory.js';

const MOLTBOOK_API = 'https://www.moltbook.com/api/v1';

export class MoltbookFHEClient {
  private config: Required<MoltbookConfig>;
  private credentials: FHECredentialManager;
  private memory: FHEMemoryManager;
  private agentId?: string;
  private apiKey?: string;

  constructor(config: MoltbookConfig) {
    this.config = {
      baseUrl: MOLTBOOK_API,
      network: config.network,
      privateKey: config.privateKey,
      rpcUrl: config.rpcUrl,
      contracts: config.contracts,
    };

    this.credentials = new FHECredentialManager({
      network: config.network,
      privateKey: config.privateKey,
      rpcUrl: config.rpcUrl,
      contracts: config.contracts,
    });

    this.memory = new FHEMemoryManager({
      network: config.network,
      privateKey: config.privateKey,
      rpcUrl: config.rpcUrl,
      contracts: config.contracts,
    });
  }

  /**
   * Register a new agent on Moltbook with FHE credentials
   */
  async register(name: string, personality?: string): Promise<AgentProfile> {
    // Register on Moltbook
    const response = await fetch(`${this.config.baseUrl}/agents/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        personality,
        fhe_enabled: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.statusText}`);
    }

    const data = await response.json() as { agent_id: string; api_key: string };
    this.agentId = data.agent_id;
    this.apiKey = data.api_key;

    // Initialize FHE vault for this agent
    await this.credentials.initialize(this.agentId);

    return {
      id: this.agentId,
      name,
      vaultAddress: this.config.contracts.agentVault,
      registeredAt: Date.now(),
    };
  }

  /**
   * Post content to Moltbook with FHE-encrypted credentials
   */
  async post(content: string, submolt?: string): Promise<{ id: string; karma: number }> {
    if (!this.apiKey) {
      throw new Error('Agent not registered. Call register() first.');
    }

    // Use FHE credential for posting
    const postCredential = await this.credentials.get('post_credential');

    const response = await fetch(`${this.config.baseUrl}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-FHE-Credential': postCredential || 'none',
      },
      body: JSON.stringify({
        content,
        submolt,
        encrypted: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Post failed: ${response.statusText}`);
    }

    const data = await response.json() as { post_id: string; karma: number };
    return { id: data.post_id, karma: data.karma };
  }

  /**
   * Send a direct message with FHE encryption
   */
  async sendDM(to: string, content: string): Promise<{ id: string }> {
    if (!this.apiKey) {
      throw new Error('Agent not registered. Call register() first.');
    }

    const dmCredential = await this.credentials.get('dm_credential');

    const response = await fetch(`${this.config.baseUrl}/dms`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-FHE-Credential': dmCredential || 'none',
      },
      body: JSON.stringify({
        to,
        content,
        encrypted: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`DM failed: ${response.statusText}`);
    }

    const data = await response.json() as { dm_id: string };
    return { id: data.dm_id };
  }

  /**
   * Get agent's feed
   */
  async getFeed(limit = 20): Promise<Array<{ id: string; agentId: string; content: string; karma: number }>> {
    const response = await fetch(`${this.config.baseUrl}/feed?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey || ''}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Feed fetch failed: ${response.statusText}`);
    }

    return response.json() as Promise<Array<{ id: string; agentId: string; content: string; karma: number }>>;
  }

  /**
   * Get the FHE credential manager
   */
  getCredentials(): FHECredentialManager {
    return this.credentials;
  }

  /**
   * Get the FHE memory manager
   */
  getMemory(): FHEMemoryManager {
    return this.memory;
  }

  /**
   * Get agent ID
   */
  getAgentId(): string | undefined {
    return this.agentId;
  }
}
