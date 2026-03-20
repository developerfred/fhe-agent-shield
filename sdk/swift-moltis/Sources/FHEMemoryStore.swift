/// FHE Memory Store for Swift/Moltis
///
/// Thread-safe memory management with FHE encryption.

import Foundation

/// Memory entry
public struct FHEMemoryEntry: Sendable {
    public let id: String
    public let agentID: Data
    public let encryptedContext: Data
    public let timestamp: UInt64
}

/// Memory snapshot
public struct FHEMemorySnapshot: Sendable {
    public let id: String
    public let entries: [FHEMemoryEntry]
}

/// Thread-safe FHE Memory Store
public final class FHEMemoryStore: @unchecked Sendable {
    private let config: FHEConfig
    private var entries: [FHEMemoryEntry] = []
    private var snapshots: [String: [FHEMemoryEntry]] = [:]
    private let lock = NSLock()

    init(config: FHEConfig) {
        self.config = config
    }

    /// Append encrypted context to memory
    public func append(agentID: Data, context: String) async throws -> String {
        let encrypted = fheEncrypt(context)

        let id = "mem_\(entries.count)"
        let entry = FHEMemoryEntry(
            id: id,
            agentID: agentID,
            encryptedContext: encrypted,
            timestamp: UInt64(entries.count)
        )

        lock.lock()
        defer { lock.unlock() }
        entries.append(entry)

        return id
    }

    /// Get memory context for an agent
    public func get(agentID: Data, limit: Int) async throws -> [String] {
        lock.lock()
        defer { lock.unlock() }

        let filtered = entries
            .filter { $0.agentID == agentID }
            .suffix(limit)

        return filtered.map { fheDecrypt($0.encryptedContext) }
    }

    /// Create a memory snapshot
    public func snapshot(agentID: Data) async throws -> String {
        lock.lock()
        defer { lock.unlock() }

        let snapshotID = "snap_\(snapshots.count)"
        let agentEntries = entries.filter { $0.agentID == agentID }
        snapshots[snapshotID] = agentEntries

        return snapshotID
    }

    /// Restore memory from a snapshot
    public func restore(agentID: Data, snapshotID: String) async throws {
        lock.lock()
        defer { lock.unlock() }

        guard let snapshotEntries = snapshots[snapshotID] else {
            throw FHEError.credentialNotFound
        }

        // Remove existing entries for this agent
        entries.removeAll { $0.agentID == agentID }

        // Add entries from snapshot
        entries.append(contentsOf: snapshotEntries)
    }

    /// Clear all memory for an agent
    public func clear(agentID: Data) {
        lock.lock()
        defer { lock.unlock() }
        entries.removeAll { $0.agentID == agentID }
    }

    // MARK: - Mock FHE Functions

    private func fheEncrypt(_ data: String) -> Data {
        Data("fhe_\(data)".utf8)
    }

    private func fheDecrypt(_ encrypted: Data) -> String {
        let str = String(data: encrypted, encoding: .utf8) ?? ""
        if str.hasPrefix("fhe_") {
            return String(str.dropFirst(4))
        }
        return str
    }
}
