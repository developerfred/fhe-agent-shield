package com.fhenix.moltbook

import kotlin.test.*

class MoltbookFHETests {

    private lateinit var client: MoltbookFHEClient

    @BeforeTest
    fun setup() {
        client = MoltbookFHEClient(MoltbookConfig())
    }

    @Test
    fun testRegisterAgent() = suspendTest {
        val agentId = client.register("TestAgent", "friendly")
        assertTrue(agentId.startsWith("agent_TestAgent_"))
    }

    @Test
    fun testStoreAndRetrieveCredential() = suspendTest {
        val id = client.storeCredential("api_key", "secret123")
        assertTrue(id.startsWith("cred_api_key_"))

        val value = client.retrieveCredential(id, 2)
        assertEquals("secret123", value)
    }

    @Test
    fun testInsufficientPermits() = suspendTest {
        val id = client.storeCredential("key", "value")

        assertFailsWith<MoltbookException>("Insufficient permits") {
            client.retrieveCredential(id, 1)
        }
    }

    @Test
    fun testListCredentials() = suspendTest {
        client.storeCredential("key1", "value1")
        client.storeCredential("key2", "value2")

        val list = client.listCredentials()
        assertEquals(2, list.size)
    }

    @Test
    fun testPostContent() = suspendTest {
        client.register("PostAgent")
        val postId = client.post("Hello Moltbook!", "general")
        assertTrue(postId.startsWith("post_"))
    }

    @Test
    fun testSendDM() = suspendTest {
        client.register("DMAgent")
        val dmId = client.sendDM("recipient", "Hello!")
        assertTrue(dmId.startsWith("dm_"))
    }

    @Test
    fun testAppendMemory() = suspendTest {
        client.register("MemoryAgent")
        val memoryId = client.appendMemory("Remember this")
        assertTrue(memoryId.startsWith("mem_"))
    }

    @Test
    fun testGetMemory() = suspendTest {
        client.register("GetMemoryAgent")
        client.appendMemory("context1")
        client.appendMemory("context2")

        val contexts = client.getMemory(10)
        assertEquals(2, contexts.size)
    }

    @Test
    fun testNotRegisteredError() = suspendTest {
        assertFailsWith<MoltbookException>("Agent not registered") {
            client.appendMemory("should fail")
        }
    }
}
