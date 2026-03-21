//! FHE Memory Store for Moltis
//!
//! Replaces `moltis-memory` SQLite with FHE-encrypted memory.
//! Memory snapshots stored on Fhenix blockchain.

use serde::{Deserialize, Serialize};

/// FHE-encrypted memory entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FHEMemoryEntry {
    /// Entry ID
    pub id: String,
    /// Agent ID (owner)
    pub agent_id: [u8; 20],
    /// Encrypted context (FHE ciphertext)
    pub encrypted_context: Vec<u8>,
    /// Timestamp
    pub timestamp: u64,
}

/// Snapshot of memory state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FHEMemorySnapshot {
    /// Snapshot ID
    pub id: String,
    /// Agent ID
    pub agent_id: [u8; 20],
    /// Entries in this snapshot
    pub entries: Vec<FHEMemoryEntry>,
    /// Created at timestamp
    pub created_at: u64,
}

/// FHE Memory Store with on-chain storage
pub struct FHEMemoryStore {
    contract_address: [u8; 20],
    rpc_url: String,
    entries: Vec<FHEMemoryEntry>,
    snapshots: Vec<FHEMemorySnapshot>,
}

impl FHEMemoryStore {
    /// Create a new FHE memory store
    pub fn new(contract_address: [u8; 20], rpc_url: &str) -> Self {
        Self {
            contract_address,
            rpc_url: rpc_url.to_string(),
            entries: Vec::new(),
            snapshots: Vec::new(),
        }
    }

    /// Append encrypted context to memory
    /// In production, calls AgentMemory.appendContext() on Fhenix
    pub fn append(&mut self, agent_id: [u8; 20], context: &str) -> String {
        let id = Self::compute_id(&self.entries.len(), agent_id);
        let encrypted = Self::fhe_encrypt(context.as_bytes());

        let entry = FHEMemoryEntry {
            id: id.clone(),
            agent_id,
            encrypted_context: encrypted,
            timestamp: 0, // Would be block.timestamp
        };

        self.entries.push(entry);
        id
    }

    /// Get recent memory context
    pub fn get_context(&self, agent_id: [u8; 20], limit: usize) -> Vec<String> {
        let mut results = Vec::new();
        let agent_entries: Vec<_> = self
            .entries
            .iter()
            .filter(|e| e.agent_id == agent_id)
            .collect();

        for entry in agent_entries.iter().rev().take(limit) {
            // FHE decryption would happen here
            results.push(format!("decrypted_context_{}", entry.id));
        }

        results
    }

    /// Create a snapshot of current memory
    pub fn snapshot(&mut self, agent_id: [u8; 20]) -> String {
        let id = Self::compute_id(&self.snapshots.len(), agent_id);

        let entries: Vec<_> = self
            .entries
            .iter()
            .filter(|e| e.agent_id == agent_id)
            .cloned()
            .collect();

        let snapshot = FHEMemorySnapshot {
            id: id.clone(),
            agent_id,
            entries,
            created_at: 0,
        };

        self.snapshots.push(snapshot);
        id
    }

    /// Restore memory from a snapshot
    pub fn restore(&mut self, agent_id: [u8; 20], snapshot_id: &str) -> Result<(), &'static str> {
        let snapshot = self
            .snapshots
            .iter()
            .find(|s| s.id == snapshot_id && s.agent_id == agent_id)
            .ok_or("Snapshot not found")?;

        // Remove existing entries for this agent
        self.entries.retain(|e| e.agent_id != agent_id);

        // Restore entries from snapshot
        for entry in &snapshot.entries {
            self.entries.push(entry.clone());
        }

        Ok(())
    }

    /// List all snapshots
    pub fn list_snapshots(&self, agent_id: [u8; 20]) -> Vec<&FHEMemorySnapshot> {
        self.snapshots
            .iter()
            .filter(|s| s.agent_id == agent_id)
            .collect()
    }

    /// Clear all memory for an agent
    pub fn clear(&mut self, agent_id: [u8; 20]) {
        self.entries.retain(|e| e.agent_id != agent_id);
    }

    /// Mock FHE encryption
    fn fhe_encrypt(data: &[u8]) -> Vec<u8> {
        let mut result = b"fhe_ctx_".to_vec();
        result.extend_from_slice(data);
        result
    }

    /// Compute ID
    fn compute_id(seed: &usize, agent: [u8; 20]) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        seed.hash(&mut hasher);
        agent.hash(&mut hasher);
        format!("{:x}", hasher.finish())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_append_and_get() {
        let mut store = FHEMemoryStore::new([1u8; 20], "http://localhost:8545");
        let agent = [2u8; 20];

        let id1 = store.append(agent, "context1");
        let id2 = store.append(agent, "context2");

        assert!(!id1.is_empty());
        assert!(!id2.is_empty());

        let context = store.get_context(agent, 10);
        assert_eq!(context.len(), 2);
    }

    #[test]
    fn test_snapshot_and_restore() {
        let mut store = FHEMemoryStore::new([1u8; 20], "http://localhost:8545");
        let agent = [2u8; 20];

        store.append(agent, "data1");
        store.append(agent, "data2");

        let snapshot_id = store.snapshot(agent);
        assert!(!snapshot_id.is_empty());

        // Clear and restore
        store.clear(agent);
        assert!(store.get_context(agent, 10).is_empty());

        store.restore(agent, &snapshot_id).unwrap();
        assert_eq!(store.get_context(agent, 10).len(), 2);
    }

    #[test]
    fn test_list_snapshots() {
        let mut store = FHEMemoryStore::new([1u8; 20], "http://localhost:8545");
        let agent = [2u8; 20];

        store.append(agent, "data");
        store.snapshot(agent);
        store.snapshot(agent);

        let snapshots = store.list_snapshots(agent);
        assert_eq!(snapshots.len(), 2);
    }
}
