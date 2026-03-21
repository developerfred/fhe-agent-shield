export class AgentVault {
    publicClient;
    walletClient;
    address;
    static ABI = [
        {
            name: 'storeCredential',
            type: 'function',
            inputs: [
                { name: 'agentId', type: 'address' },
                { name: 'encryptedData', type: 'bytes32' }
            ],
            outputs: [{ name: '', type: 'bytes32' }],
            stateMutability: 'nonpayable'
        },
        {
            name: 'retrieveCredential',
            type: 'function',
            inputs: [{ name: 'handle', type: 'bytes32' }],
            outputs: [{ name: '', type: 'string' }],
            stateMutability: 'view'
        },
        {
            name: 'grantRetrievePermission',
            type: 'function',
            inputs: [
                { name: 'grantee', type: 'address' },
                { name: 'handle', type: 'bytes32' }
            ],
            outputs: [],
            stateMutability: 'nonpayable'
        },
        {
            name: 'credentialExists',
            type: 'function',
            inputs: [{ name: 'handle', type: 'bytes32' }],
            outputs: [{ name: '', type: 'bool' }],
            stateMutability: 'view'
        },
        {
            name: 'getCredentialHandle',
            type: 'function',
            inputs: [{ name: 'agent', type: 'address' }],
            outputs: [{ name: '', type: 'bytes32' }],
            stateMutability: 'view'
        },
        {
            name: 'updateThreshold',
            type: 'function',
            inputs: [
                { name: 'agent', type: 'address' },
                { name: 'newThreshold', type: 'uint8' }
            ],
            outputs: [],
            stateMutability: 'nonpayable'
        },
        {
            name: 'getThreshold',
            type: 'function',
            inputs: [{ name: 'agent', type: 'address' }],
            outputs: [{ name: '', type: 'uint8' }],
            stateMutability: 'view'
        }
    ];
    constructor(publicClient, walletClient, address) {
        this.publicClient = publicClient;
        this.walletClient = walletClient;
        this.address = address;
    }
    async storeCredential(agentId, encryptedData) {
        return this.walletClient.writeContract({
            address: this.address,
            abi: AgentVault.ABI,
            functionName: 'storeCredential',
            args: [agentId, encryptedData],
            account: this.walletClient.account,
            chain: this.walletClient.chain,
        });
    }
    async retrieveCredential(handle) {
        return this.publicClient.readContract({
            address: this.address,
            abi: AgentVault.ABI,
            functionName: 'retrieveCredential',
            args: [handle],
        });
    }
    async grantRetrievePermission(grantee, handle) {
        return this.walletClient.writeContract({
            address: this.address,
            abi: AgentVault.ABI,
            functionName: 'grantRetrievePermission',
            args: [grantee, handle],
            account: this.walletClient.account,
            chain: this.walletClient.chain,
        });
    }
    async credentialExists(handle) {
        return this.publicClient.readContract({
            address: this.address,
            abi: AgentVault.ABI,
            functionName: 'credentialExists',
            args: [handle],
        });
    }
    async getCredentialHandle(agent) {
        return this.publicClient.readContract({
            address: this.address,
            abi: AgentVault.ABI,
            functionName: 'getCredentialHandle',
            args: [agent],
        });
    }
    async updateThreshold(agent, newThreshold) {
        return this.walletClient.writeContract({
            address: this.address,
            abi: AgentVault.ABI,
            functionName: 'updateThreshold',
            args: [agent, newThreshold],
            account: this.walletClient.account,
            chain: this.walletClient.chain,
        });
    }
    async getThreshold(agent) {
        return this.publicClient.readContract({
            address: this.address,
            abi: AgentVault.ABI,
            functionName: 'getThreshold',
            args: [agent],
        });
    }
}
//# sourceMappingURL=AgentVault.js.map