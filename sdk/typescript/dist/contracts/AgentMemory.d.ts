import type { PublicClient, WalletClient, Address, Hash, Chain } from 'viem';
export declare class AgentMemory {
    private readonly publicClient;
    private readonly walletClient;
    private readonly address;
    private readonly chain;
    private static readonly ABI;
    constructor(publicClient: PublicClient, walletClient: WalletClient, address: Address, chain: Chain);
    initializeAgent(): Promise<Address>;
    agentExists(agentId: Address): Promise<boolean>;
    appendContext(agentId: Address, encryptedData: Hash): Promise<Hash>;
    getContextLength(agentId: Address): Promise<bigint>;
    getContextSlice(agentId: Address, start: bigint, end: bigint): Promise<Hash[]>;
    snapshotContext(agentId: Address): Promise<Address>;
    restoreFromSnapshot(agentId: Address, snapshotId: Address): Promise<void>;
}
//# sourceMappingURL=AgentMemory.d.ts.map