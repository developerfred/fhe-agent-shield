from web3 import Web3
from eth_account import Account
from typing import Optional
from .types import NetworkConfig, ContractAddresses, NetworkName, NETWORKS


class FHEConfig:
    def __init__(
        self,
        network: NetworkName,
        private_key: str,
        contracts: ContractAddresses,
        rpc_url: Optional[str] = None,
    ):
        self.network_name = network
        self.network = NETWORKS.get(network)
        if not self.network:
            raise ValueError(f"Unknown network: {network}")

        if rpc_url:
            self.network = NetworkConfig(
                name=self.network.name,
                rpc_url=rpc_url,
                chain_id=self.network.chain_id,
                explorer_url=self.network.explorer_url,
            )

        self.private_key = private_key
        self.contracts = contracts
        self.account = Account.from_key(private_key)
        self.w3 = Web3(Web3.HTTPProvider(self.network.rpc_url))

        if not self.w3.is_connected():
            raise ConnectionError(f"Failed to connect to {self.network.rpc_url}")

    @property
    def address(self) -> str:
        return self.account.address

    def get_balance(self) -> int:
        return self.w3.eth.get_balance(self.address)
