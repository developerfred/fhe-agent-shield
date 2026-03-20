"""
FHE Memory Layer for AutoGen

Provides FHE-encrypted memory for AutoGen multi-agent conversations.
"""

from typing import Any, Optional
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class ConversationMemory:
    """FHE-encrypted conversation memory"""

    memory_id: str
    agent_id: str
    encrypted_messages: list[str]
    created_at: int


@dataclass
class GroupChatMemory:
    """FHE-encrypted group chat memory"""

    group_id: str
    agents: list[str]
    encrypted_history: list[str]
    created_at: int


class FHEMemoryAgent:
    """
    AutoGen ConversableAgent with FHE memory.

    Wraps AutoGen's ConversableAgent with FHE-encrypted memory storage on Fhenix.
    Server CANNOT decrypt - only threshold authorization releases messages.

    Usage:
        from autogen import ConversableAgent
        from fhe_memory import FHEMemoryAgent

        agent = FHEMemoryAgent(
            name="assistant",
            llm_config=llm_config,
            fhe_config={
                "contract_address": "0x...",
                "threshold": 2,
            },
        )
    """

    def __init__(
        self,
        name: str,
        system_message: Optional[str] = None,
        fhe_config: Optional[dict[str, Any]] = None,
        **kwargs,
    ):
        self.name = name
        self.system_message = system_message
        self.fhe_config = fhe_config or {}
        self.memory_store = FHEMemoryStore(
            contract_address=self.fhe_config.get("contract_address", "0x" + "0" * 40),
            threshold=self.fhe_config.get("threshold", 2),
        )

    def _encrypt(self, data: str) -> str:
        """Mock FHE encryption"""
        return data.encode().hex()

    def _decrypt(self, encrypted: str) -> str:
        """Mock FHE decryption"""
        return bytes.fromhex(encrypted).decode()

    async def aadd_message(self, message: str) -> str:
        """Add message to FHE-encrypted memory"""
        return await self.memory_store.append(
            agent_id=self.name,
            context=message,
        )

    async def aget_messages(self, limit: int = 10) -> list[str]:
        """Get decrypted messages from memory"""
        return await self.memory_store.get_context(
            agent_id=self.name,
            limit=limit,
        )


class FHEMemoryStore:
    """
    FHE-encrypted memory store for AutoGen.

    Stores conversation history encrypted on Fhenix blockchain.
    """

    def __init__(self, contract_address: str, threshold: int = 2):
        self.contract_address = contract_address
        self.threshold = threshold
        self.memories: dict[str, list[str]] = {}

    async def append(
        self,
        agent_id: str,
        context: str,
    ) -> str:
        """Append encrypted context to memory"""
        if agent_id not in self.memories:
            self.memories[agent_id] = []

        encrypted = self._encrypt(context)
        self.memories[agent_id].append(encrypted)

        memory_id = f"mem_{agent_id}_{len(self.memories[agent_id])}"

        # In production: call AgentMemory.appendContext() on Fhenix

        return memory_id

    async def get_context(
        self,
        agent_id: str,
        limit: int = 10,
    ) -> list[str]:
        """Get decrypted context with threshold authorization"""
        if agent_id not in self.memories:
            return []

        messages = self.memories[agent_id][-limit:]

        # In production: threshold decryption via Fhenix CoFHE
        decrypted = [self._decrypt(m) for m in messages]

        return decrypted

    async def create_snapshot(self, agent_id: str) -> str:
        """Create a snapshot of current memory state"""
        if agent_id not in self.memories:
            return ""

        snapshot_id = f"snap_{agent_id}_{datetime.now().timestamp()}"
        # In production: store on Fhenix

        return snapshot_id

    def _encrypt(self, data: str) -> str:
        """Mock FHE encryption"""
        return data.encode().hex()

    def _decrypt(self, encrypted: str) -> str:
        """Mock FHE decryption"""
        return bytes.fromhex(encrypted).decode()


class FHEGroupChatManager:
    """
    Group chat memory manager for AutoGen.

    Manages FHE-encrypted shared memory for multi-agent group chats.
    """

    def __init__(self, group_id: str, agents: list[str]):
        self.group_id = group_id
        self.agents = agents
        self.shared_memory: list[str] = []

    async def add_message(self, agent_id: str, message: str) -> None:
        """Add message to group chat memory"""
        if agent_id not in self.agents:
            raise ValueError(f"Agent {agent_id} not in group")

        encrypted = self._encrypt(f"{agent_id}: {message}")
        self.shared_memory.append(encrypted)

    async def get_history(self, limit: int = 50) -> list[dict[str, str]]:
        """Get group chat history with sender info"""
        messages = self.shared_memory[-limit:]

        decrypted = []
        for msg in messages:
            plain = self._decrypt(msg)
            if ": " in plain:
                agent_id, message = plain.split(": ", 1)
                decrypted.append({"agent_id": agent_id, "message": message})

        return decrypted

    def _encrypt(self, data: str) -> str:
        return data.encode().hex()

    def _decrypt(self, encrypted: str) -> str:
        return bytes.fromhex(encrypted).decode()
