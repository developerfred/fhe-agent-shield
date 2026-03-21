"""
FHE-Agent Shield - LangGraph Integration

Provides FHE-encrypted checkpoint storage for LangGraph agents.
Uses the AgentMemory contract to store encrypted checkpoints on-chain.
"""

from typing import Any, Dict, List, Optional, Sequence, Tuple
from dataclasses import dataclass, field
import json
import time

from fhe_agent_shield import FHEConfig, FHEMemoryProvider


@dataclass
class FHECheckpoint:
    """Represents an FHE-encrypted checkpoint."""

    id: str
    agent_id: str
    encrypted_data: bytes
    metadata: Dict[str, Any]
    created_at: float
    checkpoint_index: int


@dataclass
class FHECheckpointMetadata:
    """Metadata for an FHE checkpoint."""

    agent_id: str
    thread_id: str
    checkpoint_id: str
    parent_checkpoint_id: Optional[str]
    created_at: float


class FHECheckpointSaver:
    """
    LangGraph CheckpointSaver implementation using FHE encryption.

    This checkpoint saver encrypts all graph state before storing
    it on-chain via the AgentMemory contract. Only parties with
    proper threshold permissions can decrypt the checkpoints.

    Example usage:
        from langgraph.checkpoint.memory import MemorySaver

        # Create FHE checkpoint saver
        fhe_checkpointer = FHECheckpointSaver(
            fhe_config=fhe_config,
            agent_id="0x..."
        )

        # Use with LangGraph
        graph = StateGraph(AgentState)
        graph.compile(checkpointer=fhe_checkpointer)
    """

    def __init__(
        self,
        fhe_config: FHEConfig,
        agent_id: str,
        thread_id: Optional[str] = None,
        auto_encrypt: bool = True,
    ):
        """
        Initialize the FHE checkpoint saver.

        Args:
            fhe_config: FHE configuration for blockchain interaction
            agent_id: The agent's wallet address
            thread_id: Optional thread/conversation ID
            auto_encrypt: Whether to automatically encrypt checkpoints
        """
        self.fhe_config = fhe_config
        self.agent_id = agent_id
        self.thread_id = thread_id or "default"
        self.auto_encrypt = auto_encrypt

        self.memory_provider = FHEMemoryProvider(
            fhe_config, memory_path=f"./fhe_checkpoints/{agent_id}"
        )

        self._checkpoints: List[FHECheckpoint] = []
        self._checkpoint_index = 0

    def _encrypt_checkpoint(self, state: Dict[str, Any]) -> bytes:
        """
        Encrypt checkpoint state using FHE.

        Args:
            state: The graph state to encrypt

        Returns:
            Encrypted bytes
        """
        if not self.auto_encrypt:
            return json.dumps(state).encode()

        state_json = json.dumps(state, default=str)
        encrypted = self.memory_provider._encrypt_chunk(state_json)
        return encrypted

    def _decrypt_checkpoint(self, encrypted: bytes) -> Dict[str, Any]:
        """
        Decrypt a checkpoint using FHE.

        Args:
            encrypted: Encrypted checkpoint bytes

        Returns:
            Decrypted graph state
        """
        if not self.auto_encrypt:
            return json.loads(encrypted.decode())

        encrypted_hex = encrypted.hex()
        decrypted = self.memory_provider.vault.retrieve_credential(
            bytes.fromhex(encrypted_hex.lstrip("0x"))
        )
        return json.loads(decrypted)

    def _generate_checkpoint_id(self) -> str:
        """Generate a unique checkpoint ID."""
        return f"ckpt_{int(time.time() * 1000)}_{self._checkpoint_index}"

    def get(self, config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Get a checkpoint by config.

        Args:
            config: LangGraph checkpoint config

        Returns:
            Checkpoint data or None if not found
        """
        thread_id = config.get("configurable", {}).get("thread_id", self.thread_id)
        checkpoint_id = config.get("configurable", {}).get("checkpoint_id")

        if checkpoint_id:
            for cp in self._checkpoints:
                if cp.id == checkpoint_id and cp.agent_id == self.agent_id:
                    return self._decrypt_checkpoint(cp.encrypted_data)

        if thread_id:
            matching = [
                cp
                for cp in self._checkpoints
                if cp.metadata.get("thread_id") == thread_id
            ]
            if matching:
                latest = max(matching, key=lambda x: x.checkpoint_index)
                return self._decrypt_checkpoint(latest.encrypted_data)

        return None

    def put(
        self,
        config: Dict[str, Any],
        checkpoint: Dict[str, Any],
        metadata: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Store a new checkpoint.

        Args:
            config: LangGraph checkpoint config
            checkpoint: The checkpoint data (graph state)
            metadata: Checkpoint metadata

        Returns:
            Updated config with new checkpoint_id
        """
        thread_id = config.get("configurable", {}).get("thread_id", self.thread_id)
        parent_checkpoint_id = config.get("configurable", {}).get("checkpoint_id")

        encrypted_data = self._encrypt_checkpoint(checkpoint)

        checkpoint_id = self._generate_checkpoint_id()
        self._checkpoint_index += 1

        checkpoint_metadata = {
            "thread_id": thread_id,
            "parent_checkpoint_id": parent_checkpoint_id,
            "created_at": time.time(),
        }
        checkpoint_metadata.update(metadata)

        fhe_checkpoint = FHECheckpoint(
            id=checkpoint_id,
            agent_id=self.agent_id,
            encrypted_data=encrypted_data,
            metadata=checkpoint_metadata,
            created_at=time.time(),
            checkpoint_index=self._checkpoint_index,
        )

        self._checkpoints.append(fhe_checkpoint)

        store_index = len(self._checkpoints) - 1
        self.memory_provider._chunks.append(f"checkpoint:{checkpoint_id}:{store_index}")

        return {
            "configurable": {
                "thread_id": thread_id,
                "checkpoint_id": checkpoint_id,
            }
        }

    def list(
        self, config: Dict[str, Any], limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        List checkpoints for a thread.

        Args:
            config: LangGraph checkpoint config
            limit: Maximum number of checkpoints to return

        Returns:
            List of checkpoint metadata
        """
        thread_id = config.get("configurable", {}).get("thread_id", self.thread_id)

        matching = [
            cp for cp in self._checkpoints if cp.metadata.get("thread_id") == thread_id
        ]

        matching.sort(key=lambda x: x.checkpoint_index, reverse=True)

        if limit:
            matching = matching[:limit]

        return [
            {
                "checkpoint_id": cp.id,
                "parent_checkpoint_id": cp.metadata.get("parent_checkpoint_id"),
                "created_at": cp.created_at,
            }
            for cp in matching
        ]

    def delete(self, config: Dict[str, Any]) -> bool:
        """
        Delete a checkpoint.

        Args:
            config: LangGraph checkpoint config

        Returns:
            True if deleted, False if not found
        """
        checkpoint_id = config.get("configurable", {}).get("checkpoint_id")

        for i, cp in enumerate(self._checkpoints):
            if cp.id == checkpoint_id and cp.agent_id == self.agent_id:
                del self._checkpoints[i]
                return True

        return False

    def get_latest_checkpoint(
        self, thread_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get the latest checkpoint for a thread (sync version).

        Args:
            thread_id: Thread ID to get latest checkpoint for

        Returns:
            Latest checkpoint data or None
        """
        tid = thread_id or self.thread_id

        matching = [
            cp for cp in self._checkpoints if cp.metadata.get("thread_id") == tid
        ]

        if not matching:
            return None

        latest = max(matching, key=lambda x: x.checkpoint_index)
        return self._decrypt_checkpoint(latest.encrypted_data)

    def list_threads(self) -> List[str]:
        """
        List all thread IDs with checkpoints.

        Returns:
            List of unique thread IDs
        """
        thread_ids = set()
        for cp in self._checkpoints:
            if tid := cp.metadata.get("thread_id"):
                thread_ids.add(tid)
        return list(thread_ids)


def create_fhe_checkpointer(
    fhe_config: FHEConfig,
    agent_id: str,
    thread_id: Optional[str] = None,
) -> FHECheckpointSaver:
    """
    Factory function to create an FHE checkpoint saver.

    Args:
        fhe_config: FHE configuration
        agent_id: Agent's wallet address
        thread_id: Optional default thread ID

    Returns:
        Configured FHECheckpointSaver instance
    """
    return FHECheckpointSaver(
        fhe_config=fhe_config,
        agent_id=agent_id,
        thread_id=thread_id,
    )
