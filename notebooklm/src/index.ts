/**
 * NotebookLM MCP Server — TypeScript Entry Point.
 * 
 * Supports transports: stdio (default), streamable-http, sse.
 * 
 * Environment variables:
 *   NOTEBOOKLM_MCP_TRANSPORT  - "stdio" | "http" | "sse" (default: stdio)
 *   NOTEBOOKLM_MCP_PORT       - Port for HTTP/SSE (default: 3000)
 *   NOTEBOOKLM_MCP_HOST       - Host for HTTP/SSE (default: 0.0.0.0)
 *   NOTEBOOKLM_MCP_DEBUG      - "true" to enable debug logging
 *   NOTEBOOKLM_COOKIES        - Cookie header string (alternative to auth cache)
 *   NOTEBOOKLM_CSRF_TOKEN     - CSRF token (optional)
 *   NOTEBOOKLM_SESSION_ID     - Session ID (optional)
 *   NOTEBOOKLM_HL             - Language code (default: en)
 *   NOTEBOOKLM_QUERY_TIMEOUT  - Query timeout in seconds (default: 120)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./tools/index.js";
import { setDebugMode } from "./core/client.js";

// ============================================================================
// CLI Argument Parsing
// ============================================================================

function parseArgs(): {
  transport: string;
  port: number;
  host: string;
  debug: boolean;
} {
  const args = process.argv.slice(2);
  let transport = process.env.NOTEBOOKLM_MCP_TRANSPORT ?? "stdio";
  let port = parseInt(process.env.NOTEBOOKLM_MCP_PORT ?? "3000", 10);
  let host = process.env.NOTEBOOKLM_MCP_HOST ?? "0.0.0.0";
  let debug = process.env.NOTEBOOKLM_MCP_DEBUG?.toLowerCase() === "true";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--transport" && i + 1 < args.length) {
      transport = args[++i];
    } else if (arg === "--port" && i + 1 < args.length) {
      port = parseInt(args[++i], 10);
    } else if (arg === "--host" && i + 1 < args.length) {
      host = args[++i];
    } else if (arg === "--debug") {
      debug = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
NotebookLM MCP Server (TypeScript)

Usage:
  notebooklm-mcp [options]

Options:
  --transport <type>  Transport: stdio, http, sse (default: stdio)
  --port <port>       Port for HTTP/SSE (default: 3000)
  --host <host>       Host for HTTP/SSE (default: 0.0.0.0)
  --debug             Enable debug logging
  -h, --help          Show this help

Environment Variables:
  NOTEBOOKLM_COOKIES       Cookie header string
  NOTEBOOKLM_CSRF_TOKEN    CSRF token  
  NOTEBOOKLM_SESSION_ID    Session ID
  NOTEBOOKLM_HL            Language code (default: en)
  NOTEBOOKLM_QUERY_TIMEOUT Query timeout in seconds (default: 120)
  NOTEBOOKLM_MCP_DEBUG     "true" to enable debug logging
`);
      process.exit(0);
    }
  }

  return { transport, port, host, debug };
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const config = parseArgs();

  if (config.debug) {
    setDebugMode(true);
    console.error("[NotebookLM-MCP] Debug mode enabled");
  }

  // Create MCP server
  const server = new McpServer({
    name: "notebooklm-mcp",
    version: "1.0.0",
  });

  // Register all tools
  registerAllTools(server);

  // Start transport
  if (config.transport === "stdio") {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    if (config.debug) {
      console.error("[NotebookLM-MCP] Connected via stdio transport");
    }
  } else {
    // HTTP and SSE transports require additional setup
    console.error(`[NotebookLM-MCP] Transport '${config.transport}' is not yet implemented.`);
    console.error("[NotebookLM-MCP] Currently only 'stdio' is supported.");
    console.error("[NotebookLM-MCP] Falling back to stdio transport...");
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}

main().catch((err) => {
  console.error("[NotebookLM-MCP] Fatal error:", err);
  process.exit(1);
});
