// FHE Memory Store for GoClaw

package claw

import (
	"fmt"
	"sync"
)

// MemoryEntry represents an FHE-encrypted memory entry
type MemoryEntry struct {
	ID               string
	AgentID          [20]byte
	EncryptedContext []byte
	Timestamp        uint64
}

// Snapshot represents a memory snapshot
type Snapshot struct {
	ID        string
	AgentID   [20]byte
	Entries   []MemoryEntry
	CreatedAt uint64
}

// MemoryStore manages FHE-encrypted memory
type MemoryStore struct {
	address   [20]byte
	mu        sync.RWMutex
	entries   []MemoryEntry
	snapshots []Snapshot
}

// NewMemoryStore creates a new FHE memory store
func NewMemoryStore(address [20]byte) *MemoryStore {
	return &MemoryStore{
		address:   address,
		entries:   make([]MemoryEntry, 0),
		snapshots: make([]Snapshot, 0),
	}
}

// Append appends encrypted context to memory
func (m *MemoryStore) Append(agentID [20]byte, context string) (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	id := fmt.Sprintf("mem_%d", len(m.entries))

	entry := MemoryEntry{
		ID:               id,
		AgentID:          agentID,
		EncryptedContext: FHEEncrypt(context),
		Timestamp:        uint64(len(m.entries)),
	}

	m.entries = append(m.entries, entry)
	return id, nil
}

// Get retrieves memory context for an agent
func (m *MemoryStore) Get(agentID [20]byte, limit int) ([]string, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if limit <= 0 {
		limit = 10
	}

	contexts := make([]string, 0)
	count := 0

	for i := len(m.entries) - 1; i >= 0 && count < limit; i-- {
		if m.entries[i].AgentID == agentID {
			contexts = append(contexts, FHEDecrypt(m.entries[i].EncryptedContext))
			count++
		}
	}

	return contexts, nil
}

// Snapshot creates a memory snapshot
func (m *MemoryStore) Snapshot(agentID [20]byte) (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	snapshotID := fmt.Sprintf("snap_%d", len(m.snapshots))

	entries := make([]MemoryEntry, 0)
	for _, e := range m.entries {
		if e.AgentID == agentID {
			entries = append(entries, e)
		}
	}

	snapshot := Snapshot{
		ID:        snapshotID,
		AgentID:   agentID,
		Entries:   entries,
		CreatedAt: uint64(len(m.snapshots)),
	}

	m.snapshots = append(m.snapshots, snapshot)
	return snapshotID, nil
}

// Restore restores memory from a snapshot
func (m *MemoryStore) Restore(agentID [20]byte, snapshotID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	var snapshot *Snapshot
	for _, s := range m.snapshots {
		if s.ID == snapshotID && s.AgentID == agentID {
			snapshot = &s
			break
		}
	}

	if snapshot == nil {
		return fmt.Errorf("snapshot not found: %s", snapshotID)
	}

	// Remove existing entries for this agent
	newEntries := make([]MemoryEntry, 0)
	for _, e := range m.entries {
		if e.AgentID != agentID {
			newEntries = append(newEntries, e)
		}
	}

	// Add entries from snapshot
	m.entries = append(newEntries, snapshot.Entries...)
	return nil
}

// ListSnapshots lists all snapshots for an agent
func (m *MemoryStore) ListSnapshots(agentID [20]byte) []Snapshot {
	m.mu.RLock()
	defer m.mu.RUnlock()

	snapshots := make([]Snapshot, 0)
	for _, s := range m.snapshots {
		if s.AgentID == agentID {
			snapshots = append(snapshots, s)
		}
	}
	return snapshots
}

// Clear clears all memory for an agent
func (m *MemoryStore) Clear(agentID [20]byte) {
	m.mu.Lock()
	defer m.mu.Unlock()

	newEntries := make([]MemoryEntry, 0)
	for _, e := range m.entries {
		if e.AgentID != agentID {
			newEntries = append(newEntries, e)
		}
	}
	m.entries = newEntries
}
