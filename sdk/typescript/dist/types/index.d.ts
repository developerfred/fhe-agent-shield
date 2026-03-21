export type NetworkName = 'fhenix-helium' | 'fhenix-nitrogen' | 'arbitrum-sepolia' | 'base-sepolia';
export interface NetworkConfig {
    name: NetworkName;
    rpcUrl: string;
    chainId: number;
    explorerUrl: string;
}
export declare const NETWORKS: Record<NetworkName, NetworkConfig>;
export interface ContractAddresses {
    agentVault: `0x${string}`;
    agentMemory: `0x${string}`;
    skillRegistry: `0x${string}`;
    actionSealer: `0x${string}`;
}
export interface CredentialResult {
    handle: `0x${string}`;
    success: boolean;
}
export interface CredentialEntry {
    key: string;
    handle: `0x${string}`;
    threshold: number;
}
export interface ActionResult {
    actionId: `0x${string}`;
    success: boolean;
}
export interface ActionStatus {
    status: 0 | 1 | 2 | 3;
    statusText: 'Sealed' | 'Approved' | 'Released' | 'Cancelled';
}
export interface ContextResult {
    length: bigint;
    success: boolean;
}
//# sourceMappingURL=index.d.ts.map