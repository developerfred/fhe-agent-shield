import type { PublicClient, WalletClient, Address, Hash, Chain } from 'viem';
export type ActionStatus = 0 | 1 | 2 | 3;
export declare const ActionStatusText: readonly ["Sealed", "Approved", "Released", "Cancelled"];
export declare class ActionSealer {
    private readonly publicClient;
    private readonly walletClient;
    private readonly address;
    private readonly chain;
    private static readonly ABI;
    constructor(publicClient: PublicClient, walletClient: WalletClient, address: Address, chain: Chain);
    sealAction(agentId: Address, encryptedPayload: Hash): Promise<Address>;
    registerReleaseCondition(actionId: Address, threshold: number, timeout: bigint): Promise<Hash>;
    approveRelease(actionId: Address): Promise<Hash>;
    releaseAction(actionId: Address): Promise<Hash>;
    cancelAction(actionId: Address): Promise<Hash>;
    getActionStatus(actionId: Address): Promise<ActionStatus>;
    getReleaseCondition(actionId: Address): Promise<{
        threshold: number;
        timeout: bigint;
        isActive: boolean;
    }>;
    hasApproved(actionId: Address, approver: Address): Promise<boolean>;
    getAction(actionId: Address): Promise<{
        owner: Address;
        status: ActionStatus;
        createdAt: bigint;
    }>;
}
//# sourceMappingURL=ActionSealer.d.ts.map