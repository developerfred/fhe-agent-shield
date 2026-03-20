import type { PublicClient, WalletClient, Address, Hash, Chain } from 'viem';

export class SkillRegistry {
  private readonly publicClient: PublicClient;
  private readonly walletClient: WalletClient;
  private readonly address: Address;
  private readonly chain: Chain;

  private static readonly ABI = [
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
  ] as const;

  constructor(publicClient: PublicClient, walletClient: WalletClient, address: Address, chain: Chain) {
    this.publicClient = publicClient;
    this.walletClient = walletClient;
    this.address = address;
    this.chain = chain;
  }

  async registerSkill(metadataHash: Hash, codeHash: Hash): Promise<Address> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: SkillRegistry.ABI,
      functionName: 'registerSkill',
      args: [metadataHash, codeHash],
      account: this.walletClient.account,
      chain: this.chain,
    }) as Promise<Address>;
  }

  async verifySkill(skillId: Address): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: SkillRegistry.ABI,
      functionName: 'verifySkill',
      args: [skillId],
      account: this.walletClient.account,
      chain: this.chain,
    }) as Promise<Hash>;
  }

  async rateSkill(skillId: Address, rating: bigint): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: SkillRegistry.ABI,
      functionName: 'rateSkill',
      args: [skillId, rating],
      account: this.walletClient.account,
      chain: this.chain,
    }) as Promise<Hash>;
  }

  async executeSkill(skillId: Address, params: Hash): Promise<Hash> {
    return this.walletClient.writeContract({
      address: this.address,
      abi: SkillRegistry.ABI,
      functionName: 'executeSkill',
      args: [skillId, params],
      account: this.walletClient.account,
      chain: this.chain,
    }) as Promise<Hash>;
  }

  async getSkill(
    skillId: Address
  ): Promise<{
    owner: Address;
    metadataHash: Hash;
    codeHash: Hash;
    isVerified: boolean;
    ratingCount: bigint;
  }> {
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

  async getSkillRating(skillId: Address): Promise<bigint> {
    return this.publicClient.readContract({
      address: this.address,
      abi: SkillRegistry.ABI,
      functionName: 'getSkillRating',
      args: [skillId],
    }) as Promise<bigint>;
  }
}
