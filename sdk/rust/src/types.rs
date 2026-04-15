use ethers::providers::{Http, Provider};
use ethers::types::Address;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Network {
    EthereumSepolia,
    ArbitrumSepolia,
    BaseSepolia,
    Local { rpc_url: String },
}

impl Network {
    pub fn chain_id(&self) -> u64 {
        match self {
            Network::EthereumSepolia => 11155111,
            Network::ArbitrumSepolia => 421614,
            Network::BaseSepolia => 84532,
            Network::Local { .. } => 31337,
        }
    }

    pub fn rpc_url(&self) -> String {
        match self {
            Network::EthereumSepolia => "https://rpc.sepolia.org".to_string(),
            Network::ArbitrumSepolia => "https://sepolia-rollup.arbitrum.io/rpc".to_string(),
            Network::BaseSepolia => "https://sepolia.base.org".to_string(),
            Network::Local { rpc_url } => rpc_url.clone(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct ContractAddresses {
    pub agent_vault: Address,
    pub agent_memory: Address,
    pub skill_registry: Address,
    pub action_sealer: Address,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CredentialResult {
    pub handle: String,
    pub success: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionResult {
    pub action_id: String,
    pub success: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ActionStatus {
    Sealed = 0,
    Approved = 1,
    Released = 2,
    Cancelled = 3,
}

impl ActionStatus {
    pub fn from_u8(v: u8) -> Option<Self> {
        match v {
            0 => Some(ActionStatus::Sealed),
            1 => Some(ActionStatus::Approved),
            2 => Some(ActionStatus::Released),
            3 => Some(ActionStatus::Cancelled),
            _ => None,
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ContractError {
    #[error("Network error: {0}")]
    Network(String),
    #[error("Contract error: {0}")]
    Error(String),
}

impl From<ethers::contract::ContractError<Provider<Http>>> for ContractError {
    fn from(err: ethers::contract::ContractError<Provider<Http>>) -> Self {
        ContractError::Error(err.to_string())
    }
}

impl From<ethers_providers::ProviderError> for ContractError {
    fn from(err: ethers_providers::ProviderError) -> Self {
        ContractError::Network(err.to_string())
    }
}

impl From<ethers::contract::ContractError<std::sync::Arc<Provider<Http>>>> for ContractError {
    fn from(err: ethers::contract::ContractError<std::sync::Arc<Provider<Http>>>) -> Self {
        ContractError::Error(err.to_string())
    }
}
