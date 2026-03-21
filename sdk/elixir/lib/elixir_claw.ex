defmodule FHEAgentShield do
  @moduledoc """
  FHE-Agent Shield - FHE Privacy SDK for AI Agents (Elixir)

  Provides true end-to-end encryption for AI agents using Fully Homomorphic
  Encryption (FHE) via Fhenix CoFHE.

  ## Supported Networks

  - Fhenix Helium (mainnet)
  - Fhenix Nitrogen (testnet)
  - Arbitrum Sepolia (testnet)
  - Base Sepolia (testnet)

  ## Usage

      # Create a new FHE agent shield client
      {:ok, client} = FHEAgentShield.new(
        network: :fhenix_helium,
        private_key: System.get_env("PRIVATE_KEY")
      )

      # Store encrypted credential
      {:ok, credential_id} = FHEAgentShield.store_credential(
        client,
        "openai-api-key",
        "sk-..."
      )

      # Retrieve with threshold authorization
      {:ok, api_key} = FHEAgentShield.retrieve_credential(
        client,
        credential_id,
        permit: "llm-access"
      )
  """

  alias FHEAgentShield.{Client, Config, Credentials, Memory, Contracts}
  alias FHEAgentShield.Transactions.TransactionBuilder

  @type network :: :fhenix_helium | :fhenix_nitrogen | :arbitrum_sepolia | :base_sepolia
  @type address :: String.t()
  @type tx_hash :: String.t()

  @doc """
  Create a new FHE-Agent Shield client.

  ## Options

  - `:network` - Network to connect to (default: :fhenix_helium)
  - `:private_key` - Wallet private key (hex string or file path)
  - `:contracts` - Custom contract addresses
  - `:rpc_url` - Custom RPC URL

  ## Examples

      iex> {:ok, client} = FHEAgentShield.new(
      ...>   network: :fhenix_helium,
      ...>   private_key: "0x..."
      ...> )
      iex> client.address
      "0x..."
  """
  @spec new(keyword()) :: {:ok, Client.t()} | {:error, term()}
  def new(opts \\ []) when is_list(opts) do
    config = Config.new(opts)

    case Client.connect(config) do
      {:ok, _} = result -> result
      {:error, reason} -> {:error, reason}
    end
  end

  @doc """
  Create a new FHE-Agent Shield client (bang version).
  Raises on error.
  """
  @spec new!(keyword()) :: Client.t()
  def new!(opts \\ []) when is_list(opts) do
    case new(opts) do
      {:ok, client} -> client
      {:error, reason} -> raise "Failed to create FHEAgentShield client: #{inspect(reason)}"
    end
  end

  # =============================================================================
  # Credentials
  # =============================================================================

  @doc """
  Store an encrypted credential on-chain.

  ## Examples

      iex> {:ok, id} = FHEAgentShield.store_credential(client,
      ...>   "openai-api-key",
      ...>   "sk-..."
      ...> )
  """
  @spec store_credential(Client.t(), String.t(), String.t(), keyword()) ::
          {:ok, String.t()} | {:error, term()}
  defdelegate store_credential(client, key, value, opts \\ []),
    to: Credentials

  @doc """
  Retrieve a credential with threshold authorization.

  Requires permit verification and threshold signatures.
  """
  @spec retrieve_credential(Client.t(), String.t(), keyword()) ::
          {:ok, String.t()} | {:error, term()}
  defdelegate retrieve_credential(client, credential_id, opts \\ []),
    to: Credentials

  @doc """
  List all credentials for the current agent.
  """
  @spec list_credentials(Client.t()) :: {:ok, [Credentials.credential()]} | {:error, term()}
  defdelegate list_credentials(client),
    to: Credentials

  @doc """
  Delete a credential.
  """
  @spec delete_credential(Client.t(), String.t()) :: {:ok, tx_hash()} | {:error, term()}
  defdelegate delete_credential(client, credential_id),
    to: Credentials

  # =============================================================================
  # Memory
  # =============================================================================

  @doc """
  Append encrypted context to agent memory.
  """
  @spec append_context(Client.t(), String.t(), keyword()) ::
          {:ok, tx_hash()} | {:error, term()}
  defdelegate append_context(client, encrypted_data, opts \\ []),
    to: Memory

  @doc """
  Get recent memory context.
  """
  @spec get_context(Client.t(), keyword()) ::
          {:ok, [String.t()]} | {:error, term()}
  defdelegate get_context(client, opts \\ []),
    to: Memory

  @doc """
  Clear agent memory.
  """
  @spec clear_memory(Client.t()) :: {:ok, tx_hash()} | {:error, term()}
  defdelegate clear_memory(client),
    to: Memory

  @doc """
  Create a memory snapshot.
  """
  @spec create_snapshot(Client.t()) :: {:ok, String.t()} | {:error, term()}
  defdelegate create_snapshot(client),
    to: Memory

  @doc """
  Restore from a memory snapshot.
  """
  @spec restore_snapshot(Client.t(), String.t()) :: {:ok, tx_hash()} | {:error, term()}
  defdelegate restore_snapshot(client, snapshot_id),
    to: Memory

  # =============================================================================
  # Skills
  # =============================================================================

  @doc """
  Register a skill on-chain.
  """
  @spec register_skill(Client.t(), String.t(), String.t(), keyword()) ::
          {:ok, String.t()} | {:error, term()}
  defdelegate register_skill(client, skill_id, metadata, opts \\ []),
    to: Contracts.SkillRegistry

  @doc """
  Execute a skill with FHE verification.
  """
  @spec execute_skill(Client.t(), String.t(), keyword()) ::
          {:ok, String.t()} | {:error, term()}
  defdelegate execute_skill(client, skill_id, opts \\ []),
    to: Contracts.SkillRegistry

  @doc """
  Rate a skill (encrypted).
  """
  @spec rate_skill(Client.t(), String.t(), integer(), keyword()) ::
          {:ok, tx_hash()} | {:error, term()}
  defdelegate rate_skill(client, skill_id, rating, opts \\ []),
    to: Contracts.SkillRegistry

  # =============================================================================
  # Actions
  # =============================================================================

  @doc """
  Seal an action for conditional release.
  """
  @spec seal_action(Client.t(), String.t(), keyword()) ::
          {:ok, String.t()} | {:error, term()}
  defdelegate seal_action(client, action_data, opts \\ []),
    to: Contracts.ActionSealer

  @doc """
  Approve an action release.
  """
  @spec approve_action(Client.t(), String.t(), keyword()) ::
          {:ok, tx_hash()} | {:error, term()}
  defdelegate approve_action(client, action_id, opts \\ []),
    to: Contracts.ActionSealer

  @doc """
  Release an action (requires threshold approval).
  """
  @spec release_action(Client.t(), String.t(), keyword()) ::
          {:ok, term()} | {:error, term()}
  defdelegate release_action(client, action_id, opts \\ []),
    to: Contracts.ActionSealer

  # =============================================================================
  # ElixirClaw Integration
  # =============================================================================

  @doc """
  Wrap an ElixirClaw skill with FHE protection.

  This is the main integration point for ElixirClaw users.

  ## Examples

      # Wrap an ElixirClaw capability with FHE
      {:ok, protected_cap} = FHEAgentShield.wrap_elixir_claw_skill(
        client,
        "screen.record",
        require_permits: ["screen_record"]
      )

      # Use with ElixirClaw
      ElixirClaw.Node.execute(protected_cap, %{duration: 10})
  """
  @spec wrap_elixir_claw_skill(Client.t(), String.t(), keyword()) ::
          {:ok, map()} | {:error, term()}
  def wrap_elixir_claw_skill(client, skill_name, opts \\ []) do
    # FHE-protected skill wrapper for ElixirClaw
    # Skills execute through our AgentVault with threshold verification
    permits = Keyword.get(opts, :require_permits, [])
    threshold = Keyword.get(opts, :threshold, 2)

    # Store skill metadata on-chain
    skill_id = "elixir_claw_#{skill_name}_#{:rand.uniform(999_999)}"

    metadata = %{
      name: skill_name,
      permits: permits,
      threshold: threshold,
      wrapped: true,
      wrapper: "FHE-Agent Shield Elixir SDK"
    }

    with {:ok, _} <- register_skill(client, skill_id, Jason.encode!(metadata)) do
      {:ok,
       %{
         skill_id: skill_id,
         name: skill_name,
         permits: permits,
         threshold: threshold,
         execute_fn: fn params ->
           execute_skill(client, skill_id, params)
         end
       }}
    end
  end

  @doc """
  Create FHE-protected memory handler for ElixirClaw.

  ElixirClaw agents can use this for encrypted session memory.
  """
  @spec create_elixir_claw_memory(Client.t(), keyword()) ::
          {:ok, map()} | {:error, term()}
  def create_elixir_claw_memory(client, opts \\ []) do
    session_id = Keyword.get(opts, :session_id, "default")

    {:ok,
     %{
       session_id: session_id,
       append_context: fn data ->
         append_context(client, Base.encode64(Jason.encode!(data)))
       end,
       get_context: fn ->
         get_context(client, session_id: session_id)
       end,
       create_snapshot: fn ->
         create_snapshot(client)
       end,
       restore: fn snapshot_id ->
         restore_snapshot(client, snapshot_id)
       end
     }}
  end

  @doc """
  Create FHE-protected credential vault for ElixirClaw.

  Use this to securely store API keys and secrets.
  """
  @spec create_elixir_claw_vault(Client.t()) ::
          {:ok, map()} | {:error, term()}
  def create_elixir_claw_vault(client) do
    {:ok,
     %{
       store: fn key, value ->
         store_credential(client, key, value)
       end,
       retrieve: fn key, permit \\ "default" ->
         retrieve_credential(client, key, permit: permit)
       end,
       list: fn ->
         list_credentials(client)
       end,
       delete: fn key ->
         delete_credential(client, key)
       end
     }}
  end
end
