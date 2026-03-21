// FHE-Agent Shield GoClaw Integration Tests

package claw

import (
	"testing"
)

func TestClientCreation(t *testing.T) {
	config := Config{
		Network:         NetworkHelium,
		ContractAddress: [20]byte{1, 2, 3},
		RPCURL:          "http://localhost:8545",
		Threshold:       2,
	}

	client := NewClient(config)
	if client == nil {
		t.Error("expected non-nil client")
	}
}

func TestCredentialStoreAndRetrieve(t *testing.T) {
	vault := NewCredentialVault([20]byte{1, 2, 3}, 2)

	id, err := vault.Store("api_key", "secret123")
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	if id == "" {
		t.Error("expected non-empty id")
	}

	value, err := vault.Retrieve(id, 2)
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	if value != "secret123" {
		t.Errorf("expected secret123, got %s", value)
	}
}

func TestInsufficientPermits(t *testing.T) {
	vault := NewCredentialVault([20]byte{1, 2, 3}, 2)

	id, _ := vault.Store("key", "value")

	_, err := vault.Retrieve(id, 1)
	if err == nil {
		t.Error("expected error for insufficient permits")
	}
}

func TestListCredentials(t *testing.T) {
	vault := NewCredentialVault([20]byte{1, 2, 3}, 2)

	vault.Store("key1", "value1")
	vault.Store("key2", "value2")

	list := vault.List()
	if len(list) != 2 {
		t.Errorf("expected 2 credentials, got %d", len(list))
	}
}

func TestDeleteCredential(t *testing.T) {
	vault := NewCredentialVault([20]byte{1, 2, 3}, 2)

	id, _ := vault.Store("key", "value")
	err := vault.Delete(id)
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}

	list := vault.List()
	if len(list) != 0 {
		t.Errorf("expected 0 credentials, got %d", len(list))
	}
}

func TestMemoryAppend(t *testing.T) {
	store := NewMemoryStore([20]byte{1, 2, 3})
	agentID := [20]byte{4, 5, 6}

	id, err := store.Append(agentID, "context1")
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	if id == "" {
		t.Error("expected non-empty id")
	}
}

func TestMemoryGet(t *testing.T) {
	store := NewMemoryStore([20]byte{1, 2, 3})
	agentID := [20]byte{4, 5, 6}

	store.Append(agentID, "context1")
	store.Append(agentID, "context2")

	contexts, err := store.Get(agentID, 10)
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}
	if len(contexts) != 2 {
		t.Errorf("expected 2 contexts, got %d", len(contexts))
	}
}

func TestSnapshotAndRestore(t *testing.T) {
	store := NewMemoryStore([20]byte{1, 2, 3})
	agentID := [20]byte{4, 5, 6}

	store.Append(agentID, "context1")

	snapshotID, err := store.Snapshot(agentID)
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}

	store.Clear(agentID)

	contexts, _ := store.Get(agentID, 10)
	if len(contexts) != 0 {
		t.Errorf("expected 0 contexts after clear, got %d", len(contexts))
	}

	err = store.Restore(agentID, snapshotID)
	if err != nil {
		t.Errorf("unexpected error: %v", err)
	}

	contexts, _ = store.Get(agentID, 10)
	if len(contexts) != 1 {
		t.Errorf("expected 1 context after restore, got %d", len(contexts))
	}
}
