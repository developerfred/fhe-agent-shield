import type { PublicClient, WalletClient, Address, Hash } from 'viem';
export declare class AgentVault {
    private readonly publicClient;
    private readonly walletClient;
    private readonly address;
    private static readonly ABI;
    constructor(publicClient: PublicClient, walletClient: WalletClient, address: Address);
    storeCredential(agentId: Address, encryptedData: Hash): Promise<Hash>;
    retrieveCredential(handle: Hash): Promise<string>;
    grantRetrievePermission(grantee: Address, handle: Hash): Promise<Hash>;
    credentialExists(handle: Hash): Promise<boolean>;
    getCredentialHandle(agent: Address): Promise<Hash>;
    updateThreshold(agent: Address, newThreshold: number): Promise<Hash>;
    getThreshold(agent: Address): Promise<number>;
}
//# sourceMappingURL=AgentVault.d.ts.map