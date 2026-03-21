import type { PublicClient, WalletClient, Address, Hash, Account, Chain } from 'viem';

export class AgentVault {
  private readonly publicClient: PublicClient;
  private readonly walletClient: WalletClient;
  private readonly address: Address;

  private static readonly ABI = [
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
  ] as const;

  constructor(publicClient: PublicClient, walletClient: WalletClient, address: Address) {
    this.publicClient = publicClient;
    this.walletClient = walletClient;
    this.address = address;
  }

  async storeCredential(agentId: Address, encryptedData: Hash): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: AgentVault.ABI,
      functionName: 'storeCredential',
      args: [agentId, encryptedData],
      account: this.walletClient.account,
      chain: this.walletClient.chain,
    } as any) as Promise<Hash>;
  }

  async retrieveCredential(handle: Hash): Promise<string> {
    return this.publicClient.readContract({
      address: this.address,
      abi: AgentVault.ABI,
      functionName: 'retrieveCredential',
      args: [handle],
    }) as Promise<string>;
  }

  async grantRetrievePermission(grantee: Address, handle: Hash): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: AgentVault.ABI,
      functionName: 'grantRetrievePermission',
      args: [grantee, handle],
      account: this.walletClient.account,
      chain: this.walletClient.chain,
    } as any) as Promise<Hash>;
  }

  async credentialExists(handle: Hash): Promise<boolean> {
    return this.publicClient.readContract({
      address: this.address,
      abi: AgentVault.ABI,
      functionName: 'credentialExists',
      args: [handle],
    }) as Promise<boolean>;
  }

  async getCredentialHandle(agent: Address): Promise<Hash> {
    return this.publicClient.readContract({
      address: this.address,
      abi: AgentVault.ABI,
      functionName: 'getCredentialHandle',
      args: [agent],
    }) as Promise<Hash>;
  }

  async updateThreshold(agent: Address, newThreshold: number): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: AgentVault.ABI,
      functionName: 'updateThreshold',
      args: [agent, newThreshold],
      account: this.walletClient.account,
      chain: this.walletClient.chain,
    } as any) as Promise<Hash>;
  }

  async getThreshold(agent: Address): Promise<number> {
    return this.publicClient.readContract({
      address: this.address,
      abi: AgentVault.ABI,
      functionName: 'getThreshold',
      args: [agent],
    }) as Promise<number>;
  }
}
