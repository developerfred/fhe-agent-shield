import type { PublicClient, WalletClient, Address, Hash, Chain } from 'viem';

export class AgentMemory {
  private readonly publicClient: PublicClient;
  private readonly walletClient: WalletClient;
  private readonly address: Address;
  private readonly chain: Chain;

  private static readonly ABI = [
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
  ] as const;

  constructor(publicClient: PublicClient, walletClient: WalletClient, address: Address, chain: Chain) {
    this.publicClient = publicClient;
    this.walletClient = walletClient;
    this.address = address;
    this.chain = chain;
  }

  async initializeAgent(): Promise<Address> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: AgentMemory.ABI,
      functionName: 'initializeAgent',
      args: [],
      account: this.walletClient.account,
      chain: this.chain,
    }) as Promise<Address>;
  }

  async agentExists(agentId: Address): Promise<boolean> {
    return this.publicClient.readContract({
      address: this.address,
      abi: AgentMemory.ABI,
      functionName: 'agentExists',
      args: [agentId],
    }) as Promise<boolean>;
  }

  async appendContext(agentId: Address, encryptedData: Hash): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: AgentMemory.ABI,
      functionName: 'appendContext',
      args: [agentId, encryptedData],
      account: this.walletClient.account,
      chain: this.chain,
    }) as Promise<Hash>;
  }

  async getContextLength(agentId: Address): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.address,
      abi: AgentMemory.ABI,
      functionName: 'getContextLength',
      args: [agentId],
    }) as Promise<bigint>;
  }

  async getContextSlice(agentId: Address, start: bigint, end: bigint): Promise<Hash[]> {
    return this.publicClient.readContract({
      address: this.address,
      abi: AgentMemory.ABI,
      functionName: 'getContextSlice',
      args: [agentId, start, end],
    }) as Promise<Hash[]>;
  }

  async snapshotContext(agentId: Address): Promise<Address> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: AgentMemory.ABI,
      functionName: 'snapshotContext',
      args: [agentId],
      account: this.walletClient.account,
      chain: this.chain,
    }) as Promise<Address>;
  }

  async restoreFromSnapshot(agentId: Address, snapshotId: Address): Promise<void> {
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
