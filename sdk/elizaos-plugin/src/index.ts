import type { Plugin, IAgentRuntime, Memory, State, Action, Provider, ActionResult, HandlerCallback, ProviderResult } from '@elizaos/core';
import type { Address } from 'viem';
import { FHEAgentShield, NETWORKS } from '@fhe-agent-shield/sdk';

export interface FHEShieldSettings {
  contracts: {
    agentVault: Address;
    agentMemory: Address;
    skillRegistry: Address;
    actionSealer: Address;
  };
  network: 'fhenix-helium' | 'fhenix-nitrogen' | 'arbitrum-sepolia' | 'base-sepolia';
  threshold: number;
}

function getCredentialParams(state: State | undefined): { key: string; value?: string } {
  const key = (state?.values as Record<string, unknown>)?.credentialKey as string || 'default';
  const value = (state?.values as Record<string, unknown>)?.credentialValue as string;
  return { key, value };
}

function getActionParams(state: State | undefined): { action?: string; payload?: unknown; actionId?: string } {
  const values = state?.values as Record<string, unknown>;
  return {
    action: values?.action as string,
    payload: values?.payload as unknown,
    actionId: values?.actionId as string,
  };
}

const createFHEStoreCredentialAction = (getClient: () => FHEAgentShield | null): Action => ({
  name: 'FHE_STORE_CREDENTIAL',
  description: 'Store encrypted credential with FHE protection',
  validate: async (_runtime: IAgentRuntime, _message: Memory, _state?: State): Promise<boolean> => {
    return true;
  },
  handler: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    state?: State,
    _options?: Record<string, unknown>,
    _callback?: HandlerCallback,
    _responses?: Memory[]
  ): Promise<ActionResult | void> => {
    const client = getClient();
    if (!client) {
      return { success: false, error: 'Plugin not initialized' };
    }
    try {
      const { key, value } = getCredentialParams(state);
      if (!value) {
        return { success: false, error: 'No credential value provided' };
      }
      const hash = await client.vault.storeCredential(
        client.account.address,
        value as `0x${string}`
      );
      return { success: true, text: `Credential stored: ${key}`, data: { key, txHash: hash } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },
});

const createFHERetrieveCredentialAction = (getClient: () => FHEAgentShield | null): Action => ({
  name: 'FHE_RETRIEVE_CREDENTIAL',
  description: 'Retrieve encrypted credential with threshold decryption',
  validate: async (_runtime: IAgentRuntime, _message: Memory, _state?: State): Promise<boolean> => {
    return true;
  },
  handler: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    state?: State,
    _options?: Record<string, unknown>,
    _callback?: HandlerCallback,
    _responses?: Memory[]
  ): Promise<ActionResult | void> => {
    const client = getClient();
    if (!client) {
      return { success: false, error: 'Plugin not initialized' };
    }
    try {
      const { key } = getCredentialParams(state);
      const value = await client.vault.retrieveCredential(
        key as `0x${string}`
      );
      return { success: true, text: `Credential retrieved: ${key}`, data: { key, value } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },
});

const createFHESealActionAction = (getClient: () => FHEAgentShield | null): Action => ({
  name: 'FHE_SEAL_ACTION',
  description: 'Seal action requiring threshold approval for release',
  validate: async (_runtime: IAgentRuntime, _message: Memory, _state?: State): Promise<boolean> => {
    return true;
  },
  handler: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    state?: State,
    _options?: Record<string, unknown>,
    _callback?: HandlerCallback,
    _responses?: Memory[]
  ): Promise<ActionResult | void> => {
    const client = getClient();
    if (!client) {
      return { success: false, error: 'Plugin not initialized' };
    }
    try {
      const { action, payload } = getActionParams(state);
      if (!action || !payload) {
        return { success: false, error: 'No action or payload provided' };
      }
      const actionId = await client.sealer.sealAction(
        client.account.address,
        JSON.stringify(payload) as `0x${string}`
      );
      return { success: true, text: `Action sealed: ${action}`, data: { actionId } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },
});

const createFHEApproveAction = (getClient: () => FHEAgentShield | null): Action => ({
  name: 'FHE_APPROVE_ACTION',
  description: 'Approve a sealed action for release',
  validate: async (_runtime: IAgentRuntime, _message: Memory, _state?: State): Promise<boolean> => {
    return true;
  },
  handler: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    state?: State,
    _options?: Record<string, unknown>,
    _callback?: HandlerCallback,
    _responses?: Memory[]
  ): Promise<ActionResult | void> => {
    const client = getClient();
    if (!client) {
      return { success: false, error: 'Plugin not initialized' };
    }
    try {
      const { actionId } = getActionParams(state);
      if (!actionId) {
        return { success: false, error: 'No actionId provided' };
      }
      await client.sealer.approveRelease(actionId as Address);
      return { success: true, text: `Action approved: ${actionId}`, data: { actionId } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  },
});

const createFHEProvider = (getClient: () => FHEAgentShield | null): Provider => ({
  name: 'fhe-credential-provider',
  description: 'Provides FHE-encrypted credentials to agent context',
  dynamic: false,
  get: async (_runtime: IAgentRuntime, _message: Memory, _state: State): Promise<ProviderResult> => {
    const client = getClient();
    if (!client) {
      return { text: 'FHE Shield not initialized', data: { initialized: false } };
    }
    return {
      text: 'FHE Shield initialized - credentials and memory are encrypted',
      data: {
        initialized: true,
        network: client.network.name,
        address: client.account.address,
      },
    };
  },
});

export class FHEShieldPlugin implements Plugin {
  public name = 'fhe-shield';
  public description = 'FHE-encrypted credentials and memory for ElizaOS agents';
  public actions: Action[];
  public providers: Provider[];

  private settings: FHEShieldSettings;
  private client: FHEAgentShield | null = null;

  constructor(settings: FHEShieldSettings) {
    this.settings = settings;
    this.actions = [
      createFHEStoreCredentialAction(() => this.client),
      createFHERetrieveCredentialAction(() => this.client),
      createFHESealActionAction(() => this.client),
      createFHEApproveAction(() => this.client),
    ];
    this.providers = [createFHEProvider(() => this.client)];
  }

  async init(_config: Record<string, string>, runtime: IAgentRuntime): Promise<void> {
    this.client = new FHEAgentShield({
      network: NETWORKS[this.settings.network],
      privateKey: runtime.agentId as `0x${string}`,
      contracts: this.settings.contracts,
    });
  }

  getClient(): FHEAgentShield | null {
    return this.client;
  }
}

export default FHEShieldPlugin;
