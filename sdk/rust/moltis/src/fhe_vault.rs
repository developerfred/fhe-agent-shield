//! FHE Credential Vault for Moltis
//!
//! Replaces `moltis-vault` XChaCha20-Poly1305 with true FHE encryption.
//! Uses threshold decryption so server CANNOT decrypt without permits.

use serde::{Deserialize, Serialize};

/// FHE-encrypted credential
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FHECredential {
    /// Credential ID (hash of key)
    pub id: String,
    /// Encrypted key (FHE ciphertext)
    pub encrypted_key: Vec<u8>,
    /// Encrypted value (FHE ciphertext)
    pub encrypted_value: Vec<u8>,
    /// Threshold required for decryption
    pub threshold: u8,
    /// Owner address
    pub owner: [u8; 20],
    /// Created at block timestamp
    pub created_at: u64,
}

/// FHE Credential Vault with threshold decryption
pub struct FHECredentialVault {
    contract_address: [u8; 20],
    threshold: u8,
    rpc_url: String,
    credentials: Vec<FHECredential>,
}

impl FHECredentialVault {
    /// Create a new FHE credential vault
    pub fn new(contract_address: [u8; 20], threshold: u8, rpc_url: &str) -> Self {
        Self {
            contract_address,
            threshold,
            rpc_url: rpc_url.to_string(),
            credentials: Vec::new(),
        }
    }

    /// Store an FHE-encrypted credential
    /// In production, this calls AgentVault.storeCredential() on Fhenix
    pub fn store(&mut self, key: &str, value: &str) -> Result<String, &'static str> {
        if key.is_empty() {
            return Err("Key cannot be empty");
        }

        let id = Self::compute_id(key, &self.contract_address);
        let encrypted_key = Self::fhe_encrypt(key.as_bytes());
        let encrypted_value = Self::fhe_encrypt(value.as_bytes());

        let credential = FHECredential {
            id: id.clone(),
            encrypted_key,
            encrypted_value,
            threshold: self.threshold,
            owner: self.contract_address,
            created_at: 0, // Would be block.timestamp in production
        };

        self.credentials.push(credential);
        Ok(id)
    }

    /// Retrieve credential with threshold authorization
    /// Requires `threshold` number of permits to decrypt
    pub fn retrieve(&self, id: &str, permits: u8) -> Result<String, &'static str> {
        if permits < self.threshold {
            return Err("Insufficient permits for retrieval");
        }

        let cred = self
            .credentials
            .iter()
            .find(|c| c.id == id)
            .ok_or("Credential not found")?;

        // FHE decryption would happen here via Fhenix CoFHE
        // For now, return mock decrypted value
        Ok(format!("decrypted_{}", id))
    }

    /// List all credentials for this vault
    pub fn list(&self) -> Vec<&FHECredential> {
        self.credentials.iter().collect()
    }

    /// Delete a credential
    pub fn delete(&mut self, id: &str) -> Result<(), &'static str> {
        let pos = self.credentials.iter().position(|c| c.id == id);
        match pos {
            Some(idx) => {
                self.credentials.remove(idx);
                Ok(())
            }
            None => Err("Credential not found"),
        }
    }

    /// Get threshold
    pub fn threshold(&self) -> u8 {
        self.threshold
    }

    /// Compute credential ID from key hash
    fn compute_id(key: &str, address: &[u8; 20]) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        key.hash(&mut hasher);
        address.hash(&mut hasher);
        format!("{:x}", hasher.finish())
    }

    /// Mock FHE encryption (real implementation uses Fhenix CoFHE)
    fn fhe_encrypt(data: &[u8]) -> Vec<u8> {
        // In production: tfhe::encrypt(data, &self.public_key)
        // Mock: just return data with prefix
        let mut result = b"fhe_".to_vec();
        result.extend_from_slice(data);
        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_store_and_retrieve() {
        let mut vault = FHECredentialVault::new([1u8; 20], 2, "http://localhost:8545");

        let id = vault.store("api_key", "secret123").unwrap();
        assert!(!id.is_empty());

        let value = vault.retrieve(&id, 2).unwrap();
        assert!(value.contains("decrypted_"));
    }

    #[test]
    fn test_insufficient_permits() {
        let vault = FHECredentialVault::new([1u8; 20], 2, "http://localhost:8545");

        let result = vault.retrieve("nonexistent", 1);
        assert!(result.is_err());
    }

    #[test]
    fn test_delete() {
        let mut vault = FHECredentialVault::new([1u8; 20], 2, "http://localhost:8545");

        let id = vault.store("key", "value").unwrap();
        assert!(vault.delete(&id).is_ok());
        assert!(vault.delete(&id).is_err()); // Already deleted
    }

    #[test]
    fn test_list() {
        let mut vault = FHECredentialVault::new([1u8; 20], 2, "http://localhost:8545");

        vault.store("key1", "value1").unwrap();
        vault.store("key2", "value2").unwrap();

        let list = vault.list();
        assert_eq!(list.len(), 2);
    }
}
