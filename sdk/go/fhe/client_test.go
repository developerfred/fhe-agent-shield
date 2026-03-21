package fhe_test

import (
	"testing"

	"github.com/fhenix/fhe-agent-shield-go/fhe"
)

// TestNewClient tests client creation with different networks
func TestNewClient(t *testing.T) {
	tests := []struct {
		name    string
		network fhe.Network
		wantErr bool
	}{
		{
			name:    "Fhenix Helium",
			network: fhe.FhenixHelium,
			wantErr: false,
		},
		{
			name:    "Fhenix Nitrogen",
			network: fhe.FhenixNitrogen,
			wantErr: false,
		},
		{
			name:    "Arbitrum Sepolia",
			network: fhe.ArbitrumSepolia,
			wantErr: false,
		},
		{
			name:    "Base Sepolia",
			network: fhe.BaseSepolia,
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			client, err := fhe.NewClient(fhe.Config{
				Network:    tt.network,
				PrivateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
			})
			if (err != nil) != tt.wantErr {
				t.Errorf("NewClient() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr && client == nil {
				t.Error("NewClient() returned nil client")
			}
		})
	}
}

// TestClientAddress tests address derivation from private key
func TestClientAddress(t *testing.T) {
	client, err := fhe.NewClient(fhe.Config{
		Network:    fhe.FhenixHelium,
		PrivateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
	})
	if err != nil {
		t.Fatalf("NewClient() error = %v", err)
	}

	addr := client.Address()
	if addr == "" {
		t.Error("Address() returned empty string")
	}

	// Address should start with 0x
	if len(addr) != 42 {
		t.Errorf("Address() length = %d, want 42", len(addr))
	}
}

// TestClientBalance tests balance retrieval
func TestClientBalance(t *testing.T) {
	client, err := fhe.NewClient(fhe.Config{
		Network:    fhe.FhenixHelium,
		PrivateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
	})
	if err != nil {
		t.Fatalf("NewClient() error = %v", err)
	}

	balance, err := client.GetBalance()
	if err != nil {
		t.Errorf("GetBalance() error = %v", err)
	}

	t.Logf("Balance: %d wei", balance)
}

// TestNetworkRPCURL tests RPC URL resolution for each network
func TestNetworkRPCURL(t *testing.T) {
	tests := []struct {
		network fhe.Network
		want    string
	}{
		{fhe.FhenixHelium, "https://api.helium.fhenix.zone"},
		{fhe.FhenixNitrogen, "https://api.nitrogen.fhenix.zone"},
		{fhe.ArbitrumSepolia, "https://sepolia-rollup.arbitrum.io/rpc"},
		{fhe.BaseSepolia, "https://sepolia.base.org"},
	}

	for _, tt := range tests {
		t.Run(tt.network.String(), func(t *testing.T) {
			got := tt.network.RPCURL()
			if got != tt.want {
				t.Errorf("RPCURL() = %v, want %v", got, tt.want)
			}
		})
	}
}
