# Foundry Fork Testing Guide

This directory contains fork tests for testing FHE-Agent Shield contracts on live networks.

## Setup

1. Set your Fhenix RPC URL:

```bash
export SEPOLIA_RPC_URL="https://rpc.sepolia.org"
```

2. Run fork tests:

```bash
forge test --match-path "test/fork/*" -vvv
```

## Running Specific Fork Tests

Test deployment to fork:

```bash
forge test --match-test "testFork.*Deployment" -vvv
```

Test chain connectivity:

```bash
forge test --match-test "testForkCanRead*" -vvv
```

## Notes

- Fork tests use `vm.createSelectFork(forkUrl)` to run tests against a live network
- Tests check `block.number > 0` to detect if running on a fork
- Deployment tests create NEW contract instances on the fork
- To test EXISTING contracts, use `vm.mockCall` or direct `eth_call`
