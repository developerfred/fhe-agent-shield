defmodule FHEAgentShield.Config do
  @moduledoc """
  Configuration for FHE-Agent Shield client.
  """

  @networks %{
    ethereum_sepolia: %{
      chain_id: 11155111,
      rpc_url: "https://rpc.sepolia.org",
      name: "Ethereum Sepolia"
    },
    arbitrum_sepolia: %{
      chain_id: 421_614,
      rpc_url: "https://sepolia-rollup.arbitrum.io/rpc",
      name: "Arbitrum Sepolia"
    },
    base_sepolia: %{
      chain_id: 84532,
      rpc_url: "https://sepolia.base.org",
      name: "Base Sepolia"
    }
  }

  # Default contract addresses (testnet deployments)
  @default_contracts %{
    agent_vault: "0x818eA3862861e82586A4D6E1A78A1a657FC615aa",
    agent_memory: "0x6D31CEaaa0588A62fFb99eCa3Bde0F22Bd7DBb7B",
    skill_registry: "0xaA19aff541ed6eBF528f919592576baB138370DC",
    action_sealer: "0x76f18Cc5F9DB41905a285866B9277Ac451F3f75B"
  }

  defstruct [
    :network,
    :private_key,
    :rpc_url,
    :chain_id,
    :contracts
  ]

  @type t :: %__MODULE__{
          network: atom(),
          private_key: String.t(),
          rpc_url: String.t(),
          chain_id: non_neg_integer(),
          contracts: contracts()
        }

  @type contracts :: %{
          agent_vault: String.t(),
          agent_memory: String.t(),
          skill_registry: String.t(),
          action_sealer: String.t()
        }

  @doc """
  Create a new configuration.

  ## Options

  - `:network` - Network name (atom) - :ethereum_sepolia, :arbitrum_sepolia, :base_sepolia
  - `:private_key` - Wallet private key
  - `:rpc_url` - Custom RPC URL (overrides network default)
  - `:contracts` - Custom contract addresses

  ## Examples

      iex> config = FHEAgentShield.Config.new(
      ...>   network: :ethereum_sepolia,
      ...>   private_key: "0x..."
      ...> )
  """
  @spec new(keyword()) :: t()
  def new(opts \\ []) do
    network = Keyword.get(opts, :network, :ethereum_sepolia)
    network_config = Map.fetch!(@networks, network)

    %__MODULE__{
      network: network,
      private_key: Keyword.fetch!(opts, :private_key),
      rpc_url: Keyword.get(opts, :rpc_url, network_config.rpc_url),
      chain_id: network_config.chain_id,
      contracts: Keyword.get(opts, :contracts, @default_contracts)
    }
  end

  @doc """
  Get network configuration.
  """
  @spec network_config(atom()) :: map()
  def network_config(network) when is_atom(network) do
    Map.fetch!(@networks, network)
  end

  @doc """
  List available networks.
  """
  @spec networks :: [atom()]
  def networks, do: Map.keys(@networks)

  @doc """
  Get default contract addresses.
  """
  @spec default_contracts :: contracts()
  def default_contracts, do: @default_contracts
end
