from typing import Dict, Any
from .config import FHEConfig
from .contracts import AgentVault
from .types import ActionResult, ActionStatus, ACTION_STATUS_TEXT


class FHESealManager:
    def __init__(self, config: FHEConfig):
        self.config = config
        self.vault = AgentVault(
            config.w3, config.account, config.contracts.action_sealer
        )
        self._pending_actions: Dict[str, dict] = {}

    def seal(self, action_type: str, params: Dict[str, Any], threshold: int = 2) -> str:
        payload = self._encrypt_json(params)
        tx_hash = self.vault.store_credential(self.config.address, payload)
        action_id = tx_hash[:42]
        self._pending_actions[action_id] = {
            "type": action_type,
            "params": params,
            "threshold": threshold,
            "approvals": [],
        }
        return action_id

    def approve(self, action_id: str) -> bool:
        action = self._pending_actions.get(action_id)
        if not action:
            raise ValueError(f"Action '{action_id}' not found")

        tx_hash = self.vault.grant_retrieve_permission(
            self.config.address, bytes.fromhex(action_id)
        )
        action["approvals"].append(self.config.address)
        return len(action["approvals"]) >= action["threshold"]

    def execute(self, action_id: str) -> Dict[str, Any]:
        action = self._pending_actions.get(action_id)
        if not action:
            raise ValueError(f"Action '{action_id}' not found")
        if len(action["approvals"]) < action["threshold"]:
            raise ValueError(
                f"Insufficient approvals: {len(action['approvals'])}/{action['threshold']}"
            )

        result = action["params"]
        del self._pending_actions[action_id]
        return result

    def _encrypt_json(self, data: Dict[str, Any]) -> bytes:
        import json

        json_str = json.dumps(data)
        return bytes.fromhex(json_str.encode().hex().ljust(64, "0"))
