use fhe_agent_shield::{FHEAgentShield, Network, ContractAddresses};
use ethers::types::Address;
use std::str::FromStr;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let network = Network::ArbitrumSepolia;
    
    let contracts = ContractAddresses {
        agent_vault: Address::from_str("0x818eA3862861e82586A4D6E1A78A1a657FC615aa")?,
        agent_memory: Address::from_str("0x6D31CEaaa0588A62fFb99eCa3Bde0F22Bd7DBb7B")?,
        skill_registry: Address::from_str("0xaA19aff541ed6eBF528f919592576baB138370DC")?,
        action_sealer: Address::from_str("0x76f18Cc5F9DB41905a285866B9277Ac451F3f75B")?,
    };
    
    let private_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    
    let client = FHEAgentShield::new(
        network,
        private_key,
        contracts,
    ).await?;
    
    println!("Connected to FHE-Agent Shield");
    println!("Address: {:?}", client.address);
    println!("Balance: {:?}", client.get_balance().await?);
    
    Ok(())
}
