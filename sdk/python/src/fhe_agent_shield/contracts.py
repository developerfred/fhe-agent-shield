from web3 import Web3
from typing import List


class AgentVault:
    ABI = [
        {
            "name": "storeCredential",
            "inputs": [
                {"name": "agentId", "type": "address"},
                {"name": "encryptedData", "type": "bytes32"},
            ],
            "outputs": [{"name": "", "type": "bytes32"}],
            "stateMutability": "nonpayable",
            "type": "function",
        },
        {
            "name": "retrieveCredential",
            "inputs": [{"name": "handle", "type": "bytes32"}],
            "outputs": [{"name": "", "type": "string"}],
            "stateMutability": "view",
            "type": "function",
        },
        {
            "name": "grantRetrievePermission",
            "inputs": [
                {"name": "grantee", "type": "address"},
                {"name": "handle", "type": "bytes32"},
            ],
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function",
        },
        {
            "name": "credentialExists",
            "inputs": [{"name": "handle", "type": "bytes32"}],
            "outputs": [{"name": "", "type": "bool"}],
            "stateMutability": "view",
            "type": "function",
        },
        {
            "name": "getCredentialHandle",
            "inputs": [{"name": "agent", "type": "address"}],
            "outputs": [{"name": "", "type": "bytes32"}],
            "stateMutability": "view",
            "type": "function",
        },
        {
            "name": "updateThreshold",
            "inputs": [
                {"name": "agent", "type": "address"},
                {"name": "newThreshold", "type": "uint8"},
            ],
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function",
        },
        {
            "name": "getThreshold",
            "inputs": [{"name": "agent", "type": "address"}],
            "outputs": [{"name": "", "type": "uint8"}],
            "stateMutability": "view",
            "type": "function",
        },
    ]

    def __init__(self, w3: Web3, account, address: str):
        self.w3 = w3
        self.account = account
        self.address = address
        self.contract = w3.eth.contract(address, abi=self.ABI)

    def store_credential(self, agent_id: str, encrypted_data: bytes) -> str:
        tx = self.contract.functions.storeCredential(
            agent_id, encrypted_data
        ).build_transaction(
            {
                "from": self.account.address,
                "nonce": self.w3.eth.get_transaction_count(self.account.address),
                "gas": 200000,
                "gasPrice": self.w3.eth.gas_price,
            }
        )
        signed = self.account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        return tx_hash.hex()

    def retrieve_credential(self, handle: bytes) -> str:
        return self.contract.functions.retrieveCredential(handle).call()

    def grant_retrieve_permission(self, grantee: str, handle: bytes) -> str:
        tx = self.contract.functions.grantRetrievePermission(
            grantee, handle
        ).build_transaction(
            {
                "from": self.account.address,
                "nonce": self.w3.eth.get_transaction_count(self.account.address),
                "gas": 100000,
                "gasPrice": self.w3.eth.gas_price,
            }
        )
        signed = self.account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
        self.w3.eth.wait_for_transaction_receipt(tx_hash)
        return tx_hash.hex()

    def credential_exists(self, handle: bytes) -> bool:
        return self.contract.functions.credentialExists(handle).call()

    def get_credential_handle(self, agent: str) -> bytes:
        return self.contract.functions.getCredentialHandle(agent).call()

    def update_threshold(self, agent: str, new_threshold: int) -> str:
        tx = self.contract.functions.updateThreshold(
            agent, new_threshold
        ).build_transaction(
            {
                "from": self.account.address,
                "nonce": self.w3.eth.get_transaction_count(self.account.address),
                "gas": 100000,
                "gasPrice": self.w3.eth.gas_price,
            }
        )
        signed = self.account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
        self.w3.eth.wait_for_transaction_receipt(tx_hash)
        return tx_hash.hex()

    def get_threshold(self, agent: str) -> int:
        return self.contract.functions.getThreshold(agent).call()
