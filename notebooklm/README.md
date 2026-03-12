# NotebookLM MCP Server (TypeScript)

A TypeScript implementation of the NotebookLM MCP (Model Context Protocol) server, providing AI agents with full access to Google NotebookLM features.

## Features

- **32 tools** covering all NotebookLM operations
- **Stdio transport** for direct integration with AI tools (Claude, Gemini, Cursor, Antigravity)
- **Cookie-based authentication** — shared with Python CLI (`nlm login`)
- **Single-file bundle** — 74KB, fast startup

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Run (stdio transport)
node dist/index.js

# Show help
node dist/index.js --help
```

## Authentication

This server shares auth tokens with the Python NotebookLM CLI. Run `nlm login` first:

```bash
# Install Python CLI
pipx install notebooklm-tools

# Login (opens Chrome for cookie extraction)
nlm login
```

Or set cookies manually via environment variable:

```bash
NOTEBOOKLM_COOKIES="SID=xxx; HSID=xxx; ..." node dist/index.js
```

## MCP Configuration

Add to your MCP settings (e.g., `mcp_config.json`):

```json
{
  "mcpServers": {
    "notebooklm": {
      "command": "npx",
      "args": ["-y", "@wcg-hieule/notebooklm-mcp"]
    }
  }
}
```

## Tools

| Category | Tools | Count |
|----------|-------|-------|
| Notebooks | `notebook_list`, `notebook_get`, `notebook_describe`, `notebook_create`, `notebook_rename`, `notebook_delete` | 6 |
| Sources | `source_add`, `source_list_drive`, `source_sync_drive`, `source_rename`, `source_delete`, `source_describe`, `source_get_content` | 7 |
| Querying | `notebook_query`, `chat_configure` | 2 |
| Studio | `studio_create`, `studio_status`, `studio_delete`, `studio_revise` | 4 |
| Downloads | `download_artifact` | 1 |
| Exports | `export_artifact` | 1 |
| Research | `research_start`, `research_status`, `research_import` | 3 |
| Notes | `note` | 1 |
| Sharing | `notebook_share_status`, `notebook_share_public`, `notebook_share_invite`, `notebook_share_batch` | 4 |
| Auth | `refresh_auth`, `save_auth_tokens` | 2 |
| Server | `server_info` | 1 |
| **Total** | | **32** |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NOTEBOOKLM_COOKIES` | Cookie header string | (from auth cache) |
| `NOTEBOOKLM_CSRF_TOKEN` | CSRF token | (auto-extracted) |
| `NOTEBOOKLM_SESSION_ID` | Session ID | (auto-extracted) |
| `NOTEBOOKLM_HL` | Language code | `en` |
| `NOTEBOOKLM_QUERY_TIMEOUT` | Query timeout (seconds) | `120` |
| `NOTEBOOKLM_MCP_TRANSPORT` | Transport type | `stdio` |
| `NOTEBOOKLM_MCP_PORT` | HTTP/SSE port | `3000` |
| `NOTEBOOKLM_MCP_HOST` | HTTP/SSE host | `0.0.0.0` |
| `NOTEBOOKLM_MCP_DEBUG` | Enable debug logging | `false` |

## Limitations

- **File upload**: Not yet supported (use Python CLI `nlm source add --file`)
- **Download**: Not yet supported (use Python CLI `nlm download`)
- **HTTP/SSE transport**: Not yet implemented (only stdio)

## License

MIT
