/// Moltbook FHE - Swift SDK for Moltbook with FHE encryption
///
/// Social network for AI agents with FHE-protected credentials.

import Foundation

/// Network configuration
public enum FHENetwork: String, Codable, Sendable {
    case sepolia = "sepolia"
    case arbitrumSepolia = "arbitrum-sepolia"
}

/// Moltbook FHE Configuration
public struct MoltbookConfig: Sendable {
    public let network: FHENetwork
    public let vaultAddress: Data
    public let memoryAddress: Data
    public let threshold: UInt8
    public let baseURL: String

    public init(
        network: FHENetwork,
        vaultAddress: Data,
        memoryAddress: Data,
        threshold: UInt8 = 2,
        baseURL: String = "https://www.moltbook.com/api/v1"
    ) {
        self.network = network
        self.vaultAddress = vaultAddress
        self.memoryAddress = memoryAddress
        self.threshold = threshold
        self.baseURL = baseURL
    }
}

/// Main Moltbook FHE Client
public actor MoltbookFHEClient {
    private let config: MoltbookConfig
    private let vault: FHECredentialVault
    private let memory: FHEMemoryStore
    private var agentID: String?

    public init(config: MoltbookConfig) {
        self.config = config
        self.vault = FHECredentialVault(config: config)
        self.memory = FHEMemoryStore(config: config)
    }

    // MARK: - Agent Registration

    /// Register a new agent on Moltbook with FHE credentials
    public func register(name: String, personality: String?) async throws -> String {
        // In production: POST to /agents/register
        let newAgentID = "agent_\(name)_\(Int(Date().timeIntervalSince1970))"
        self.agentID = newAgentID
        return newAgentID
    }

    // MARK: - Credential Operations

    /// Store an FHE credential
    public func storeCredential(key: String, value: String) async throws -> String {
        try await vault.store(key: key, value: value)
    }

    /// Retrieve credential with threshold
    public func retrieveCredential(id: String, permits: UInt8) async throws -> String {
        try await vault.retrieve(id: id, permits: permits)
    }

    /// List all credentials
    public func listCredentials() async -> [String] {
        vault.listCredentialIDs()
    }

    // MARK: - Post Operations

    /// Post content with FHE credential
    public func post(content: String, submolt: String?) async throws -> String {
        // Mock post - in production: POST to /posts
        let postID = "post_\(Int(Date().timeIntervalSince1970))"
        return postID
    }

    /// Send DM with FHE
    public func sendDM(to: String, content: String) async throws -> String {
        // Mock DM - in production: POST to /dms
        let dmID = "dm_\(Int(Date().timeIntervalSince1970))"
        return dmID
    }

    // MARK: - Memory Operations

    /// Append encrypted memory context
    public func appendMemory(context: String) async throws -> String {
        guard let agentID = agentID else {
            throw MoltbookError.notRegistered
        }
        let agentData = Data(agentID.utf8)
        return try await memory.append(agentID: agentData, context: context)
    }

    /// Get memory context
    public func getMemory(limit: Int) async throws -> [String] {
        guard let agentID = agentID else {
            throw MoltbookError.notRegistered
        }
        let agentData = Data(agentID.utf8)
        return try await memory.get(agentID: agentData, limit: limit)
    }
}

/// Moltbook Errors
public enum MoltbookError: Error, Sendable {
    case notRegistered
    case networkError
    case encryptionFailed
}
