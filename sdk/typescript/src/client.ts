import { createPublicClient, createWalletClient, http, type PublicClient, type WalletClient } from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import type { NetworkName, NetworkConfig, ContractAddresses } from './types/index.js';
import { NETWORKS } from './types/index.js';
import { AgentVault } from './contracts/AgentVault.js';
import { AgentMemory } from './contracts/AgentMemory.js';
import { ActionSealer } from './contracts/ActionSealer.js';
import { SkillRegistry } from './contracts/SkillRegistry.js';

export interface FHEAgentShieldConfig {
  network: NetworkName | NetworkConfig;
  privateKey: `0x${string}`;
  contracts: ContractAddresses;
}

export class FHEAgentShield {
  public readonly network: NetworkConfig;
  public readonly contracts: ContractAddresses;
  public readonly publicClient: PublicClient;
  public readonly walletClient: WalletClient;
  public readonly account: PrivateKeyAccount;

  public readonly vault: AgentVault;
  public readonly memory: AgentMemory;
  public readonly sealer: ActionSealer;
  public readonly registry: SkillRegistry;

  constructor(config: FHEAgentShieldConfig) {
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
        default: { http: [networkConfig.rpcUrl] as const },
        public: { http: [networkConfig.rpcUrl] as const },
      },
    };

    // viem 2.x requires explicit typing - use type assertion for client creation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.publicClient = createPublicClient({
      transport: http(networkConfig.rpcUrl),
      chain,
    }) as any;

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

  static withNetwork(network: NetworkName): Omit<FHEAgentShieldConfig, 'privateKey' | 'contracts'> {
    return { network: NETWORKS[network] };
  }

  async getBalance(): Promise<bigint> {
    return this.publicClient.getBalance({ address: this.account.address });
  }
}
