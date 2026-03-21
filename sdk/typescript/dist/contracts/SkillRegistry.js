export class SkillRegistry {
    publicClient;
    walletClient;
    address;
    chain;
    static ABI = [
        {
            name: 'registerSkill',
            type: 'function',
            inputs: [
                { name: 'metadataHash', type: 'bytes32' },
                { name: 'codeHash', type: 'bytes32' }
            ],
            outputs: [{ name: '', type: 'address' }],
            stateMutability: 'nonpayable'
        },
        {
            name: 'verifySkill',
            type: 'function',
            inputs: [{ name: 'skillId', type: 'address' }],
            outputs: [],
            stateMutability: 'nonpayable'
        },
        {
            name: 'rateSkill',
            type: 'function',
            inputs: [
                { name: 'skillId', type: 'address' },
                { name: 'rating', type: 'uint256' }
            ],
            outputs: [],
            stateMutability: 'nonpayable'
        },
        {
            name: 'executeSkill',
            type: 'function',
            inputs: [
                { name: 'skillId', type: 'address' },
                { name: 'params', type: 'bytes' }
            ],
            outputs: [{ name: '', type: 'bytes' }],
            stateMutability: 'nonpayable'
        },
        {
            name: 'getSkill',
            type: 'function',
            inputs: [{ name: 'skillId', type: 'address' }],
            outputs: [
                { name: 'owner', type: 'address' },
                { name: 'metadataHash', type: 'bytes32' },
                { name: 'codeHash', type: 'bytes32' },
                { name: 'isVerified', type: 'bool' },
                { name: 'ratingCount', type: 'uint256' }
            ],
            stateMutability: 'view'
        },
        {
            name: 'getSkillRating',
            type: 'function',
            inputs: [{ name: 'skillId', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }],
            stateMutability: 'view'
        }
    ];
    constructor(publicClient, walletClient, address, chain) {
        this.publicClient = publicClient;
        this.walletClient = walletClient;
        this.address = address;
        this.chain = chain;
    }
    async registerSkill(metadataHash, codeHash) {
        return this.walletClient.writeContract({
            address: this.address,
            abi: SkillRegistry.ABI,
            functionName: 'registerSkill',
            args: [metadataHash, codeHash],
            account: this.walletClient.account,
            chain: this.chain,
        });
    }
    async verifySkill(skillId) {
        return this.walletClient.writeContract({
            address: this.address,
            abi: SkillRegistry.ABI,
            functionName: 'verifySkill',
            args: [skillId],
            account: this.walletClient.account,
            chain: this.chain,
        });
    }
    async rateSkill(skillId, rating) {
        return this.walletClient.writeContract({
            address: this.address,
            abi: SkillRegistry.ABI,
            functionName: 'rateSkill',
            args: [skillId, rating],
            account: this.walletClient.account,
            chain: this.chain,
        });
    }
    async executeSkill(skillId, params) {
        return this.walletClient.writeContract({
            address: this.address,
            abi: SkillRegistry.ABI,
            functionName: 'executeSkill',
            args: [skillId, params],
            account: this.walletClient.account,
            chain: this.chain,
        });
    }
    async getSkill(skillId) {
        const result = await this.publicClient.readContract({
            address: this.address,
            abi: SkillRegistry.ABI,
            functionName: 'getSkill',
            args: [skillId],
        });
        return {
            owner: result[0],
            metadataHash: result[1],
            codeHash: result[2],
            isVerified: result[3],
            ratingCount: result[4]
        };
    }
    async getSkillRating(skillId) {
        return this.publicClient.readContract({
            address: this.address,
            abi: SkillRegistry.ABI,
            functionName: 'getSkillRating',
            args: [skillId],
        });
    }
}
//# sourceMappingURL=SkillRegistry.js.map