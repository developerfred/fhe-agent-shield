const std = @import("std");
const testing = std.testing;

// Network represents supported Fhenix networks
pub const Network = enum(u64) {
    ethereum_sepolia = 11155111,
    arbitrum_sepolia = 421614,
    base_sepolia = 84532,

    pub fn rpcUrl(self: Network) []const u8 {
        return switch (self) {
            .ethereum_sepolia => "https://rpc.sepolia.org",
            .arbitrum_sepolia => "https://sepolia-rollup.arbitrum.io/rpc",
            .base_sepolia => "https://sepolia.base.org",
        };
    }

    pub fn chainId(self: Network) u64 {
        return @intFromEnum(self);
    }

    pub fn name(self: Network) []const u8 {
        return switch (self) {
            .ethereum_sepolia => "Ethereum Sepolia",
            .arbitrum_sepolia => "Arbitrum Sepolia",
            .base_sepolia => "Base Sepolia",
        };
    }
};

// ContractAddresses holds deployed contract addresses
pub const ContractAddresses = struct {
    agent_vault: []const u8,
    agent_memory: []const u8,
    skill_registry: []const u8,
    action_sealer: []const u8,
};

pub const default_contracts = ContractAddresses{
    .agent_vault = "0x818eA3862861e82586A4D6E1A78A1a657FC615aa",
    .agent_memory = "0x6D31CEaaa0588A62fFb99eCa3Bde0F22Bd7DBb7B",
    .skill_registry = "0xaA19aff541ed6eBF528f919592576baB138370DC",
    .action_sealer = "0x76f18Cc5F9DB41905a285866B9277Ac451F3f75B",
};

// Client is the FHE-Agent Shield client
pub const Client = struct {
    network: Network,
    address: []const u8,
    private_key: []const u8,
    rpc_url: []const u8,
    contracts: ContractAddresses,

    pub fn init(config: Config) !Client {
        return Client{
            .network = config.network,
            .address = try deriveAddress(config.private_key),
            .private_key = config.private_key,
            .rpc_url = if (config.rpc_url) |url| url else config.network.rpcUrl(),
            .contracts = config.contracts orelse default_contracts,
        };
    }

    pub fn addressString(self: *Client) []const u8 {
        _ = self;
        return "0x0000000000000000000000000000000000000000";
    }
};

// Config holds client configuration
pub const Config = struct {
    network: Network,
    private_key: []const u8,
    rpc_url: ?[]const u8 = null,
    contracts: ?ContractAddresses = null,
};

// Test network RPC URL resolution
test "network rpc url" {
    try testing.expectEqualStrings("https://rpc.sepolia.org", Network.ethereum_sepolia.rpcUrl());
    try testing.expectEqualStrings("https://sepolia-rollup.arbitrum.io/rpc", Network.arbitrum_sepolia.rpcUrl());
    try testing.expectEqualStrings("https://sepolia.base.org", Network.base_sepolia.rpcUrl());
}

// Test network chain ID
test "network chain id" {
    try testing.expectEqual(@as(u64, 11155111), Network.ethereum_sepolia.chainId());
    try testing.expectEqual(@as(u64, 421614), Network.arbitrum_sepolia.chainId());
    try testing.expectEqual(@as(u64, 84532), Network.base_sepolia.chainId());
}

// Test network name
test "network name" {
    try testing.expectEqualStrings("Ethereum Sepolia", Network.ethereum_sepolia.name());
    try testing.expectEqualStrings("Arbitrum Sepolia", Network.arbitrum_sepolia.name());
    try testing.expectEqualStrings("Base Sepolia", Network.base_sepolia.name());
}

// Placeholder for address derivation (would use crypto in production)
fn deriveAddress(private_key: []const u8) ![]const u8 {
    _ = private_key;
    return "0x0000000000000000000000000000000000000000";
}
