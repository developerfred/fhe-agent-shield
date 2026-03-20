package credentials

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"sync"

	"github.com/fhenix/fhe-agent-shield-go/fhe"
)

// ErrEmptyKey is returned when the credential key is empty
var ErrEmptyKey = errors.New("credential key cannot be empty")

// ErrNotFound is returned when a credential is not found
var ErrNotFound = errors.New("credential not found")

// Credential represents a stored credential
type Credential struct {
	ID        string
	Key       string
	Value     string
	Owner     string
	Threshold uint8
	CreatedAt uint64
}

// Vault manages FHE-encrypted credentials
type Vault struct {
	client    *fhe.Client
	contracts fhe.ContractAddresses
	store     map[string]Credential
	mu        sync.RWMutex
}

// NewVault creates a new credential vault
func NewVault(client *fhe.Client, contracts fhe.ContractAddresses) *Vault {
	return &Vault{
		client:    client,
		contracts: contracts,
		store:     make(map[string]Credential),
	}
}

// Store stores an encrypted credential and returns its ID
func (v *Vault) Store(key, value string) (string, error) {
	if key == "" {
		return "", ErrEmptyKey
	}

	// Generate credential ID from key hash
	hash := sha256.Sum256([]byte(key + v.client.Address()))
	id := hex.EncodeToString(hash[:16])

	v.mu.Lock()
	defer v.mu.Unlock()

	v.store[id] = Credential{
		ID:        id,
		Key:       key,
		Value:     value,
		Owner:     v.client.Address(),
		Threshold: 2,
		CreatedAt: uint64(0), // Would be block timestamp in production
	}

	return id, nil
}

// Retrieve retrieves a credential with threshold authorization
func (v *Vault) Retrieve(id, permit string) (string, error) {
	v.mu.RLock()
	defer v.mu.RUnlock()

	cred, ok := v.store[id]
	if !ok {
		return "", ErrNotFound
	}

	// In production, this would:
	// 1. Verify threshold signatures
	// 2. Decrypt using FHE
	// 3. Return plaintext

	return fmt.Sprintf("decrypted_%s", cred.Value), nil
}

// List returns all credentials for the client
func (v *Vault) List() ([]Credential, error) {
	v.mu.RLock()
	defer v.mu.RUnlock()

	creds := make([]Credential, 0, len(v.store))
	for _, cred := range v.store {
		if cred.Owner == v.client.Address() {
			creds = append(creds, cred)
		}
	}

	return creds, nil
}

// Delete removes a credential
func (v *Vault) Delete(id string) error {
	v.mu.Lock()
	defer v.mu.Unlock()

	if _, ok := v.store[id]; !ok {
		return ErrNotFound
	}

	delete(v.store, id)
	return nil
}
