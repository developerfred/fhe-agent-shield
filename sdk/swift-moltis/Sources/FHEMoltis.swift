/// FHE Moltis Bridge - Main module for Swift integration with Moltis
///
/// Provides FHE-encrypted credentials and memory for Swift/iOS/macOS apps.

import Foundation

/// Network configuration for Fhenix
public enum FHENetwork: String, Codable, Sendable {
    case sepolia = "sepolia"
    case arbitrumSepolia = "arbitrum-sepolia"
}

/// Configuration for FHE Moltis Bridge
public struct FHEConfig: Sendable {
    public let network: FHENetwork
    public let contractAddress: Data
    public let threshold: UInt8
    public let rpcURL: String

    public init(
        network: FHENetwork,
        contractAddress: Data,
        threshold: UInt8 = 2,
        rpcURL: String? = nil
    ) {
        self.network = network
        self.contractAddress = contractAddress
        self.threshold = threshold
        self.rpcURL = rpcURL ?? Self.defaultRPC(for: network)
    }

    private static func defaultRPC(for network: FHENetwork) -> String {
        switch network {
        case .sepolia: return "https://rpc.sepolia.org"
        case .arbitrumSepolia: return "https://sepolia-rollup.arbitrum.io/rpc"
        }
    }
}

/// Main FHE Moltis Bridge actor for thread-safe operations
public actor FHEMoltisBridge {
    private let config: FHEConfig
    private let vault: FHECredentialVault
    private let memory: FHEMemoryStore

    public init(config: FHEConfig) {
        self.config = config
        self.vault = FHECredentialVault(config: config)
        self.memory = FHEMemoryStore(config: config)
    }

    // MARK: - Credential Operations

    /// Store an FHE-encrypted credential
    public func storeCredential(key: String, value: String) async throws -> String {
        try await vault.store(key: key, value: value)
    }

    /// Retrieve a credential with threshold authorization
    public func retrieveCredential(id: String, permits: UInt8) async throws -> String {
        try await vault.retrieve(id: id, permits: permits)
    }

    /// List all credential IDs
    public func listCredentials() async -> [String] {
        vault.listCredentialIDs()
    }

    /// Delete a credential
    public func deleteCredential(id: String) async throws {
        try vault.delete(id: id)
    }

    // MARK: - Memory Operations

    /// Append encrypted context to memory
    public func appendMemory(agentID: Data, context: String) async throws -> String {
        try await memory.append(agentID: agentID, context: context)
    }

    /// Get memory context
    public func getMemory(agentID: Data, limit: Int) async throws -> [String] {
        try await memory.get(agentID: agentID, limit: limit)
    }

    /// Create a memory snapshot
    public func createSnapshot(agentID: Data) async throws -> String {
        try await memory.snapshot(agentID: agentID)
    }

    /// Restore memory from snapshot
    public func restoreSnapshot(agentID: Data, snapshotID: String) async throws {
        try await memory.restore(agentID: agentID, snapshotID: snapshotID)
    }
}
