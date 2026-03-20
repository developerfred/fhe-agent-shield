package credentials_test

import (
	"testing"

	"github.com/fhenix/fhe-agent-shield-go/credentials"
	"github.com/fhenix/fhe-agent-shield-go/fhe"
)

// TestStoreCredential tests credential storage
func TestStoreCredential(t *testing.T) {
	client, err := fhe.NewClient(fhe.Config{
		Network:    fhe.FhenixHelium,
		PrivateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
	})
	if err != nil {
		t.Fatalf("NewClient() error = %v", err)
	}

	vault := credentials.NewVault(client, fhe.DefaultContracts())

	tests := []struct {
		name    string
		key     string
		value   string
		wantErr bool
	}{
		{
			name:    "OpenAI API Key",
			key:     "openai-api-key",
			value:   "sk-1234567890",
			wantErr: false,
		},
		{
			name:    "GitHub Token",
			key:     "github-token",
			value:   "ghp_1234567890",
			wantErr: false,
		},
		{
			name:    "Empty Key",
			key:     "",
			value:   "value",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			id, err := vault.Store(tt.key, tt.value)
			if (err != nil) != tt.wantErr {
				t.Errorf("Store() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && id == "" {
				t.Error("Store() returned empty ID")
			}
		})
	}
}

// TestRetrieveCredential tests credential retrieval
func TestRetrieveCredential(t *testing.T) {
	client, err := fhe.NewClient(fhe.Config{
		Network:    fhe.FhenixHelium,
		PrivateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
	})
	if err != nil {
		t.Fatalf("NewClient() error = %v", err)
	}

	vault := credentials.NewVault(client, fhe.DefaultContracts())

	// Store a credential first
	id, err := vault.Store("test-key", "test-value")
	if err != nil {
		t.Fatalf("Store() error = %v", err)
	}

	// Retrieve it
	value, err := vault.Retrieve(id, "default")
	if err != nil {
		t.Errorf("Retrieve() error = %v", err)
	}

	if value != "test-value" {
		t.Errorf("Retrieve() = %v, want %v", value, "test-value")
	}
}

// TestListCredentials tests listing credentials
func TestListCredentials(t *testing.T) {
	client, err := fhe.NewClient(fhe.Config{
		Network:    fhe.FhenixHelium,
		PrivateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
	})
	if err != nil {
		t.Fatalf("NewClient() error = %v", err)
	}

	vault := credentials.NewVault(client, fhe.DefaultContracts())

	// Store multiple credentials
	_, _ = vault.Store("key1", "value1")
	_, _ = vault.Store("key2", "value2")
	_, _ = vault.Store("key3", "value3")

	// List them
	creds, err := vault.List()
	if err != nil {
		t.Errorf("List() error = %v", err)
	}

	if len(creds) < 3 {
		t.Errorf("List() returned %d credentials, want at least 3", len(creds))
	}
}

// TestDeleteCredential tests credential deletion
func TestDeleteCredential(t *testing.T) {
	client, err := fhe.NewClient(fhe.Config{
		Network:    fhe.FhenixHelium,
		PrivateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
	})
	if err != nil {
		t.Fatalf("NewClient() error = %v", err)
	}

	vault := credentials.NewVault(client, fhe.DefaultContracts())

	// Store a credential
	id, _ := vault.Store("to-delete", "value")

	// Delete it
	err = vault.Delete(id)
	if err != nil {
		t.Errorf("Delete() error = %v", err)
	}
}
