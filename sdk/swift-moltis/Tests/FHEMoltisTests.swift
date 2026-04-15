import XCTest
@testable import FHEMoltis

final class FHEMoltisTests: XCTestCase {

    var bridge: FHEMoltisBridge!

    override func setUp() async throws {
        let config = FHEConfig(
            network: .sepolia,
            contractAddress: Data(repeating: 0, count: 20),
            threshold: 2
        )
        bridge = FHEMoltisBridge(config: config)
    }

    // MARK: - Credential Tests

    func testStoreAndRetrieveCredential() async throws {
        let id = try await bridge.storeCredential(key: "api_key", value: "secret123")
        XCTAssertTrue(id.hasPrefix("cred_api_key_"))

        let value = try await bridge.retrieveCredential(id: id, permits: 2)
        XCTAssertEqual(value, "secret123")
    }

    func testInsufficientPermits() async throws {
        let id = try await bridge.storeCredential(key: "key", value: "value")

        do {
            _ = try await bridge.retrieveCredential(id: id, permits: 1)
            XCTFail("Expected error for insufficient permits")
        } catch FHEError.insufficientPermits {
            // Expected
        }
    }

    func testListCredentials() async throws {
        _ = try await bridge.storeCredential(key: "key1", value: "value1")
        _ = try await bridge.storeCredential(key: "key2", value: "value2")

        let list = await bridge.listCredentials()
        XCTAssertEqual(list.count, 2)
    }

    func testDeleteCredential() async throws {
        let id = try await bridge.storeCredential(key: "key", value: "value")

        try await bridge.deleteCredential(id: id)

        let list = await bridge.listCredentials()
        XCTAssertTrue(list.isEmpty)
    }

    func testCredentialNotFound() async throws {
        do {
            _ = try await bridge.retrieveCredential(id: "nonexistent", permits: 2)
            XCTFail("Expected error for nonexistent credential")
        } catch FHEError.credentialNotFound {
            // Expected
        }
    }

    // MARK: - Memory Tests

    func testAppendMemory() async throws {
        let agentID = Data(repeating: 1, count: 20)
        let id = try await bridge.appendMemory(agentID: agentID, context: "Hello")
        XCTAssertTrue(id.hasPrefix("mem_"))
    }

    func testGetMemory() async throws {
        let agentID = Data(repeating: 1, count: 20)
        _ = try await bridge.appendMemory(agentID: agentID, context: "context1")
        _ = try await bridge.appendMemory(agentID: agentID, context: "context2")

        let contexts = try await bridge.getMemory(agentID: agentID, limit: 10)
        XCTAssertEqual(contexts.count, 2)
    }

    func testSnapshotAndRestore() async throws {
        let agentID = Data(repeating: 1, count: 20)
        _ = try await bridge.appendMemory(agentID: agentID, context: "data")

        let snapshotID = try await bridge.createSnapshot(agentID: agentID)
        XCTAssertTrue(snapshotID.hasPrefix("snap_"))

        try await bridge.restoreSnapshot(agentID: agentID, snapshotID: snapshotID)

        let contexts = try await bridge.getMemory(agentID: agentID, limit: 10)
        XCTAssertEqual(contexts.count, 1)
    }

    func testMemoryLimit() async throws {
        let agentID = Data(repeating: 1, count: 20)
        for i in 0..<5 {
            _ = try await bridge.appendMemory(agentID: agentID, context: "context\(i)")
        }

        let contexts = try await bridge.getMemory(agentID: agentID, limit: 3)
        XCTAssertEqual(contexts.count, 3)
    }
}
