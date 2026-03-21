import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { NETWORKS } from './types/index.js';
import { AgentVault } from './contracts/AgentVault.js';
import { AgentMemory } from './contracts/AgentMemory.js';
import { ActionSealer } from './contracts/ActionSealer.js';
import { SkillRegistry } from './contracts/SkillRegistry.js';
export class FHEAgentShield {
    network;
    contracts;
    publicClient;
    walletClient;
    account;
    vault;
    memory;
    sealer;
    registry;
    constructor(config) {
        const networkConfig = typeof config.network === 'string'
            ? NETWORKS[config.network]
            : config.network;
        this.network = networkConfig;
        this.contracts = config.contracts;
        this.account = privateKeyToAccount(config.privateKey);
        const chain = {
            id: networkConfig.chainId,
            name: networkConfig.name,
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: {
                default: { http: [networkConfig.rpcUrl] },
                public: { http: [networkConfig.rpcUrl] },
            },
        };
        // viem 2.x requires explicit typing - use type assertion for client creation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.publicClient = createPublicClient({
            transport: http(networkConfig.rpcUrl),
            chain,
        });
        this.walletClient = createWalletClient({
            account: this.account,
            transport: http(networkConfig.rpcUrl),
            chain,
        });
        this.vault = new AgentVault(this.publicClient, this.walletClient, this.contracts.agentVault);
        this.memory = new AgentMemory(this.publicClient, this.walletClient, this.contracts.agentMemory, chain);
        this.sealer = new ActionSealer(this.publicClient, this.walletClient, this.contracts.actionSealer, chain);
        this.registry = new SkillRegistry(this.publicClient, this.walletClient, this.contracts.skillRegistry, chain);
    }
    static withNetwork(network) {
        return { network: NETWORKS[network] };
    }
    async getBalance() {
        return this.publicClient.getBalance({ address: this.account.address });
    }
}
//# sourceMappingURL=client.js.map