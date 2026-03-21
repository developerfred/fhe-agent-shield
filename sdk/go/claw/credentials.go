// FHE Credential Vault for GoClaw

package claw

import (
	"fmt"
	"sync"
)

// Credential represents an FHE-encrypted credential
type Credential struct {
	ID             string
	EncryptedKey   []byte
	EncryptedValue []byte
	Threshold      uint8
	Owner          [20]byte
	CreatedAt      uint64
}

// CredentialVault stores FHE-encrypted credentials
type CredentialVault struct {
	address   [20]byte
	threshold uint8
	mu        sync.RWMutex
	store     map[string]Credential
}

// NewCredentialVault creates a new FHE credential vault
func NewCredentialVault(address [20]byte, threshold uint8) *CredentialVault {
	return &CredentialVault{
		address:   address,
		threshold: threshold,
		store:     make(map[string]Credential),
	}
}

// Store stores an FHE-encrypted credential
func (v *CredentialVault) Store(key, value string) (string, error) {
	v.mu.Lock()
	defer v.mu.Unlock()

	if key == "" {
		return "", fmt.Errorf("key cannot be empty")
	}

	id := fmt.Sprintf("cred_%s_%d", key, len(v.store))

	cred := Credential{
		ID:             id,
		EncryptedKey:   FHEEncrypt(key),
		EncryptedValue: FHEEncrypt(value),
		Threshold:      v.threshold,
		Owner:          v.address,
		CreatedAt:      uint64(len(v.store)),
	}

	v.store[id] = cred
	return id, nil
}

// Retrieve retrieves a credential with threshold authorization
func (v *CredentialVault) Retrieve(id string, permits uint8) (string, error) {
	v.mu.RLock()
	defer v.mu.RUnlock()

	if permits < v.threshold {
		return "", fmt.Errorf("insufficient permits: need %d, got %d", v.threshold, permits)
	}

	cred, exists := v.store[id]
	if !exists {
		return "", fmt.Errorf("credential not found: %s", id)
	}

	// FHE decryption would happen here via Fhenix CoFHE
	// Mock: return decrypted value
	return FHEDecrypt(cred.EncryptedValue), nil
}

// List returns all credentials
func (v *CredentialVault) List() []CredentialInfo {
	v.mu.RLock()
	defer v.mu.RUnlock()

	infos := make([]CredentialInfo, 0, len(v.store))
	for id, cred := range v.store {
		infos = append(infos, CredentialInfo{
			ID:        id,
			Key:       string(FHEDecrypt(cred.EncryptedKey)),
			Threshold: cred.Threshold,
		})
	}
	return infos
}

// Delete deletes a credential
func (v *CredentialVault) Delete(id string) error {
	v.mu.Lock()
	defer v.mu.Unlock()

	if _, exists := v.store[id]; !exists {
		return fmt.Errorf("credential not found")
	}
	delete(v.store, id)
	return nil
}
