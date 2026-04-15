//! FHE-Agent Shield IronClaw/ZeroClaw Integration
//!
//! Provides FHE-encrypted vault and memory for IronClaw and ZeroClaw.

pub mod vault;
pub mod zero;

pub use vault::{IronClawVault, FHEConfig};
pub use zero::{ZeroClawMemory, WASMProxy};

/// IronClaw configuration
#[derive(Debug, Clone)]
pub struct IronClawConfig {
    /// Fhenix network
    pub network: Network,
    /// Agent vault contract address
    pub vault_address: [u8; 20],
    /// Threshold for decryption
    pub threshold: u8,
    /// RPC URL
    pub rpc_url: String,
}

/// ZeroClaw configuration (minimal footprint)
#[derive(Debug, Clone)]
pub struct ZeroClawConfig {
    /// Fhenix network
    pub network: Network,
    /// Memory contract address
    pub memory_address: [u8; 20],
    /// RPC URL
    pub rpc_url: String,
}

/// Network enum
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Network {
    Sepolia,
    ArbitrumSepolia,
}

impl Network {
    pub fn rpc_url(&self) -> &'static str {
        match self {
            Network::Sepolia => "https://rpc.sepolia.org",
            Network::ArbitrumSepolia => "https://sepolia-rollup.arbitrum.io/rpc",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_network_rpc_urls() {
        assert_eq!(Network::Sepolia.rpc_url(), "https://rpc.sepolia.org");
        assert_eq!(Network::ArbitrumSepolia.rpc_url(), "https://sepolia-rollup.arbitrum.io/rpc");
    }

    #[test]
    fn test_ironclaw_config() {
        let config = IronClawConfig {
            network: Network::Sepolia,
            vault_address: [1u8; 20],
            threshold: 2,
            rpc_url: "http://localhost:8545".to_string(),
        };
        assert_eq!(config.threshold, 2);
    }

    #[test]
    fn test_zeroclaw_config() {
        let config = ZeroClawConfig {
            network: Network::Sepolia,
            memory_address: [2u8; 20],
            rpc_url: "http://localhost:8545".to_string(),
        };
        assert_eq!(config.memory_address, [2u8; 20]);
    }
}
