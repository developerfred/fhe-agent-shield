"""
Tests for FHE MCP Server
"""

import pytest
from server import FHEMCPServer, MCPRequest, MCPResponse, FHETool


@pytest.fixture
def server():
    return FHEMCPServer()


@pytest.mark.asyncio
async def test_list_tools(server):
    """Test listing tools"""
    response = await server.handle_request(MCPRequest(method="tools/list", params={}))

    assert response.error is None
    assert len(response.result) >= 4  # Default FHE tools


@pytest.mark.asyncio
async def test_call_fhe_credential_store(server):
    """Test calling fhe_credential_store tool"""
    response = await server.handle_request(
        MCPRequest(
            method="tools/call",
            params={
                "name": "fhe_credential_store",
                "params": {"key": "api_key", "value": "secret"},
                "permits": 2,
            },
        )
    )

    assert response.error is None
    assert response.result["tool"] == "fhe_credential_store"
    assert response.result["executed"] is True


@pytest.mark.asyncio
async def test_call_tool_not_found(server):
    """Test calling non-existent tool"""
    response = await server.handle_request(
        MCPRequest(
            method="tools/call",
            params={"name": "nonexistent_tool", "params": {}, "permits": 2},
        )
    )

    assert response.error == "Tool not found: nonexistent_tool"


@pytest.mark.asyncio
async def test_call_tool_insufficient_permits(server):
    """Test calling tool with insufficient permits"""
    response = await server.handle_request(
        MCPRequest(
            method="tools/call",
            params={
                "name": "fhe_credential_store",
                "params": {"key": "key", "value": "value"},
                "permits": 1,  # Too low
            },
        )
    )

    assert "Insufficient permits" in response.error


@pytest.mark.asyncio
async def test_register_new_tool(server):
    """Test registering a new tool"""
    response = await server.handle_request(
        MCPRequest(
            method="tools/register",
            params={
                "name": "custom_tool",
                "description": "A custom FHE tool",
                "threshold": 3,
            },
        )
    )

    assert response.error is None
    assert response.result["registered"] == "custom_tool"


@pytest.mark.asyncio
async def test_unknown_method(server):
    """Test unknown method"""
    response = await server.handle_request(
        MCPRequest(method="unknown/method", params={})
    )

    assert "Unknown method" in response.error


@pytest.mark.asyncio
async def test_multiple_tool_calls(server):
    """Test multiple tool calls"""
    for i in range(3):
        response = await server.handle_request(
            MCPRequest(
                method="tools/call",
                params={
                    "name": "fhe_credential_store",
                    "params": {"key": f"key_{i}", "value": f"value_{i}"},
                    "permits": 2,
                },
            )
        )
        assert response.error is None
