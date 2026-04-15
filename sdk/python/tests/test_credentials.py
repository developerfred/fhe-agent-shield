import pytest
from fhe_agent_shield import NetworkName, NETWORKS, ContractAddresses


def test_networks_have_four_entries():
    assert len(NETWORKS) == 4


def test_ethereum_sepolia_chain_id():
    assert NETWORKS[NetworkName.SEPOLIA].chain_id == 11155111


def test_arbitrum_sepolia_chain_id():
    assert NETWORKS[NetworkName.ARBITRUM_SEPOLIA].chain_id == 421614


def test_arbitrum_sepolia_chain_id():
    assert NETWORKS[NetworkName.ARBITRUM_SEPOLIA].chain_id == 421614


def test_base_sepolia_chain_id():
    assert NETWORKS[NetworkName.BASE_SEPOLIA].chain_id == 84532


def test_contract_addresses_valid():
    contracts = ContractAddresses(
        agent_vault="0x818eA3862861e82586A4D6E1A78A1a657FC615aa",
        agent_memory="0x6D31CEaaa0588A62fFb99eCa3Bde0F22Bd7DBb7B",
        skill_registry="0xaA19aff541ed6eBF528f919592576baB138370DC",
        action_sealer="0x76f18Cc5F9DB41905a285866B9277Ac451F3f75B",
    )
    assert contracts.agent_vault.startswith("0x")
