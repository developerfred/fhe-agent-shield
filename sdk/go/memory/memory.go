package memory

import (
	"crypto/sha256"
	"encoding/hex"
	"sync"

	"github.com/fhenix/fhe-agent-shield-go/fhe"
)

// Snapshot represents a memory snapshot
type Snapshot struct {
	ID        string
	AgentID   string
	Context   []string
	Timestamp uint64
}

// Memory manages FHE-encrypted agent memory
type Memory struct {
	client    *fhe.Client
	contracts fhe.ContractAddresses
	context   []string
	snapshots map[string]Snapshot
	mu        sync.RWMutex
}

// New creates a new memory manager
func New(client *fhe.Client, contracts fhe.ContractAddresses) *Memory {
	return &Memory{
		client:    client,
		contracts: contracts,
		context:   make([]string, 0),
		snapshots: make(map[string]Snapshot),
	}
}

// AppendContext adds encrypted context to memory
func (m *Memory) AppendContext(data string) (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.context = append(m.context, data)

	// In production, this would call the AgentMemory contract
	// Return mock tx hash
	txData := "tx_" + data
	hexStr := hex.EncodeToString([]byte(txData))
	if len(hexStr) > 40 {
		hexStr = hexStr[:40]
	}
	return "0x" + hexStr, nil
}

// GetContext retrieves recent memory context
func (m *Memory) GetContext(limit int) ([]string, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if limit <= 0 || limit > len(m.context) {
		limit = len(m.context)
	}

	result := make([]string, limit)
	copy(result, m.context[len(m.context)-limit:])

	return result, nil
}

// ClearMemory clears all memory context
func (m *Memory) ClearMemory() (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Reset context slice to empty but keep capacity
	m.context = m.context[:0]

	// In production, this would call the AgentMemory contract
	// Return mock tx hash
	hexStr := hex.EncodeToString([]byte("clear"))
	if len(hexStr) > 40 {
		hexStr = hexStr[:40]
	}
	return "0x" + hexStr, nil
}

// CreateSnapshot creates a snapshot of current memory state
func (m *Memory) CreateSnapshot() (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Generate snapshot ID
	hash := sha256.Sum256([]byte(m.client.Address() + string(rune(len(m.snapshots)))))
	id := hex.EncodeToString(hash[:16])

	// Copy current context to snapshot
	ctxCopy := make([]string, len(m.context))
	copy(ctxCopy, m.context)

	m.snapshots[id] = Snapshot{
		ID:        id,
		AgentID:   m.client.Address(),
		Context:   ctxCopy,
		Timestamp: uint64(0), // Would be block timestamp in production
	}

	return id, nil
}

// RestoreSnapshot restores memory from a snapshot
func (m *Memory) RestoreSnapshot(snapshotID string) (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	snapshot, ok := m.snapshots[snapshotID]
	if !ok {
		return "", nil // Snapshot not found
	}

	m.context = make([]string, len(snapshot.Context))
	copy(m.context, snapshot.Context)

	return "0x" + hex.EncodeToString([]byte("restore_" + snapshotID))[:40], nil
}

// ListSnapshots returns all snapshots for the agent
func (m *Memory) ListSnapshots() ([]Snapshot, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	snapshots := make([]Snapshot, 0, len(m.snapshots))
	for _, s := range m.snapshots {
		if s.AgentID == m.client.Address() {
			snapshots = append(snapshots, s)
		}
	}

	return snapshots, nil
}
