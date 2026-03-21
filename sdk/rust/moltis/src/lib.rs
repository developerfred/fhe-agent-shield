//! FHE-Agent Shield Moltis Integration
//!
//! Provides FHE-encrypted credential and memory management for Moltis.
//! This module replaces `moltis-vault` with true FHE-backed storage.

pub mod fhe_vault;
pub mod fhe_memory;
pub mod mcp_tools;

pub use fhe_vault::{FHECredentialVault, FHECredential};
pub use fhe_memory::{FHEMemoryStore, FHEMemoryEntry};
pub use mcp_tools::{FHETool, FHEThresholdTool};

use std::sync::Arc;

/// MoltisBridge connects FHE-Agent Shield with Moltis
pub struct MoltisBridge {
    vault: FHECredentialVault,
    memory: FHEMemoryStore,
}

impl MoltisBridge {
    /// Create a new FHE bridge for Moltis
    pub fn new(
        contract_address: [u8; 20],
        threshold: u8,
        rpc_url: &str,
    ) -> Self {
        Self {
            vault: FHECredentialVault::new(contract_address, threshold, rpc_url),
            memory: FHEMemoryStore::new(contract_address, rpc_url),
        }
    }

    /// Get the FHE credential vault
    pub fn vault(&self) -> &FHECredentialVault {
        &self.vault
    }

    /// Get the FHE memory store
    pub fn memory(&self) -> &FHEMemoryStore {
        &self.memory
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bridge_creation() {
        let bridge = MoltisBridge::new(
            [0u8; 20],
            2,
            "http://localhost:8545",
        );
        assert!(bridge.vault().threshold() == 2);
    }
}
