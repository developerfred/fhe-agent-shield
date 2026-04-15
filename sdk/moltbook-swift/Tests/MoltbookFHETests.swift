import XCTest
@testable import MoltbookFHE

final class MoltbookFHETests: XCTestCase {

    var client: MoltbookFHEClient!

    override func setUp() async throws {
        let config = MoltbookConfig(
            network: .sepolia,
            vaultAddress: Data(repeating: 0, count: 20),
            memoryAddress: Data(repeating: 1, count: 20),
            threshold: 2
        )
        client = MoltbookFHEClient(config: config)
    }

    // MARK: - Registration Tests

    func testRegisterAgent() async throws {
        let agentID = try await client.register(name: "TestAgent", personality: "friendly")
        XCTAssertTrue(agentID.hasPrefix("agent_TestAgent_"))
    }

    // MARK: - Credential Tests

    func testStoreAndRetrieveCredential() async throws {
        let id = try await client.storeCredential(key: "api_key", value: "secret123")
        XCTAssertTrue(id.hasPrefix("cred_api_key_"))

        let value = try await client.retrieveCredential(id: id, permits: 2)
        XCTAssertEqual(value, "secret123")
    }

    func testListCredentials() async throws {
        _ = try await client.storeCredential(key: "key1", value: "value1")
        _ = try await client.storeCredential(key: "key2", value: "value2")

        let list = await client.listCredentials()
        XCTAssertEqual(list.count, 2)
    }

    func testInsufficientPermits() async throws {
        let id = try await client.storeCredential(key: "key", value: "value")

        do {
            _ = try await client.retrieveCredential(id: id, permits: 1)
            XCTFail("Expected error for insufficient permits")
        } catch FHEError.insufficientPermits {
            // Expected
        }
    }

    // MARK: - Post Tests

    func testPostContent() async throws {
        let agentID = try await client.register(name: "PostAgent", personality: nil)
        XCTAssertNotNil(agentID)

        let postID = try await client.post(content: "Hello Moltbook!", submolt: "general")
        XCTAssertTrue(postID.hasPrefix("post_"))
    }

    // MARK: - DM Tests

    func testSendDM() async throws {
        let agentID = try await client.register(name: "DMAgent", personality: nil)
        XCTAssertNotNil(agentID)

        let dmID = try await client.sendDM(to: "recipient", content: "Hello!")
        XCTAssertTrue(dmID.hasPrefix("dm_"))
    }

    // MARK: - Memory Tests

    func testAppendMemory() async throws {
        _ = try await client.register(name: "MemoryAgent", personality: nil)

        let memoryID = try await client.appendMemory(context: "Remember this")
        XCTAssertTrue(memoryID.hasPrefix("mem_"))
    }

    func testGetMemory() async throws {
        _ = try await client.register(name: "GetMemoryAgent", personality: nil)

        _ = try await client.appendMemory(context: "context1")
        _ = try await client.appendMemory(context: "context2")

        let contexts = try await client.getMemory(limit: 10)
        XCTAssertEqual(contexts.count, 2)
    }

    func testNotRegisteredError() async throws {
        do {
            _ = try await client.appendMemory(context: "should fail")
            XCTFail("Expected error for unregistered agent")
        } catch MoltbookError.notRegistered {
            // Expected
        }
    }
}
