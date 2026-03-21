import type { Plugin, IAgentRuntime, Action, Provider } from '@elizaos/core';
import type { Address } from 'viem';
import { FHEAgentShield } from '@fhe-agent-shield/sdk';
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
export declare class FHEShieldPlugin implements Plugin {
    name: string;
    description: string;
    actions: Action[];
    providers: Provider[];
    private settings;
    private client;
    constructor(settings: FHEShieldSettings);
    init(_config: Record<string, string>, runtime: IAgentRuntime): Promise<void>;
    getClient(): FHEAgentShield | null;
}
export default FHEShieldPlugin;
