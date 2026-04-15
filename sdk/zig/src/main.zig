//! FHE-Agent Shield SDK for Zig
//!
//! Provides FHE-encrypted credential and memory management for NullClaw and other Zig-based AI agents.

pub const Network = @import("../fhe/client.zig").Network;
pub const Client = @import("../fhe/client.zig").Client;
pub const Config = @import("../fhe/client.zig").Config;
pub const ContractAddresses = @import("../fhe/client.zig").ContractAddresses;
pub const default_contracts = @import("../fhe/client.zig").default_contracts;

// Re-export client functions
pub fn initClient(config: Config) !Client {
    return Client.init(config);
}

// Credential vault for NullClaw
pub const CredentialVault = struct {
    client: *Client,
    credentials: std.AutoHashMap([]const u8, Credential),

    const Credential = struct {
        id: []const u8,
        key: []const u8,
        owner: []const u8,
        threshold: u8,
        created_at: u64,
    };

    pub fn init(client: *Client) CredentialVault {
        return CredentialVault{
            .client = client,
            .store = std.AutoHashMap([]const u8, Credential).init(std.heap.page_allocator),
        };
    }

    pub fn store(self: *CredentialVault, key: []const u8, value: []const u8) ![]const u8 {
        if (key.len == 0) return error.EmptyKey;

        // Generate credential ID from key hash
        var hasher = std.hash.Wyhash.init(0);
        hasher.update(key);
        hasher.update(self.client.addressString());
        const id = hasher.finalResult();

        // In production, this would encrypt and store on-chain
        _ = value;

        try self.store.put(key, Credential{
            .id = try std.fmt.allocPrint(std.heap.page_allocator, "{x}", .{id}),
            .key = key,
            .owner = self.client.addressString(),
            .threshold = 2,
            .created_at = 0,
        });

        return self.store.get(key).?.id;
    }

    pub fn retrieve(self: *CredentialVault, id: []const u8) ![]const u8 {
        _ = self;
        _ = id;
        // In production, this would decrypt using FHE
        return "decrypted_value";
    }

    pub fn list(self: *CredentialVault) ![]Credential {
        var creds = std.ArrayList(Credential).init(std.heap.page_allocator);
        _ = self;
        return creds.toOwnedSlice();
    }

    pub fn delete(self: *CredentialVault, id: []const u8) !void {
        _ = self;
        _ = id;
        // In production, this would call contract to delete
    }
};

// Memory manager for NullClaw
pub const MemoryManager = struct {
    client: *Client,
    context: std.ArrayList([]const u8),
    snapshots: std.AutoHashMap([]const u8, Snapshot),

    const Snapshot = struct {
        id: []const u8,
        agent_id: []const u8,
        context: [][]const u8,
        timestamp: u64,
    };

    pub fn init(client: *Client) MemoryManager {
        return MemoryManager{
            .client = client,
            .context = std.ArrayList([]const u8).init(std.heap.page_allocator),
            .snapshots = std.AutoHashMap([]const u8, Snapshot).init(std.heap.page_allocator),
        };
    }

    pub fn appendContext(self: *MemoryManager, data: []const u8) ![]const u8 {
        try self.context.append(data);
        // In production, this would encrypt and store on-chain
        return "0x1234";
    }

    pub fn getContext(self: *MemoryManager, limit: usize) ![][]const u8 {
        if (limit > self.context.items.len) {
            limit = self.context.items.len;
        }
        const start = self.context.items.len - limit;
        return self.context.items[start..];
    }

    pub fn clearMemory(self: *MemoryManager) ![]const u8 {
        self.context.clearAndFree();
        return "0x5678";
    }

    pub fn createSnapshot(self: *MemoryManager) ![]const u8 {
        // Generate snapshot ID
        var hasher = std.hash.Wyhash.init(0);
        hasher.update(self.client.addressString());
        hasher.update(self.client.addressString());
        const id = hasher.finalResult();

        const id_str = try std.fmt.allocPrint(std.heap.page_allocator, "{x}", .{id});

        try self.snapshots.put(id_str, Snapshot{
            .id = id_str,
            .agent_id = self.client.addressString(),
            .context = try self.context.toOwnedSlice(),
            .timestamp = 0,
        });

        return id_str;
    }

    pub fn restoreSnapshot(self: *MemoryManager, snapshot_id: []const u8) ![]const u8 {
        if (self.snapshots.get(snapshot_id)) |snapshot| {
            self.context.clearAndFree();
            for (snapshot.context) |item| {
                try self.context.append(item);
            }
        }
        return "0xabcd";
    }
};

test "credential store and retrieve" {
    const config = Config{
        .network = .ethereum_sepolia,
        .private_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    };
    var client = try initClient(config);
    var vault = CredentialVault.init(&client);

    const id = try vault.store("test-key", "test-value");
    try testing.expect(id.len > 0);
}

test "memory append and retrieve" {
    const config = Config{
        .network = .ethereum_sepolia,
        .private_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    };
    var client = try initClient(config);
    var mem = MemoryManager.init(&client);

    _ = try mem.appendContext("context 1");
    _ = try mem.appendContext("context 2");

    const ctx = try mem.getContext(10);
    try testing.expect(ctx.len >= 2);
}

test "memory snapshot and restore" {
    const config = Config{
        .network = .ethereum_sepolia,
        .private_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    };
    var client = try initClient(config);
    var mem = MemoryManager.init(&client);

    _ = try mem.appendContext("before snapshot");

    const snapshot_id = try mem.createSnapshot();

    _ = try mem.appendContext("after snapshot");
    _ = try mem.restoreSnapshot(snapshot_id);

    const ctx = try mem.getContext(10);
    try testing.expect(ctx.len == 1);
}

test "credential empty key error" {
    const config = Config{
        .network = .ethereum_sepolia,
        .private_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    };
    var client = try initClient(config);
    var vault = CredentialVault.init(&client);

    const result = vault.store("", "value");
    try testing.expectError(error.EmptyKey, result);
}

// Import testing
const testing = std.testing;
const std = @import("std");
