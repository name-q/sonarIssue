import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tools } from "./tools.js";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "sonarissues",
    version: "1.0.0",
  });

  // 注册所有工具
  tools.forEach((tool) => {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.schema as any,
      },
      // @ts-ignore
      tool.handler
    );
  });

  return server;
}
