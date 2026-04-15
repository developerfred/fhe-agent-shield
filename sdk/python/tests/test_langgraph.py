"""
Tests for LangGraph FHE Checkpoint Integration

These tests verify the FHE-encrypted checkpoint saver works
correctly with LangGraph agents.
"""

import pytest
from unittest.mock import Mock, MagicMock, patch
from typing import Dict, Any, Optional

from fhe_agent_shield.langgraph import (
    FHECheckpoint,
    FHECheckpointSaver,
    create_fhe_checkpointer,
)
from fhe_agent_shield import FHEConfig, NetworkName


@pytest.fixture
def mock_fhe_config():
    """Create a mock FHE configuration."""
    with patch("fhe_agent_shield.langgraph.FHEConfig") as mock_config:
        config = Mock(spec=FHEConfig)
        config.network = NetworkName.SEPOLIA
        config.address = "0x" + "11" * 20
        config.private_key = "0x" + "22" * 32
        yield config


@pytest.fixture
def checkpointer(mock_fhe_config):
    """Create a checkpoint saver instance."""
    with patch("fhe_agent_shield.langgraph.FHEMemoryProvider") as mock_provider:
        mock_instance = MagicMock()
        mock_instance._encrypt_chunk.return_value = b"encrypted_data"
        mock_provider.return_value = mock_instance

        saver = FHECheckpointSaver(
            fhe_config=mock_fhe_config,
            agent_id="0x" + "33" * 20,
            thread_id="test-thread",
        )
        saver.memory_provider = mock_instance
        yield saver


class TestFHECheckpoint:
    """Tests for FHECheckpoint dataclass."""

    def test_checkpoint_creation(self):
        """Test creating a checkpoint."""
        checkpoint = FHECheckpoint(
            id="ckpt_123",
            agent_id="0x" + "11" * 20,
            encrypted_data=b"encrypted",
            metadata={"thread_id": "test"},
            created_at=1234567890.0,
            checkpoint_index=1,
        )

        assert checkpoint.id == "ckpt_123"
        assert checkpoint.agent_id == "0x" + "11" * 20
        assert checkpoint.encrypted_data == b"encrypted"
        assert checkpoint.metadata["thread_id"] == "test"
        assert checkpoint.checkpoint_index == 1


class TestFHECheckpointSaver:
    """Tests for FHECheckpointSaver."""

    def test_initialization(self, mock_fhe_config):
        """Test checkpoint saver initialization."""
        with patch("fhe_agent_shield.langgraph.FHEMemoryProvider") as mock_provider:
            saver = FHECheckpointSaver(
                fhe_config=mock_fhe_config,
                agent_id="0x" + "44" * 20,
                thread_id="main-thread",
            )

            assert saver.agent_id == "0x" + "44" * 20
            assert saver.thread_id == "main-thread"
            assert saver.auto_encrypt is True

    def test_initialization_default_thread(self, mock_fhe_config):
        """Test initialization with default thread ID."""
        with patch("fhe_agent_shield.langgraph.FHEMemoryProvider"):
            saver = FHECheckpointSaver(
                fhe_config=mock_fhe_config,
                agent_id="0x" + "55" * 20,
            )

            assert saver.thread_id == "default"

    def test_put_creates_checkpoint(self, checkpointer):
        """Test storing a checkpoint."""
        config = {"configurable": {"thread_id": "test-thread"}}
        checkpoint_data = {"messages": ["hello"], "state": "active"}
        metadata = {"source": "user"}

        result = checkpointer.put(config, checkpoint_data, metadata)

        assert "configurable" in result
        assert "checkpoint_id" in result["configurable"]
        assert len(checkpointer._checkpoints) == 1

    def test_get_retrieves_checkpoint(self, checkpointer):
        """Test retrieving a checkpoint."""
        checkpointer.auto_encrypt = False  # Disable encryption for simple test
        config1 = {"configurable": {"thread_id": "test-thread"}}
        checkpoint_data = {"messages": ["hello"], "state": "active"}

        checkpointer.put(config1, checkpoint_data, {"source": "user"})

        checkpoint_id = checkpointer._checkpoints[0].id
        config2 = {
            "configurable": {"thread_id": "test-thread", "checkpoint_id": checkpoint_id}
        }

        retrieved = checkpointer.get(config2)

        assert retrieved is not None
        assert retrieved == checkpoint_data

    def test_get_returns_none_for_missing(self, checkpointer):
        """Test retrieving non-existent checkpoint."""
        config = {"configurable": {"thread_id": "nonexistent-thread"}}

        result = checkpointer.get(config)

        assert result is None

    def test_list_lists_checkpoints(self, checkpointer):
        """Test listing checkpoints."""
        config = {"configurable": {"thread_id": "test-thread"}}

        checkpointer.put(config, {"data": "1"}, {"source": "user"})
        checkpointer.put(config, {"data": "2"}, {"source": "user"})
        checkpointer.put(config, {"data": "3"}, {"source": "user"})

        checkpoints = checkpointer.list(config, limit=2)

        assert len(checkpoints) == 2

    def test_list_without_limit(self, checkpointer):
        """Test listing all checkpoints."""
        config = {"configurable": {"thread_id": "test-thread"}}

        for i in range(5):
            checkpointer.put(config, {"data": str(i)}, {"source": "user"})

        checkpoints = checkpointer.list(config)

        assert len(checkpoints) == 5

    def test_delete_removes_checkpoint(self, checkpointer):
        """Test deleting a checkpoint."""
        config = {"configurable": {"thread_id": "test-thread"}}

        checkpointer.put(config, {"data": "test"}, {"source": "user"})
        checkpoint_id = checkpointer._checkpoints[0].id

        delete_config = {"configurable": {"checkpoint_id": checkpoint_id}}
        result = checkpointer.delete(delete_config)

        assert result is True
        assert len(checkpointer._checkpoints) == 0

    def test_delete_returns_false_for_missing(self, checkpointer):
        """Test deleting non-existent checkpoint."""
        delete_config = {"configurable": {"checkpoint_id": "nonexistent"}}

        result = checkpointer.delete(delete_config)

        assert result is False

    def test_get_latest_checkpoint(self, checkpointer):
        """Test getting the latest checkpoint."""
        checkpointer.auto_encrypt = False  # Disable encryption for simple test
        config = {"configurable": {"thread_id": "test-thread"}}

        checkpointer.put(config, {"data": "first"}, {"source": "user"})
        checkpointer.put(config, {"data": "second"}, {"source": "user"})
        checkpointer.put(config, {"data": "third"}, {"source": "user"})

        latest = checkpointer.get_latest_checkpoint("test-thread")

        assert latest == {"data": "third"}

    def test_get_latest_checkpoint_returns_none(self, checkpointer):
        """Test getting latest when no checkpoints exist."""
        latest = checkpointer.get_latest_checkpoint("empty-thread")

        assert latest is None

    def test_list_threads(self, checkpointer):
        """Test listing all threads with checkpoints."""
        config1 = {"configurable": {"thread_id": "thread-1"}}
        config2 = {"configurable": {"thread_id": "thread-2"}}

        checkpointer.put(config1, {"data": "a"}, {"source": "user"})
        checkpointer.put(config2, {"data": "b"}, {"source": "user"})
        checkpointer.put(config1, {"data": "c"}, {"source": "user"})

        threads = checkpointer.list_threads()

        assert "thread-1" in threads
        assert "thread-2" in threads

    def test_checkpoint_id_uniqueness(self, checkpointer):
        """Test that checkpoint IDs are unique."""
        config = {"configurable": {"thread_id": "test-thread"}}

        ids = []
        for i in range(10):
            result = checkpointer.put(config, {"data": str(i)}, {"source": "user"})
            ids.append(result["configurable"]["checkpoint_id"])

        assert len(set(ids)) == 10


class TestFactoryFunction:
    """Tests for factory function."""

    def test_create_fhe_checkpointer(self, mock_fhe_config):
        """Test factory function creates checkpointer."""
        with patch("fhe_agent_shield.langgraph.FHECheckpointSaver") as mock_saver:
            mock_saver.return_value = MagicMock(spec=FHECheckpointSaver)

            checkpointer = create_fhe_checkpointer(
                fhe_config=mock_fhe_config,
                agent_id="0x" + "66" * 20,
                thread_id="factory-thread",
            )

            assert checkpointer is not None

    def test_create_fhe_checkpointer_without_thread(self, mock_fhe_config):
        """Test factory function without thread ID."""
        with patch("fhe_agent_shield.langgraph.FHECheckpointSaver") as mock_saver:
            mock_saver.return_value = MagicMock(spec=FHECheckpointSaver)

            checkpointer = create_fhe_checkpointer(
                fhe_config=mock_fhe_config,
                agent_id="0x" + "77" * 20,
            )

            assert checkpointer is not None


class TestEncryptionBehavior:
    """Tests for encryption behavior."""

    def test_auto_encrypt_true(self, mock_fhe_config):
        """Test with auto encrypt enabled."""
        with patch("fhe_agent_shield.langgraph.FHEMemoryProvider") as mock_provider:
            mock_instance = MagicMock()
            mock_instance._encrypt_chunk.return_value = b"encrypted_bytes"
            mock_provider.return_value = mock_instance

            saver = FHECheckpointSaver(
                fhe_config=mock_fhe_config,
                agent_id="0x" + "88" * 20,
                auto_encrypt=True,
            )

            saver.memory_provider = mock_instance

            config = {"configurable": {"thread_id": "test"}}
            saver.put(config, {"data": "test"}, {})

            mock_instance._encrypt_chunk.assert_called_once()

    def test_auto_encrypt_false(self, mock_fhe_config):
        """Test with auto encrypt disabled."""
        with patch("fhe_agent_shield.langgraph.FHEMemoryProvider") as mock_provider:
            mock_instance = MagicMock()
            mock_provider.return_value = mock_instance

            saver = FHECheckpointSaver(
                fhe_config=mock_fhe_config,
                agent_id="0x" + "99" * 20,
                auto_encrypt=False,
            )

            saver.memory_provider = mock_instance

            config = {"configurable": {"thread_id": "test"}}
            saver.put(config, {"data": "test"}, {})

            mock_instance._encrypt_chunk.assert_not_called()
