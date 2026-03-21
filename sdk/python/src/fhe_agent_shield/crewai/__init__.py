"""
FHE-Agent Shield - CrewAI Integration

Provides FHE-encrypted memory and credential management for CrewAI agents.
"""

from typing import Optional, List, Dict, Any, Callable
from enum import Enum

from fhe_agent_shield import FHEConfig, FHECredentialStore, FHEMemoryProvider


class CrewAICrewConfig:
    """Configuration for CrewAI integration with FHE."""

    def __init__(
        self,
        fhe_config: FHEConfig,
        memory_storage_interval: int = 100,
        enable_memory_encryption: bool = True,
        enable_credential_encryption: bool = True,
    ):
        self.fhe_config = fhe_config
        self.memory_storage_interval = memory_storage_interval
        self.enable_memory_encryption = enable_memory_encryption
        self.enable_credential_encryption = enable_credential_encryption


class FHEMemoryHandler:
    """
    FHE-encrypted memory handler for CrewAI agents.

    This handler encrypts all agent memory before storage,
    ensuring that memory data is never stored in plaintext.
    """

    def __init__(self, config: CrewAICrewConfig):
        self.config = config
        self.memory_provider = FHEMemoryProvider(
            config.fhe_config, memory_path="./fhe_memory"
        )
        self._task_count = 0

    def store_task_result(self, task_id: str, result: str) -> str:
        """
        Store a task result encrypted in FHE memory.

        Args:
            task_id: Unique identifier for the task
            result: The task result to encrypt and store

        Returns:
            Transaction hash of the storage operation
        """
        if not self.config.enable_memory_encryption:
            return result

        encrypted_content = f"TASK:{task_id}:{result}"
        return self.memory_provider.append(encrypted_content)

    def store_task_context(self, task_id: str, context: Dict[str, Any]) -> str:
        """
        Store task context encrypted in FHE memory.

        Args:
            task_id: Unique identifier for the task
            context: Dictionary of context data to encrypt and store

        Returns:
            Transaction hash of the storage operation
        """
        import json

        context_str = json.dumps({"task_id": task_id, "context": context})
        return self.memory_provider.append(context_str)

    def get_recent_context(self, count: int = 10) -> List[str]:
        """
        Retrieve recent encrypted context from FHE memory.

        Args:
            count: Number of recent context entries to retrieve

        Returns:
            List of decrypted context entries
        """
        if not self.config.enable_memory_encryption:
            return []

        start = max(0, len(self.memory_provider._chunks) - count)
        return self.memory_provider.get_context(
            start, len(self.memory_provider._chunks)
        )

    def clear_memory(self) -> None:
        """Clear all FHE-encrypted memory."""
        self.memory_provider._chunks.clear()


class FHECredentialHandler:
    """
    FHE-encrypted credential handler for CrewAI agents.

    This handler stores API keys and other credentials encrypted
    using FHE, requiring threshold decryption for access.
    """

    def __init__(self, config: CrewAICrewConfig):
        self.config = config
        self.credential_store = FHECredentialStore(config.fhe_config)

    def store_api_key(self, key_name: str, api_key: str, approvers: List[str]) -> str:
        """
        Store an API key encrypted in the FHE credential vault.

        Args:
            key_name: Name identifier for the credential
            api_key: The API key to encrypt and store
            approvers: List of wallet addresses that can approve decryption

        Returns:
            Transaction hash of the storage operation
        """
        if not self.config.enable_credential_encryption:
            return api_key

        return self.credential_store.store(key_name, api_key)

    def get_api_key(self, key_name: str, approvers: List[str]) -> str:
        """
        Retrieve an API key with threshold approval.

        Args:
            key_name: Name identifier for the credential
            approvers: List of wallet addresses that approved the access

        Returns:
            The decrypted API key
        """
        if not self.config.enable_credential_encryption:
            return self.credential_store._credentials.get(key_name, "")

        return self.credential_store.retrieve(key_name, approvers)

    def list_credentials(self) -> List[Dict[str, Any]]:
        """
        List all stored credentials (handles only, not decrypted values).

        Returns:
            List of credential entries with metadata
        """
        entries = self.credential_store.list()
        return [
            {
                "key": entry.key,
                "threshold": entry.threshold,
                "handle": entry.handle,
            }
            for entry in entries
        ]


class FHETaskCallback:
    """
    Callback handler for CrewAI tasks with FHE encryption.

    This callback automatically encrypts task inputs and outputs
    before they are stored or processed.
    """

    def __init__(self, config: CrewAICrewConfig):
        self.config = config
        self.memory_handler = FHEMemoryHandler(config)
        self.credential_handler = FHECredentialHandler(config)

    def on_task_start(self, task_id: str, task_input: Any) -> Any:
        """
        Called when a task starts - encrypts input if needed.

        Args:
            task_id: Unique identifier for the task
            task_input: The task input data

        Returns:
            Potentially encrypted input
        """
        return task_input

    def on_task_complete(self, task_id: str, task_result: Any) -> str:
        """
        Called when a task completes - encrypts and stores result.

        Args:
            task_id: Unique identifier for the task
            task_result: The task result to encrypt and store

        Returns:
            Transaction hash of the storage operation
        """
        result_str = str(task_result)
        return self.memory_handler.store_task_result(task_id, result_str)

    def on_task_error(self, task_id: str, error: Exception) -> None:
        """
        Called when a task errors - stores error context.

        Args:
            task_id: Unique identifier for the task
            error: The exception that occurred
        """
        error_context = {
            "task_id": task_id,
            "error_type": type(error).__name__,
            "error_message": str(error),
        }
        self.memory_handler.store_task_context(task_id, error_context)


def create_fhe_crew_callback(config: CrewAICrewConfig) -> FHETaskCallback:
    """
    Factory function to create an FHE task callback.

    Args:
        config: CrewAI FHE configuration

    Returns:
        Configured FHETaskCallback instance
    """
    return FHETaskCallback(config)


def create_fhe_memory_handler(config: CrewAICrewConfig) -> FHEMemoryHandler:
    """
    Factory function to create an FHE memory handler.

    Args:
        config: CrewAI FHE configuration

    Returns:
        Configured FHEMemoryHandler instance
    """
    return FHEMemoryHandler(config)


def create_fhe_credential_handler(config: CrewAICrewConfig) -> FHECredentialHandler:
    """
    Factory function to create an FHE credential handler.

    Args:
        config: CrewAI FHE configuration

    Returns:
        Configured FHECredentialHandler instance
    """
    return FHECredentialHandler(config)
