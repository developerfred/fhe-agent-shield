import type { PublicClient, WalletClient, Address, Hash, Chain } from 'viem';

export type ActionStatus = 0 | 1 | 2 | 3;
export const ActionStatusText = ['Sealed', 'Approved', 'Released', 'Cancelled'] as const;

export class ActionSealer {
  private readonly publicClient: PublicClient;
  private readonly walletClient: WalletClient;
  private readonly address: Address;
  private readonly chain: Chain;

  private static readonly ABI = [
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
  ] as const;

  constructor(publicClient: PublicClient, walletClient: WalletClient, address: Address, chain: Chain) {
    this.publicClient = publicClient;
    this.walletClient = walletClient;
    this.address = address;
    this.chain = chain;
  }

  async sealAction(agentId: Address, encryptedPayload: Hash): Promise<Address> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: ActionSealer.ABI,
      functionName: 'sealAction',
      args: [agentId, encryptedPayload],
      account: this.walletClient.account,
      chain: this.chain,
    }) as Promise<Address>;
  }

  async registerReleaseCondition(
    actionId: Address,
    threshold: number,
    timeout: bigint
  ): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: ActionSealer.ABI,
      functionName: 'registerReleaseCondition',
      args: [actionId, threshold, timeout],
      account: this.walletClient.account,
      chain: this.chain,
    }) as Promise<Hash>;
  }

  async approveRelease(actionId: Address): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: ActionSealer.ABI,
      functionName: 'approveRelease',
      args: [actionId],
      account: this.walletClient.account,
      chain: this.chain,
    }) as Promise<Hash>;
  }

  async releaseAction(actionId: Address): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: ActionSealer.ABI,
      functionName: 'releaseAction',
      args: [actionId],
      account: this.walletClient.account,
      chain: this.chain,
    }) as Promise<Hash>;
  }

  async cancelAction(actionId: Address): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: ActionSealer.ABI,
      functionName: 'cancelAction',
      args: [actionId],
      account: this.walletClient.account,
      chain: this.chain,
    }) as Promise<Hash>;
  }

  async getActionStatus(actionId: Address): Promise<ActionStatus> {
    const status = await this.publicClient.readContract({
      address: this.address,
      abi: ActionSealer.ABI,
      functionName: 'getActionStatus',
      args: [actionId],
    });
    return status as ActionStatus;
  }

  async getReleaseCondition(
    actionId: Address
  ): Promise<{ threshold: number; timeout: bigint; isActive: boolean }> {
    const result = await this.publicClient.readContract({
      address: this.address,
      abi: ActionSealer.ABI,
      functionName: 'getReleaseCondition',
      args: [actionId],
    });
    return { threshold: result[0], timeout: result[1], isActive: result[2] };
  }

  async hasApproved(actionId: Address, approver: Address): Promise<boolean> {
    return this.publicClient.readContract({
      address: this.address,
      abi: ActionSealer.ABI,
      functionName: 'hasApproved',
      args: [actionId, approver],
    }) as Promise<boolean>;
  }

  async getAction(
    actionId: Address
  ): Promise<{ owner: Address; status: ActionStatus; createdAt: bigint }> {
    const result = await this.publicClient.readContract({
      address: this.address,
      abi: ActionSealer.ABI,
      functionName: 'getAction',
      args: [actionId],
    });
    return { owner: result[0], status: result[1] as ActionStatus, createdAt: result[2] };
  }
}
