export class AgentMemory {
    publicClient;
    walletClient;
    address;
    chain;
    static ABI = [
        {
            name: 'initializeAgent',
            type: 'function',
            inputs: [],
            outputs: [{ name: '', type: 'address' }],
            stateMutability: 'nonpayable'
        },
        {
            name: 'agentExists',
            type: 'function',
            inputs: [{ name: 'agentId', type: 'address' }],
            outputs: [{ name: '', type: 'bool' }],
            stateMutability: 'view'
        },
        {
            name: 'appendContext',
            type: 'function',
            inputs: [
                { name: 'agentId', type: 'address' },
                { name: 'encryptedData', type: 'bytes32' }
            ],
            outputs: [{ name: '', type: 'uint256' }],
            stateMutability: 'nonpayable'
        },
        {
            name: 'getContextLength',
            type: 'function',
            inputs: [{ name: 'agentId', type: 'address' }],
            outputs: [{ name: '', type: 'uint256' }],
            stateMutability: 'view'
        },
        {
            name: 'getContextSlice',
            type: 'function',
            inputs: [
                { name: 'agentId', type: 'address' },
                { name: 'start', type: 'uint256' },
                { name: 'end', type: 'uint256' }
            ],
            outputs: [{ name: '', type: 'bytes32[]' }],
            stateMutability: 'view'
        },
        {
            name: 'snapshotContext',
            type: 'function',
            inputs: [{ name: 'agentId', type: 'address' }],
            outputs: [{ name: '', type: 'address' }],
            stateMutability: 'nonpayable'
        },
        {
            name: 'restoreFromSnapshot',
            type: 'function',
            inputs: [
                { name: 'agentId', type: 'address' },
                { name: 'snapshotId', type: 'address' }
            ],
            outputs: [],
            stateMutability: 'nonpayable'
        }
    ];
    constructor(publicClient, walletClient, address, chain) {
        this.publicClient = publicClient;
        this.walletClient = walletClient;
        this.address = address;
        this.chain = chain;
    }
    async initializeAgent() {
        return this.walletClient.writeContract({
            address: this.address,
            abi: AgentMemory.ABI,
            functionName: 'initializeAgent',
            args: [],
            account: this.walletClient.account,
            chain: this.chain,
        });
    }
    async agentExists(agentId) {
        return this.publicClient.readContract({
            address: this.address,
            abi: AgentMemory.ABI,
            functionName: 'agentExists',
            args: [agentId],
        });
    }
    async appendContext(agentId, encryptedData) {
        return this.walletClient.writeContract({
            address: this.address,
            abi: AgentMemory.ABI,
            functionName: 'appendContext',
            args: [agentId, encryptedData],
            account: this.walletClient.account,
            chain: this.chain,
        });
    }
    async getContextLength(agentId) {
        return this.publicClient.readContract({
            address: this.address,
            abi: AgentMemory.ABI,
            functionName: 'getContextLength',
            args: [agentId],
        });
    }
    async getContextSlice(agentId, start, end) {
        return this.publicClient.readContract({
            address: this.address,
            abi: AgentMemory.ABI,
            functionName: 'getContextSlice',
            args: [agentId, start, end],
        });
    }
    async snapshotContext(agentId) {
        return this.walletClient.writeContract({
            address: this.address,
            abi: AgentMemory.ABI,
            functionName: 'snapshotContext',
            args: [agentId],
            account: this.walletClient.account,
            chain: this.chain,
        });
    }
    async restoreFromSnapshot(agentId, snapshotId) {
        await this.walletClient.writeContract({
            address: this.address,
            abi: AgentMemory.ABI,
            functionName: 'restoreFromSnapshot',
            args: [agentId, snapshotId],
            account: this.walletClient.account,
            chain: this.chain,
        });
    }
}
//# sourceMappingURL=AgentMemory.js.map