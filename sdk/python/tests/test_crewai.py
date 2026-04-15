"""
Tests for CrewAI FHE Integration

These tests verify the FHE-encrypted memory and credential handlers
work correctly with CrewAI agents.
"""

import pytest
from unittest.mock import Mock, MagicMock, patch
from typing import List, Dict, Any

from fhe_agent_shield.crewai import (
    CrewAICrewConfig,
    FHEMemoryHandler,
    FHECredentialHandler,
    FHETaskCallback,
    create_fhe_crew_callback,
    create_fhe_memory_handler,
    create_fhe_credential_handler,
)
from fhe_agent_shield import FHEConfig, NetworkName


@pytest.fixture
def mock_fhe_config():
    """Create a mock FHE configuration."""
    with patch("fhe_agent_shield.crewai.FHEConfig") as mock_config:
        config = Mock(spec=FHEConfig)
        config.network = NetworkName.SEPOLIA
        config.address = "0x" + "11" * 20
        config.private_key = "0x" + "22" * 32
        yield config


@pytest.fixture
def crew_config(mock_fhe_config):
    """Create a CrewAI FHE configuration."""
    return CrewAICrewConfig(
        fhe_config=mock_fhe_config,
        memory_storage_interval=50,
        enable_memory_encryption=True,
        enable_credential_encryption=True,
    )


class TestCrewAICrewConfig:
    """Tests for CrewAICrewConfig."""

    def test_config_creation(self, mock_fhe_config):
        """Test configuration creation with defaults."""
        config = CrewAICrewConfig(fhe_config=mock_fhe_config)

        assert config.fhe_config == mock_fhe_config
        assert config.memory_storage_interval == 100
        assert config.enable_memory_encryption is True
        assert config.enable_credential_encryption is True

    def test_config_custom_values(self, mock_fhe_config):
        """Test configuration with custom values."""
        config = CrewAICrewConfig(
            fhe_config=mock_fhe_config,
            memory_storage_interval=200,
            enable_memory_encryption=False,
            enable_credential_encryption=False,
        )

        assert config.memory_storage_interval == 200
        assert config.enable_memory_encryption is False
        assert config.enable_credential_encryption is False


class TestFHEMemoryHandler:
    """Tests for FHEMemoryHandler."""

    def test_store_task_result(self, crew_config):
        """Test storing a task result."""
        with patch("fhe_agent_shield.crewai.FHEMemoryProvider") as mock_provider:
            mock_instance = MagicMock()
            mock_instance.append.return_value = "0x" + "aa" * 32
            mock_provider.return_value = mock_instance

            handler = FHEMemoryHandler(crew_config)
            handler.memory_provider = mock_instance

            tx_hash = handler.store_task_result("task-1", "result data")

            assert tx_hash == "0x" + "aa" * 32
            mock_instance.append.assert_called_once()

    def test_store_task_context(self, crew_config):
        """Test storing task context."""
        with patch("fhe_agent_shield.crewai.FHEMemoryProvider") as mock_provider:
            mock_instance = MagicMock()
            mock_instance.append.return_value = "0x" + "bb" * 32
            mock_provider.return_value = mock_instance

            handler = FHEMemoryHandler(crew_config)
            handler.memory_provider = mock_instance

            context = {"key": "value", "number": 42}
            tx_hash = handler.store_task_context("task-1", context)

            assert tx_hash == "0x" + "bb" * 32
            mock_instance.append.assert_called_once()

    def test_get_recent_context(self, crew_config):
        """Test retrieving recent context."""
        with patch("fhe_agent_shield.crewai.FHEMemoryProvider") as mock_provider:
            mock_instance = MagicMock()
            mock_instance._chunks = ["0x" + "cc" * 32, "0x" + "dd" * 32]
            mock_instance.get_context.return_value = ["chunk1", "chunk2"]
            mock_provider.return_value = mock_instance

            handler = FHEMemoryHandler(crew_config)
            handler.memory_provider = mock_instance

            result = handler.get_recent_context(count=2)

            assert result == ["chunk1", "chunk2"]

    def test_clear_memory(self, crew_config):
        """Test clearing memory."""
        with patch("fhe_agent_shield.crewai.FHEMemoryProvider") as mock_provider:
            mock_instance = MagicMock()
            mock_instance._chunks = ["chunk1", "chunk2", "chunk3"]
            mock_provider.return_value = mock_instance

            handler = FHEMemoryHandler(crew_config)
            handler.memory_provider = mock_instance

            handler.clear_memory()

            assert mock_instance._chunks == []

    def test_memory_disabled(self, crew_config):
        """Test behavior when memory encryption is disabled."""
        crew_config.enable_memory_encryption = False

        with patch("fhe_agent_shield.crewai.FHEMemoryProvider") as mock_provider:
            handler = FHEMemoryHandler(crew_config)
            handler.memory_provider._chunks = ["chunk1", "chunk2", "chunk3"]

            result = handler.get_recent_context(count=5)
            assert result == []
            mock_provider.assert_called_once()


class TestFHECredentialHandler:
    """Tests for FHECredentialHandler."""

    def test_store_api_key(self, crew_config):
        """Test storing an API key."""
        with patch("fhe_agent_shield.crewai.FHECredentialStore") as mock_store:
            mock_instance = MagicMock()
            mock_instance.store.return_value = "0x" + "ee" * 32
            mock_store.return_value = mock_instance

            handler = FHECredentialHandler(crew_config)
            handler.credential_store = mock_instance

            approvers = ["0x" + "11" * 20, "0x" + "22" * 20]
            tx_hash = handler.store_api_key("openai", "sk-123456", approvers)

            assert tx_hash == "0x" + "ee" * 32
            mock_instance.store.assert_called_once_with("openai", "sk-123456")

    def test_get_api_key(self, crew_config):
        """Test retrieving an API key."""
        with patch("fhe_agent_shield.crewai.FHECredentialStore") as mock_store:
            mock_instance = MagicMock()
            mock_instance.retrieve.return_value = "sk-123456"
            mock_store.return_value = mock_instance

            handler = FHECredentialHandler(crew_config)
            handler.credential_store = mock_instance

            approvers = ["0x" + "11" * 20]
            api_key = handler.get_api_key("openai", approvers)

            assert api_key == "sk-123456"

    def test_list_credentials(self, crew_config):
        """Test listing credentials."""
        with patch("fhe_agent_shield.crewai.FHECredentialStore") as mock_store:
            from fhe_agent_shield.types import CredentialEntry

            mock_instance = MagicMock()
            mock_instance.list.return_value = [
                CredentialEntry(key="key1", handle="0x" + "ff" * 32, threshold=1),
                CredentialEntry(key="key2", handle="0x" + "gg" * 32, threshold=2),
            ]
            mock_store.return_value = mock_instance

            handler = FHECredentialHandler(crew_config)
            handler.credential_store = mock_instance

            credentials = handler.list_credentials()

            assert len(credentials) == 2
            assert credentials[0]["key"] == "key1"
            assert credentials[1]["key"] == "key2"


class TestFHETaskCallback:
    """Tests for FHETaskCallback."""

    def test_on_task_start(self, crew_config):
        """Test task start callback."""
        with (
            patch("fhe_agent_shield.crewai.FHEMemoryHandler") as mock_mem,
            patch("fhe_agent_shield.crewai.FHECredentialHandler") as mock_cred,
        ):
            mock_mem.return_value = MagicMock()
            mock_cred.return_value = MagicMock()

            callback = FHETaskCallback(crew_config)
            result = callback.on_task_start("task-1", {"input": "data"})

            assert result == {"input": "data"}

    def test_on_task_complete(self, crew_config):
        """Test task complete callback."""
        with (
            patch("fhe_agent_shield.crewai.FHEMemoryHandler") as mock_mem,
            patch("fhe_agent_shield.crewai.FHECredentialHandler") as mock_cred,
        ):
            mock_memory = MagicMock()
            mock_memory.store_task_result.return_value = "0x" + "hh" * 32
            mock_mem.return_value = mock_memory
            mock_cred.return_value = MagicMock()

            callback = FHETaskCallback(crew_config)
            tx_hash = callback.on_task_complete("task-1", "task result")

            assert tx_hash == "0x" + "hh" * 32
            mock_memory.store_task_result.assert_called_once()

    def test_on_task_error(self, crew_config):
        """Test task error callback."""
        with (
            patch("fhe_agent_shield.crewai.FHEMemoryHandler") as mock_mem,
            patch("fhe_agent_shield.crewai.FHECredentialHandler") as mock_cred,
        ):
            mock_memory = MagicMock()
            mock_memory.store_task_context.return_value = "0x" + "ii" * 32
            mock_mem.return_value = mock_memory
            mock_cred.return_value = MagicMock()

            callback = FHETaskCallback(crew_config)

            error = ValueError("test error")
            callback.on_task_error("task-1", error)

            mock_memory.store_task_context.assert_called_once()


class TestFactoryFunctions:
    """Tests for factory functions."""

    def test_create_fhe_crew_callback(self, crew_config):
        """Test factory function for callback creation."""
        with patch("fhe_agent_shield.crewai.FHETaskCallback") as mock_callback:
            mock_callback.return_value = MagicMock(spec=FHETaskCallback)

            callback = create_fhe_crew_callback(crew_config)

            assert callback is not None

    def test_create_fhe_memory_handler(self, crew_config):
        """Test factory function for memory handler creation."""
        with patch("fhe_agent_shield.crewai.FHEMemoryHandler") as mock_handler:
            mock_handler.return_value = MagicMock(spec=FHEMemoryHandler)

            handler = create_fhe_memory_handler(crew_config)

            assert handler is not None

    def test_create_fhe_credential_handler(self, crew_config):
        """Test factory function for credential handler creation."""
        with patch("fhe_agent_shield.crewai.FHECredentialHandler") as mock_handler:
            mock_handler.return_value = MagicMock(spec=FHECredentialHandler)

            handler = create_fhe_credential_handler(crew_config)

            assert handler is not None
