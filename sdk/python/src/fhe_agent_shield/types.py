from dataclasses import dataclass
from enum import Enum
from typing import List, Dict, Any, Optional


class NetworkName(Enum):
    """CoFHE-supported host chains.

    Fhenix CoFHE is a coprocessor that runs on existing EVM chains rather than
    a dedicated L1/L2. The legacy Fhenix L2 testnets (Helium, Nitrogen) have
    been retired.

    See: https://cofhe-docs.fhenix.zone/get-started/introduction/compatibility
    """

    ETHEREUM_SEPOLIA = "ethereum-sepolia"
    ARBITRUM_SEPOLIA = "arbitrum-sepolia"
    BASE_SEPOLIA = "base-sepolia"


@dataclass
class NetworkConfig:
    name: str
    rpc_url: str
    chain_id: int
    explorer_url: str


NETWORKS = {
    NetworkName.ETHEREUM_SEPOLIA: NetworkConfig(
        name="ethereum-sepolia",
        rpc_url="https://rpc.sepolia.org",
        chain_id=11155111,
        explorer_url="https://sepolia.etherscan.io",
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
