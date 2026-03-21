export const ActionStatusText = ['Sealed', 'Approved', 'Released', 'Cancelled'];
export class ActionSealer {
    publicClient;
    walletClient;
    address;
    chain;
    static ABI = [
        {
            name: 'sealAction',
            type: 'function',
            inputs: [
                { name: 'agentId', type: 'address' },
                { name: 'encryptedPayload', type: 'bytes' }
            ],
            outputs: [{ name: '', type: 'address' }],
            stateMutability: 'nonpayable'
        },
        {
            name: 'registerReleaseCondition',
            type: 'function',
            inputs: [
                { name: 'actionId', type: 'address' },
                { name: 'threshold', type: 'uint8' },
                { name: 'timeout', type: 'uint256' }
            ],
            outputs: [],
            stateMutability: 'nonpayable'
        },
        {
            name: 'approveRelease',
            type: 'function',
            inputs: [{ name: 'actionId', type: 'address' }],
            outputs: [{ name: '', type: 'bool' }],
            stateMutability: 'nonpayable'
        },
        {
            name: 'releaseAction',
            type: 'function',
            inputs: [{ name: 'actionId', type: 'address' }],
            outputs: [{ name: '', type: 'bytes' }],
            stateMutability: 'nonpayable'
        },
        {
            name: 'cancelAction',
            type: 'function',
            inputs: [{ name: 'actionId', type: 'address' }],
            outputs: [],
            stateMutability: 'nonpayable'
        },
        {
            name: 'getActionStatus',
            type: 'function',
            inputs: [{ name: 'actionId', type: 'address' }],
            outputs: [{ name: '', type: 'uint8' }],
            stateMutability: 'view'
        },
        {
            name: 'getReleaseCondition',
            type: 'function',
            inputs: [{ name: 'actionId', type: 'address' }],
            outputs: [
                { name: 'threshold', type: 'uint8' },
                { name: 'timeout', type: 'uint256' },
                { name: 'isActive', type: 'bool' }
            ],
            stateMutability: 'view'
        },
        {
            name: 'hasApproved',
            type: 'function',
            inputs: [
                { name: 'actionId', type: 'address' },
                { name: 'approver', type: 'address' }
            ],
            outputs: [{ name: '', type: 'bool' }],
            stateMutability: 'view'
        },
        {
            name: 'getAction',
            type: 'function',
            inputs: [{ name: 'actionId', type: 'address' }],
            outputs: [
                { name: 'owner', type: 'address' },
                { name: 'status', type: 'uint8' },
                { name: 'createdAt', type: 'uint256' }
            ],
            stateMutability: 'view'
        }
    ];
    constructor(publicClient, walletClient, address, chain) {
        this.publicClient = publicClient;
        this.walletClient = walletClient;
        this.address = address;
        this.chain = chain;
    }
    async sealAction(agentId, encryptedPayload) {
        return this.walletClient.writeContract({
            address: this.address,
            abi: ActionSealer.ABI,
            functionName: 'sealAction',
            args: [agentId, encryptedPayload],
            account: this.walletClient.account,
            chain: this.chain,
        });
    }
    async registerReleaseCondition(actionId, threshold, timeout) {
        return this.walletClient.writeContract({
            address: this.address,
            abi: ActionSealer.ABI,
            functionName: 'registerReleaseCondition',
            args: [actionId, threshold, timeout],
            account: this.walletClient.account,
            chain: this.chain,
        });
    }
    async approveRelease(actionId) {
        return this.walletClient.writeContract({
            address: this.address,
            abi: ActionSealer.ABI,
            functionName: 'approveRelease',
            args: [actionId],
            account: this.walletClient.account,
            chain: this.chain,
        });
    }
    async releaseAction(actionId) {
        return this.walletClient.writeContract({
            address: this.address,
            abi: ActionSealer.ABI,
            functionName: 'releaseAction',
            args: [actionId],
            account: this.walletClient.account,
            chain: this.chain,
        });
    }
    async cancelAction(actionId) {
        return this.walletClient.writeContract({
            address: this.address,
            abi: ActionSealer.ABI,
            functionName: 'cancelAction',
            args: [actionId],
            account: this.walletClient.account,
            chain: this.chain,
        });
    }
    async getActionStatus(actionId) {
        const status = await this.publicClient.readContract({
            address: this.address,
            abi: ActionSealer.ABI,
            functionName: 'getActionStatus',
            args: [actionId],
        });
        return status;
    }
    async getReleaseCondition(actionId) {
        const result = await this.publicClient.readContract({
            address: this.address,
            abi: ActionSealer.ABI,
            functionName: 'getReleaseCondition',
            args: [actionId],
        });
        return { threshold: result[0], timeout: result[1], isActive: result[2] };
    }
    async hasApproved(actionId, approver) {
        return this.publicClient.readContract({
            address: this.address,
            abi: ActionSealer.ABI,
            functionName: 'hasApproved',
            args: [actionId, approver],
        });
    }
    async getAction(actionId) {
        const result = await this.publicClient.readContract({
            address: this.address,
            abi: ActionSealer.ABI,
            functionName: 'getAction',
            args: [actionId],
        });
        return { owner: result[0], status: result[1], createdAt: result[2] };
    }
}
//# sourceMappingURL=ActionSealer.js.map