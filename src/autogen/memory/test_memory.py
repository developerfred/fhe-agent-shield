"""
Tests for FHE Memory Layer for AutoGen
"""

import pytest
from fhe_memory import FHEMemoryAgent, FHEMemoryStore, FHEGroupChatManager


@pytest.mark.asyncio
async def test_memory_store_append():
    """Test appending to memory store"""
    store = FHEMemoryStore(contract_address="0x" + "0" * 40, threshold=2)

    memory_id = await store.append("agent-1", "Hello, world!")
    assert memory_id == "mem_agent-1_1"


@pytest.mark.asyncio
async def test_memory_store_get_context():
    """Test getting context from memory store"""
    store = FHEMemoryStore(contract_address="0x" + "0" * 40, threshold=2)

    await store.append("agent-1", "Message 1")
    await store.append("agent-1", "Message 2")

    context = await store.get_context("agent-1", limit=10)
    assert len(context) == 2
    assert "Message 1" in context


@pytest.mark.asyncio
async def test_memory_store_get_context_limit():
    """Test context limit"""
    store = FHEMemoryStore(contract_address="0x" + "0" * 40, threshold=2)

    for i in range(5):
        await store.append("agent-1", f"Message {i}")

    context = await store.get_context("agent-1", limit=3)
    assert len(context) == 3


@pytest.mark.asyncio
async def test_fhe_memory_agent():
    """Test FHE Memory Agent"""
    agent = FHEMemoryAgent(
        name="assistant",
        system_message="You are a helpful assistant",
        fhe_config={"contract_address": "0x" + "0" * 40, "threshold": 2},
    )

    await agent.aadd_message("User: Hello!")
    await agent.aadd_message("Assistant: Hi there!")

    messages = await agent.aget_messages(limit=10)
    assert len(messages) == 2


@pytest.mark.asyncio
async def test_group_chat_manager():
    """Test group chat manager"""
    manager = FHEGroupChatManager(
        group_id="group-1",
        agents=["agent-1", "agent-2"],
    )

    await manager.add_message("agent-1", "Hello everyone!")
    await manager.add_message("agent-2", "Hi agent-1!")

    history = await manager.get_history()
    assert len(history) == 2


@pytest.mark.asyncio
async def test_group_chat_unauthorized_agent():
    """Test that unauthorized agent cannot post"""
    manager = FHEGroupChatManager(
        group_id="group-1",
        agents=["agent-1"],
    )

    with pytest.raises(ValueError):
        await manager.add_message("agent-2", "Unauthorized message")
