#!/bin/bash
set -e

echo "=========================================="
echo "FHE-Agent Shield - Sandbox Runner"
echo "=========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "Project root: $PROJECT_ROOT"
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! command -v docker compose &> /dev/null; then
    echo "ERROR: Docker Compose is not installed"
    exit 1
fi

COMPOSE_CMD="docker compose"
if ! command -v docker compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
fi

# Parse arguments
ACTION="${1:-up}"

case "$ACTION" in
    up|start)
        echo "=== Starting Sandbox ==="
        $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" up -d
        echo ""
        echo "Services started. View logs with:"
        echo "  $COMPOSE_CMD -f $SCRIPT_DIR/docker-compose.yml logs -f"
        ;;
    down|stop)
        echo "=== Stopping Sandbox ==="
        $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" down
        ;;
    logs)
        echo "=== Viewing Logs ==="
        $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml logs -f
        ;;
    deploy)
        echo "=== Deploying Contracts ==="
        cast rpc eth_chainId --rpc-url http://localhost:8545 > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "Anvil is running, deploying contracts..."
            forge script script/ForkIntegration.s.sol:ForkIntegrationTest \
              --rpc-url http://localhost:8545 \
              --broadcast
        else
            echo "ERROR: Anvil is not running"
            echo "Start it first with: docker-compose -f $SCRIPT_DIR/docker-compose.yml up -d anvil"
            exit 1
        fi
        ;;
    test)
        echo "=== Running Integration Tests ==="
        npx vitest run test/typescript/openclaw-integration.test.ts
        ;;
    shell)
        echo "=== Opening Shell in Deployer Container ==="
        $COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" run deployer /bin/sh
        ;;
    *)
        echo "Usage: $0 {up|down|logs|deploy|test|shell}"
        echo ""
        echo "Commands:"
        echo "  up    - Start all services (Anvil + OpenClaw + Tests)"
        echo "  down  - Stop all services"
        echo "  logs  - View service logs"
        echo "  deploy - Deploy contracts to Anvil"
        echo "  test  - Run TypeScript integration tests"
        echo "  shell - Open shell in deployer container"
        exit 1
        ;;
esac
