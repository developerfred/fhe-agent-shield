from typing import List
from .config import FHEConfig
from .contracts import AgentVault


class FHEMemoryProvider:
    def __init__(self, config: FHEConfig, memory_path: str = "./memory"):
        self.config = config
        self.vault = AgentVault(
            config.w3, config.account, config.contracts.agent_memory
        )
        self.memory_path = memory_path
        self._chunks: List[str] = []

    def append(self, content: str) -> int:
        encrypted = self._encrypt_chunk(content)
        tx_hash = self.vault.store_credential(self.config.address, encrypted)
        self._chunks.append(tx_hash)
        return len(self._chunks)

    def get_context(self, start: int, end: int) -> List[str]:
        handles = self._chunks[start:end]
        return [
            self.vault.retrieve_credential(bytes.fromhex(h)).decode() for h in handles
        ]

    def _encrypt_chunk(self, content: str) -> bytes:
        return bytes.fromhex(content.encode().hex().ljust(64, "0"))
