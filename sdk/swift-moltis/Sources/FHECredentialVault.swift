/// FHE Credential Vault for Swift/Moltis
///
/// Thread-safe credential storage with FHE encryption.

import Foundation

/// Credential entry
public struct FHECredential: Sendable {
    public let id: String
    public let encryptedKey: Data
    public let encryptedValue: Data
    public let threshold: UInt8
    public let owner: Data
    public let createdAt: UInt64
}

/// Thread-safe FHE Credential Vault
public final class FHECredentialVault: @unchecked Sendable {
    private let config: FHEConfig
    private var credentials: [String: FHECredential] = [:]
    private let lock = NSLock()

    init(config: FHEConfig) {
        self.config = config
    }

    /// Store an FHE-encrypted credential
    public func store(key: String, value: String) async throws -> String {
        let encryptedKey = fheEncrypt(key)
        let encryptedValue = fheEncrypt(value)

        let id = "cred_\(key)_\(credentials.count)"
        let credential = FHECredential(
            id: id,
            encryptedKey: encryptedKey,
            encryptedValue: encryptedValue,
            threshold: config.threshold,
            owner: config.contractAddress,
            createdAt: UInt64(credentials.count)
        )

        lock.lock()
        defer { lock.unlock() }
        credentials[id] = credential

        return id
    }

    /// Retrieve a credential with threshold authorization
    public func retrieve(id: String, permits: UInt8) async throws -> String {
        lock.lock()
        defer { lock.unlock() }

        guard let credential = credentials[id] else {
            throw FHEError.credentialNotFound
        }

        if permits < credential.threshold {
            throw FHEError.insufficientPermits
        }

        // FHE decryption would happen here via Fhenix CoFHE
        // Mock: return decrypted value
        return fheDecrypt(credential.encryptedValue)
    }

    /// List all credential IDs
    public func listCredentialIDs() -> [String] {
        lock.lock()
        defer { lock.unlock() }
        return Array(credentials.keys)
    }

    /// Delete a credential
    public func delete(id: String) throws {
        lock.lock()
        defer { lock.unlock() }

        if credentials.removeValue(forKey: id) == nil {
            throw FHEError.credentialNotFound
        }
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

/// FHE Errors
public enum FHEError: Error, Sendable {
    case credentialNotFound
    case insufficientPermits
    case encryptionFailed
    case decryptionFailed
}
