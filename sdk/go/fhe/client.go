package fhe

import (
	"crypto/ecdsa"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

// Network represents a supported Fhenix network
type Network int

const (
	EthereumSepolia Network = iota
	ArbitrumSepolia
	BaseSepolia
)

// String returns the network name
func (n Network) String() string {
	switch n {
	case EthereumSepolia:
		return "Ethereum Sepolia"
	case ArbitrumSepolia:
		return "Arbitrum Sepolia"
	case BaseSepolia:
		return "Base Sepolia"
	default:
		return "Unknown"
	}
}

// RPCURL returns the RPC endpoint for the network
func (n Network) RPCURL() string {
	switch n {
	case EthereumSepolia:
		return "https://rpc.sepolia.org"
	case ArbitrumSepolia:
		return "https://sepolia-rollup.arbitrum.io/rpc"
	case BaseSepolia:
		return "https://sepolia.base.org"
	default:
		return ""
	}
}

// ChainID returns the chain ID for the network
func (n Network) ChainID() uint64 {
	switch n {
	case EthereumSepolia:
		return 11155111
	case ArbitrumSepolia:
		return 421614
	case BaseSepolia:
		return 84532
	default:
		return 0
	}
}

// Config holds client configuration
type Config struct {
	Network    Network
	PrivateKey string
	RPCURL     string
	Contracts  ContractAddresses
}

// ContractAddresses holds deployed contract addresses
type ContractAddresses struct {
	AgentVault    common.Address
	AgentMemory   common.Address
	SkillRegistry common.Address
	ActionSealer  common.Address
}

// DefaultContracts returns default contract addresses for testnet
func DefaultContracts() ContractAddresses {
	return ContractAddresses{
		AgentVault:    common.HexToAddress("0x818eA3862861e82586A4D6E1A78A1a657FC615aa"),
		AgentMemory:   common.HexToAddress("0x6D31CEaaa0588A62fFb99eCa3Bde0F22Bd7DBb7B"),
		SkillRegistry: common.HexToAddress("0xaA19aff541ed6eBF528f919592576baB138370DC"),
		ActionSealer:  common.HexToAddress("0x76f18Cc5F9DB41905a285866B9277Ac451F3f75B"),
	}
}

// Client is the FHE-Agent Shield client
type Client struct {
	config     Config
	address    common.Address
	privateKey *ecdsa.PrivateKey
	rpcURL     string
}

// NewClient creates a new FHE-Agent Shield client
func NewClient(config Config) (*Client, error) {
	if config.RPCURL == "" {
		config.RPCURL = config.Network.RPCURL()
	}

	privateKey, err := crypto.HexToECDSA(config.PrivateKey[2:])
	if err != nil {
		return nil, fmt.Errorf("invalid private key: %w", err)
	}

	publicKey := privateKey.Public()
	publicKeyECDSA, ok := publicKey.(*ecdsa.PublicKey)
	if !ok {
		return nil, fmt.Errorf("failed to get public key")
	}

	address := crypto.PubkeyToAddress(*publicKeyECDSA)

	return &Client{
		config:     config,
		address:    address,
		privateKey: privateKey,
		rpcURL:     config.RPCURL,
	}, nil
}

// Address returns the client's wallet address
func (c *Client) Address() string {
	return c.address.Hex()
}

// GetBalance returns the balance in wei
func (c *Client) GetBalance() (*big.Int, error) {
	// In production, this would make an RPC call
	// For now, return a mock value
	return big.NewInt(0), nil
}

// GetNetwork returns the network
func (c *Client) GetNetwork() Network {
	return c.config.Network
}
