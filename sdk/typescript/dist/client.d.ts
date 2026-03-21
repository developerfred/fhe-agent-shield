import { type PublicClient, type WalletClient } from 'viem';
import { type PrivateKeyAccount } from 'viem/accounts';
import type { NetworkName, NetworkConfig, ContractAddresses } from './types/index.js';
import { AgentVault } from './contracts/AgentVault.js';
import { AgentMemory } from './contracts/AgentMemory.js';
import { ActionSealer } from './contracts/ActionSealer.js';
import { SkillRegistry } from './contracts/SkillRegistry.js';
export interface FHEAgentShieldConfig {
    network: NetworkName | NetworkConfig;
    privateKey: `0x${string}`;
    contracts: ContractAddresses;
}
export declare class FHEAgentShield {
    readonly network: NetworkConfig;
    readonly contracts: ContractAddresses;
    readonly publicClient: PublicClient;
    readonly walletClient: WalletClient;
    readonly account: PrivateKeyAccount;
    readonly vault: AgentVault;
    readonly memory: AgentMemory;
    readonly sealer: ActionSealer;
    readonly registry: SkillRegistry;
    constructor(config: FHEAgentShieldConfig);
    static withNetwork(network: NetworkName): Omit<FHEAgentShieldConfig, 'privateKey' | 'contracts'>;
    getBalance(): Promise<bigint>;
}
//# sourceMappingURL=client.d.ts.map