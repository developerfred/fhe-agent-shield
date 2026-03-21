from dataclasses import dataclass
from enum import Enum
from typing import List, Dict, Any, Optional


class NetworkName(Enum):
    FHENIX_HELIUM = "fhenix-helium"
    FHENIX_NITROGEN = "fhenix-nitrogen"
    ARBITRUM_SEPOLIA = "arbitrum-sepolia"
    BASE_SEPOLIA = "base-sepolia"


@dataclass
class NetworkConfig:
    name: str
    rpc_url: str
    chain_id: int
    explorer_url: str


NETWORKS = {
    NetworkName.FHENIX_HELIUM: NetworkConfig(
        name="fhenix-helium",
        rpc_url="https://api.helium.fhenix.zone",
        chain_id=8008135,
        explorer_url="https://explorer.helium.fhenix.zone",
    ),
    NetworkName.FHENIX_NITROGEN: NetworkConfig(
        name="fhenix-nitrogen",
        rpc_url="https://api.nitrogen.fhenix.zone",
        chain_id=8008148,
        explorer_url="https://explorer.nitrogen.fhenix.zone",
    ),
    NetworkName.ARBITRUM_SEPOLIA: NetworkConfig(
        name="arbitrum-sepolia",
        rpc_url="https://sepolia-rollup.arbitrum.io/rpc",
        chain_id=421614,
        explorer_url="https://sepolia.arbiscan.io",
    ),
    NetworkName.BASE_SEPOLIA: NetworkConfig(
        name="base-sepolia",
        rpc_url="https://sepolia.base.org",
        chain_id=84532,
        explorer_url="https://sepolia.basescan.org",
    ),
}


@dataclass
class ContractAddresses:
    agent_vault: str
    agent_memory: str
    skill_registry: str
    action_sealer: str


@dataclass
class CredentialResult:
    handle: str
    success: bool


@dataclass
class CredentialEntry:
    key: str
    handle: str
    threshold: int


@dataclass
class ActionResult:
    action_id: str
    success: bool


@dataclass
class ActionStatus:
    status: int
    status_text: str


class ActionStatusEnum:
    SEALED = 0
    APPROVED = 1
    RELEASED = 2
    CANCELLED = 3


ACTION_STATUS_TEXT = {
    0: "Sealed",
    1: "Approved",
    2: "Released",
    3: "Cancelled",
}
