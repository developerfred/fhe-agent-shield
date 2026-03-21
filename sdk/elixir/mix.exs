defmodule FHEAgentShield.MixProject do
  use Mix.Project

  def project do
    [
      app: :fhe_agent_shield,
      version: "1.0.0",
      elixir: "~> 1.14",
      start_permanent: Mix.env() == :prod,
      deps: deps(),
      description: "FHE privacy SDK for AI agents - Elixir",
      package: package(),
      name: "FHE-Agent Shield",
      source_url: "https://github.com/fhenix/fhe-agent-shield"
    ]
  end

  def application do
    [
      extra_applications: [:logger, :crypto]
    ]
  end

  defp deps do
    [
      # HTTP client with WebSocket support
      {:req, "~> 0.4"},
      # JSON parsing
      {:jason, "~> 1.4"},
      # Ethereum utilities
      {:explorer, "~> 0.6"},
      # ABI encoding/decoding
      {:abi, "~> 1.0"},
      # Cryptography utilities
      {:crypto_misc, "~> 0.2"},
      # Telemetry for monitoring
      {:telemetry, "~> 1.2"},
      # HTTP client (optional)
      {:tesla, "~> 1.8"},
      # HTTP/1.1 client with WebSocket
      {:mint, "~> 1.0"},
      # WebSocket support
      {:websocket_client, "~> 1.0"}
    ]
  end

  defp package do
    %{
      files: ["lib", "mix.exs", "README.md", "LICENSE"],
      maintainers: ["FHE-Agent Shield Team"],
      licenses: ["MIT"],
      links: %{
        "GitHub" => "https://github.com/fhenix/fhe-agent-shield",
        "Fhenix Docs" => "https://docs.fhenix.zone"
      }
    }
  end
end
