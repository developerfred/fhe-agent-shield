defmodule FHEAgentShield.Client do
  @moduledoc """
  FHE-Agent Shield client for Ethereum interactions.
  """

  defstruct [
    :address,
    :network,
    :rpc_url,
    :contracts,
    :wallet,
    :http_client
  ]

  @type t :: %__MODULE__{
          address: String.t(),
          network: atom(),
          rpc_url: String.t(),
          contracts: FHEAgentShield.Config.contracts(),
          wallet: map(),
          http_client: map()
        }

  alias FHEAgentShield.Config

  @doc """
  Connect to the Fhenix network.
  """
  @spec connect(Config.t()) :: {:ok, t()} | {:error, term()}
  def connect(%Config{} = config) do
    # Initialize HTTP client for RPC calls
    http_client = %{
      base_url: config.rpc_url,
      headers: [{"Content-Type", "application/json"}]
    }

    # Derive address from private key
    {:ok, address} = derive_address(config.private_key)

    client = %__MODULE__{
      address: address,
      network: config.network,
      rpc_url: config.rpc_url,
      contracts: config.contracts,
      wallet: %{private_key: config.private_key},
      http_client: http_client
    }

    {:ok, client}
  end

  @doc """
  Get the wallet address.
  """
  @spec address(t()) :: String.t()
  def address(%__MODULE__{address: addr}), do: addr

  @doc """
  Get balance in wei.
  """
  @spec get_balance(t()) :: {:ok, integer()} | {:error, term()}
  def get_balance(%__MODULE__{rpc_url: rpc_url, address: address}) do
    body = %{
      jsonrpc: "2.0",
      method: "eth_getBalance",
      params: [address, "latest"],
      id: 1
    }

    case make_request(rpc_url, body) do
      {:ok, "0x" <> hex_balance} ->
        {:ok, String.to_integer(hex_balance, 16)}

      {:error, reason} ->
        {:error, reason}
    end
  end

  @doc """
  Get current block number.
  """
  @spec get_block_number(t()) :: {:ok, integer()} | {:error, term()}
  def get_block_number(%__MODULE__{rpc_url: rpc_url}) do
    body = %{
      jsonrpc: "2.0",
      method: "eth_blockNumber",
      params: [],
      id: 1
    }

    case make_request(rpc_url, body) do
      {:ok, "0x" <> hex_block} ->
        {:ok, String.to_integer(hex_block, 16)}

      {:error, reason} ->
        {:error, reason}
    end
  end

  @doc """
  Send a raw transaction.
  """
  @spec send_transaction(t(), map()) :: {:ok, String.t()} | {:error, term()}
  def send_transaction(%__MODULE__{rpc_url: rpc_url}, tx_params) do
    body = %{
      jsonrpc: "2.0",
      method: "eth_sendTransaction",
      params: [tx_params],
      id: 1
    }

    make_request(rpc_url, body)
  end

  # Private functions

  defp derive_address("0x" <> _ = private_key) do
    # In production, use proper key derivation
    # For now, return a placeholder derived address
    address =
      :crypto.hash(:keccak256, private_key)
      |> binary_part(byte_size(address) - 20, 20)
      |> Base.encode16(case: :lower)

    {:ok, "0x" <> address}
  end

  defp derive_address(private_key) when is_binary(private_key) do
    derive_address("0x" <> private_key)
  end

  defp make_request(url, body) do
    case Req.post(url, json: body) do
      {:ok, %{status: 200, body: %{"result" => result}}} ->
        {:ok, result}

      {:ok, %{body: %{"error" => error}}} ->
        {:error, error}

      {:error, reason} ->
        {:error, reason}
    end
  end
end
