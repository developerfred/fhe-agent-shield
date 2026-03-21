import type { PublicClient, WalletClient, Address, Hash, Chain } from 'viem';
export declare class SkillRegistry {
    private readonly publicClient;
    private readonly walletClient;
    private readonly address;
    private readonly chain;
    private static readonly ABI;
    constructor(publicClient: PublicClient, walletClient: WalletClient, address: Address, chain: Chain);
    registerSkill(metadataHash: Hash, codeHash: Hash): Promise<Address>;
    verifySkill(skillId: Address): Promise<Hash>;
    rateSkill(skillId: Address, rating: bigint): Promise<Hash>;
    executeSkill(skillId: Address, params: Hash): Promise<Hash>;
    getSkill(skillId: Address): Promise<{
        owner: Address;
        metadataHash: Hash;
        codeHash: Hash;
        isVerified: boolean;
        ratingCount: bigint;
    }>;
    getSkillRating(skillId: Address): Promise<bigint>;
}
//# sourceMappingURL=SkillRegistry.d.ts.map