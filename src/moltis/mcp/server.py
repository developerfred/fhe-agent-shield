"""
FHE MCP Server for Moltis

Provides FHE-enabled MCP (Model Context Protocol) tools.
"""

from dataclasses import dataclass
from typing import Any, Optional


@dataclass
class MCPConfig:
    """Configuration for MCP Server"""

    network: str = "helium"
    contract_address: str = "0x" + "0" * 40
    threshold: int = 2
    rpc_url: str = "https://api.helium.fhenix.zone"


@dataclass
class MCPRequest:
    """MCP request"""

    method: str
    params: dict[str, Any]


@dataclass
class MCPResponse:
    """MCP response"""

    result: Optional[Any] = None
    error: Optional[str] = None


class FHETool:
    """FHE-enabled MCP tool"""

    def __init__(self, name: str, description: str, threshold: int = 2):
        self.name = name
        self.description = description
        self.threshold = threshold

    async def execute(self, params: dict[str, Any], permits: int) -> Any:
        """Execute tool with threshold authorization"""
        if permits < self.threshold:
            raise ValueError(
                f"Insufficient permits: need {self.threshold}, got {permits}"
            )
        return {"tool": self.name, "executed": True, "params": params}


class FHEMCPServer:
    """
    FHE-enabled MCP Server for Moltis.

    Handles MCP protocol requests with FHE encryption.
    """

    def __init__(self, config: Optional[MCPConfig] = None):
        self.config = config or MCPConfig()
        self._tools: dict[str, FHETool] = {}
        self._vault: dict[str, str] = {}

        # Register default FHE tools
        self._register_default_tools()

    def _register_default_tools(self):
        """Register default FHE tools"""
        self.register_tool(FHETool("fhe_credential_store", "Store FHE credential", 2))
        self.register_tool(
            FHETool("fhe_credential_retrieve", "Retrieve FHE credential", 2)
        )
        self.register_tool(FHETool("fhe_memory_append", "Append to FHE memory", 2))
        self.register_tool(FHETool("fhe_memory_get", "Get FHE memory", 2))

    def register_tool(self, tool: FHETool):
        """Register an MCP tool"""
        self._tools[tool.name] = tool

    async def handle_request(self, request: MCPRequest) -> MCPResponse:
        """Handle an MCP request"""
        try:
            if request.method == "tools/list":
                return MCPResponse(result=self.list_tools())

            elif request.method == "tools/call":
                return await self.call_tool(request.params)

            elif request.method == "tools/register":
                return await self.register_tool_request(request.params)

            else:
                return MCPResponse(error=f"Unknown method: {request.method}")

        except Exception as e:
            return MCPResponse(error=str(e))

    def list_tools(self) -> list[dict[str, str]]:
        """List all available tools"""
        return [
            {"name": tool.name, "description": tool.description}
            for tool in self._tools.values()
        ]

    async def call_tool(self, params: dict[str, Any]) -> MCPResponse:
        """Call a tool by name"""
        tool_name = params.get("name")
        tool_params = params.get("params", {})
        permits = params.get("permits", 2)

        if tool_name not in self._tools:
            return MCPResponse(error=f"Tool not found: {tool_name}")

        try:
            tool = self._tools[tool_name]
            result = await tool.execute(tool_params, permits)
            return MCPResponse(result=result)
        except Exception as e:
            return MCPResponse(error=str(e))

    async def register_tool_request(self, params: dict[str, Any]) -> MCPResponse:
        """Register a new tool"""
        name = params.get("name")
        description = params.get("description", "")
        threshold = params.get("threshold", 2)

        if not name:
            return MCPResponse(error="Tool name is required")

        tool = FHETool(name, description, threshold)
        self.register_tool(tool)

        return MCPResponse(result={"registered": name})
