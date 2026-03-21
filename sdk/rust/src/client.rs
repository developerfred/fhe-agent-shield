use ethers::providers::{Http, Provider};
use ethers::signers::{LocalWallet, Signer};
use ethers::types::Address;
use ethers_contract::abigen;
use ethers_providers::Middleware;
use std::sync::Arc;

abigen!(AgentVault, "./src/abi/agent_vault.json");

pub struct FHEAgentShield {
    pub network: crate::types::Network,
    pub contracts: crate::types::ContractAddresses,
    pub provider: Arc<Provider<Http>>,
    pub wallet: LocalWallet,
    pub address: Address,
}

impl FHEAgentShield {
    pub async fn new(
        network: crate::types::Network,
        private_key: &str,
        contracts: crate::types::ContractAddresses,
    ) -> Result<Self, crate::types::ContractError> {
        let provider = Provider::<Http>::try_from(network.rpc_url())
            .map_err(|e| crate::types::ContractError::Network(e.to_string()))?;
        
        let wallet = private_key.parse::<LocalWallet>()
            .map_err(|e| crate::types::ContractError::Network(e.to_string()))?;
        
        let address = wallet.address();
        
        Ok(Self {
            network,
            contracts,
            provider: Arc::new(provider),
            wallet,
            address,
        })
    }

    pub async fn store_credential(
        &self,
        agent_id: Address,
        encrypted_data: [u8; 32],
    ) -> Result<String, crate::types::ContractError> {
        let client = Arc::clone(&self.provider);
        let vault = AgentVault::new(self.contracts.agent_vault, client);
        
        let tx = vault.store_credential(agent_id, encrypted_data.into());
        let pending = tx.send().await?;
        let receipt = pending.await?.ok_or_else(|| crate::types::ContractError::Error("No receipt".to_string()))?;
        
        Ok(format!("0x{:x}", receipt.transaction_hash))
    }

    pub async fn retrieve_credential(
        &self,
        handle: [u8; 32],
    ) -> Result<String, crate::types::ContractError> {
        let client = Arc::clone(&self.provider);
        let vault = AgentVault::new(self.contracts.agent_vault, client);
        
        let result = vault.retrieve_credential(handle.into()).call().await?;
        Ok(result)
    }

    pub async fn get_balance(&self) -> Result<ethers::types::U256, crate::types::ContractError> {
        Ok(self.provider.get_balance(self.address, None).await?)
    }
}
