package memory_test

import (
	"testing"

	"github.com/fhenix/fhe-agent-shield-go/fhe"
	"github.com/fhenix/fhe-agent-shield-go/memory"
)

// TestAppendContext tests adding encrypted context to memory
func TestAppendContext(t *testing.T) {
	client, err := fhe.NewClient(fhe.Config{
		Network:    fhe.FhenixHelium,
		PrivateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
	})
	if err != nil {
		t.Fatalf("NewClient() error = %v", err)
	}

	mem := memory.New(client, fhe.DefaultContracts())

	tests := []struct {
		name    string
		data    string
		wantErr bool
	}{
		{
			name:    "Simple context",
			data:    "Hello, world!",
			wantErr: false,
		},
		{
			name:    "JSON context",
			data:    `{"messages": [{"role": "user", "content": "hi"}]}`,
			wantErr: false,
		},
		{
			name:    "Empty context",
			data:    "",
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			txHash, err := mem.AppendContext(tt.data)
			if (err != nil) != tt.wantErr {
				t.Errorf("AppendContext() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && txHash == "" {
				t.Error("AppendContext() returned empty tx hash")
			}
		})
	}
}

// TestGetContext tests retrieving memory context
func TestGetContext(t *testing.T) {
	client, err := fhe.NewClient(fhe.Config{
		Network:    fhe.FhenixHelium,
		PrivateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
	})
	if err != nil {
		t.Fatalf("NewClient() error = %v", err)
	}

	mem := memory.New(client, fhe.DefaultContracts())

	// Append some context
	_, _ = mem.AppendContext("context 1")
	_, _ = mem.AppendContext("context 2")
	_, _ = mem.AppendContext("context 3")

	// Get context
	context, err := mem.GetContext(10)
	if err != nil {
		t.Errorf("GetContext() error = %v", err)
	}

	if len(context) < 3 {
		t.Errorf("GetContext() returned %d items, want at least 3", len(context))
	}
}

// TestClearMemory tests clearing all memory
func TestClearMemory(t *testing.T) {
	client, err := fhe.NewClient(fhe.Config{
		Network:    fhe.FhenixHelium,
		PrivateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
	})
	if err != nil {
		t.Fatalf("NewClient() error = %v", err)
	}

	mem := memory.New(client, fhe.DefaultContracts())

	// Append context
	_, _ = mem.AppendContext("to be cleared")

	// Clear
	txHash, err := mem.ClearMemory()
	if err != nil {
		t.Errorf("ClearMemory() error = %v", err)
	}

	if txHash == "" {
		t.Error("ClearMemory() returned empty tx hash")
	}
}

// TestCreateSnapshot tests creating a memory snapshot
func TestCreateSnapshot(t *testing.T) {
	client, err := fhe.NewClient(fhe.Config{
		Network:    fhe.FhenixHelium,
		PrivateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
	})
	if err != nil {
		t.Fatalf("NewClient() error = %v", err)
	}

	mem := memory.New(client, fhe.DefaultContracts())

	snapshotID, err := mem.CreateSnapshot()
	if err != nil {
		t.Errorf("CreateSnapshot() error = %v", err)
	}

	if snapshotID == "" {
		t.Error("CreateSnapshot() returned empty ID")
	}
}

// TestRestoreSnapshot tests restoring from a snapshot
func TestRestoreSnapshot(t *testing.T) {
	client, err := fhe.NewClient(fhe.Config{
		Network:    fhe.FhenixHelium,
		PrivateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
	})
	if err != nil {
		t.Fatalf("NewClient() error = %v", err)
	}

	mem := memory.New(client, fhe.DefaultContracts())

	// Create a snapshot
	snapshotID, _ := mem.CreateSnapshot()

	// Restore it
	txHash, err := mem.RestoreSnapshot(snapshotID)
	if err != nil {
		t.Errorf("RestoreSnapshot() error = %v", err)
	}

	if txHash == "" {
		t.Error("RestoreSnapshot() returned empty tx hash")
	}
}
