#!/bin/bash
# FHE-Agent Shield SDK Verification Script

set -e

echo "========================================="
echo "FHE-Agent Shield SDK Verification"
echo "========================================="

PROJECT_ROOT="/Volumes/MASS/lab-codingsh/fhenix-ecossystem/fhe-agent-shield"
cd "$PROJECT_ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass_count=0
fail_count=0

# Function to check result
check_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: $2"
    ((pass_count++))
  else
    echo -e "${RED}❌ FAIL${NC}: $2"
    ((fail_count++))
  fi
}

echo ""
echo "--- Checking SDK Directories ---"

# Check TypeScript SDK
if [ -d "sdk/typescript" ]; then
  check_result 0 "TypeScript SDK directory exists"
  
  # Check package.json
  if [ -f "sdk/typescript/package.json" ]; then
    check_result 0 "TypeScript package.json exists"
  else
    check_result 1 "TypeScript package.json missing"
  fi
  
  # Check src
  if [ -d "sdk/typescript/src" ]; then
    check_result 0 "TypeScript src directory exists"
  else
    check_result 1 "TypeScript src directory missing"
  fi
else
  check_result 1 "TypeScript SDK directory missing"
fi

# Check Python SDK
if [ -d "sdk/python" ]; then
  check_result 0 "Python SDK directory exists"
  
  # Check pyproject.toml
  if [ -f "sdk/python/pyproject.toml" ]; then
    check_result 0 "Python pyproject.toml exists"
  else
    check_result 1 "Python pyproject.toml missing"
  fi
  
  # Check src
  if [ -d "sdk/python/src" ]; then
    check_result 0 "Python src directory exists"
  else
    check_result 1 "Python src directory missing"
  fi
else
  check_result 1 "Python SDK directory missing"
fi

# Check Rust SDK
if [ -d "sdk/rust" ]; then
  check_result 0 "Rust SDK directory exists"
  
  # Check Cargo.toml
  if [ -f "sdk/rust/Cargo.toml" ]; then
    check_result 0 "Rust Cargo.toml exists"
  else
    check_result 1 "Rust Cargo.toml missing"
  fi
  
  # Check src
  if [ -d "sdk/rust/src" ]; then
    check_result 0 "Rust src directory exists"
  else
    check_result 1 "Rust src directory missing"
  fi
else
  check_result 1 "Rust SDK directory missing"
fi

# Check ElizaOS Plugin
if [ -d "sdk/elizaos-plugin" ]; then
  check_result 0 "ElizaOS plugin directory exists"
else
  check_result 1 "ElizaOS plugin directory missing"
fi

# Check Nanobot Integration
if [ -d "sdk/nanobot-integration" ]; then
  check_result 0 "Nanobot integration directory exists"
else
  check_result 1 "Nanobot integration directory missing"
fi

echo ""
echo "--- Running Foundry Tests ---"

# Run Foundry tests
forge test 2>&1 | tail -5
if [ ${PIPESTATUS[0]} -eq 0 ]; then
  check_result 0 "Foundry tests passing"
else
  check_result 1 "Foundry tests failed"
fi

echo ""
echo "--- SDK Summary ---"
echo -e "Passed: ${GREEN}$pass_count${NC}"
echo -e "Failed: ${RED}$fail_count${NC}"

if [ $fail_count -eq 0 ]; then
  echo -e "${GREEN}All checks passed!${NC}"
  exit 0
else
  echo -e "${RED}Some checks failed!${NC}"
  exit 1
fi
