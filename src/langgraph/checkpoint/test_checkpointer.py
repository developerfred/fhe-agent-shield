"""
Tests for FHE Checkpoint Saver for LangGraph
"""

import pytest
from fhe_checkpointer import FHECheckpointSaver, CheckpointConfig


@pytest.fixture
def checkpointer():
    config = CheckpointConfig(
        contract_address="0x" + "0" * 40,
        threshold=2,
    )
    return FHECheckpointSaver(config)


@pytest.mark.asyncio
async def test_put_and_get_checkpoint(checkpointer):
    """Test storing and retrieving a checkpoint"""
    await checkpointer.aput(
        thread_id="thread-1",
        checkpoint_id="cp-1",
        data={"agent_id": "agent-1", "state": "working"},
    )

    result = await checkpointer.aget(thread_id="thread-1", checkpoint_id="cp-1")

    assert result is not None
    assert result["checkpoint_id"] == "cp-1"


@pytest.mark.asyncio
async def test_get_latest_checkpoint(checkpointer):
    """Test getting the latest checkpoint"""
    await checkpointer.aput(
        thread_id="thread-1",
        checkpoint_id="cp-1",
        data={"agent_id": "agent-1", "state": "step1"},
    )
    await checkpointer.aput(
        thread_id="thread-1",
        checkpoint_id="cp-2",
        data={"agent_id": "agent-1", "state": "step2"},
    )

    result = await checkpointer.aget(thread_id="thread-1")

    assert result is not None
    assert result["checkpoint_id"] == "cp-2"


@pytest.mark.asyncio
async def test_list_checkpoints(checkpointer):
    """Test listing checkpoints"""
    for i in range(3):
        await checkpointer.aput(
            thread_id="thread-1",
            checkpoint_id=f"cp-{i}",
            data={"agent_id": "agent-1", "step": i},
        )

    checkpoints = await checkpointer.alist(thread_id="thread-1", limit=10)

    assert len(checkpoints) == 3


@pytest.mark.asyncio
async def test_delete_checkpoint(checkpointer):
    """Test deleting a checkpoint"""
    await checkpointer.aput(
        thread_id="thread-1",
        checkpoint_id="cp-1",
        data={"agent_id": "agent-1"},
    )

    deleted = await checkpointer.adelete(thread_id="thread-1", checkpoint_id="cp-1")
    assert deleted is True

    result = await checkpointer.aget(thread_id="thread-1", checkpoint_id="cp-1")
    assert result is None


@pytest.mark.asyncio
async def test_checkpoint_not_found(checkpointer):
    """Test getting non-existent checkpoint"""
    result = await checkpointer.aget(thread_id="nonexistent", checkpoint_id="cp-1")
    assert result is None
