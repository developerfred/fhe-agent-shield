from typing import List, Dict
from .config import FHEConfig
from .contracts import AgentVault
from .types import CredentialResult, CredentialEntry


class FHECredentialStore:
    def __init__(self, config: FHEConfig):
        self.config = config
        self.vault = AgentVault(config.w3, config.account, config.contracts.agent_vault)
        self._credentials: Dict[str, str] = {}

    def store(self, key: str, value: str) -> str:
        encrypted = self._encrypt_value(value)
        tx_hash = self.vault.store_credential(self.config.address, encrypted)
        self._credentials[key] = tx_hash
        return tx_hash

    def retrieve(self, key: str, approvers: List[str]) -> str:
        handle = self._credentials.get(key)
        if not handle:
            raise ValueError(f"Credential '{key}' not found")
        handle_bytes = bytes.fromhex(handle) if isinstance(handle, str) else handle
        return self.vault.retrieve_credential(handle_bytes)

    def list(self) -> List[CredentialEntry]:
        return [
            CredentialEntry(key=key, handle=handle, threshold=1)
            for key, handle in self._credentials.items()
        ]

    def _encrypt_value(self, value: str) -> bytes:
        return bytes.fromhex(value.encode().hex().ljust(64, "0"))
