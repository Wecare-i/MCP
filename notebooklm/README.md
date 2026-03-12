# @wcg-hieule/notebooklm-mcp

> **MCP Server for Google NotebookLM** — Full API access to NotebookLM notebooks, sources, studio, research, and sharing — from any AI agent.

[![npm version](https://img.shields.io/npm/v/@wcg-hieule/notebooklm-mcp.svg)](https://www.npmjs.com/package/@wcg-hieule/notebooklm-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@wcg-hieule/notebooklm-mcp.svg)](https://www.npmjs.com/package/@wcg-hieule/notebooklm-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

---

## Quick Start

Add to your `mcp_config.json`:

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

---

## Authentication

This server shares auth tokens with the Python **NotebookLM CLI**. Run `nlm login` first:

```bash
# Install Python CLI
pipx install notebooklm-tools

# Login (opens Chrome for cookie extraction)
nlm login
```

Or set cookies manually via environment variable:

```bash
NOTEBOOKLM_COOKIES="SID=xxx; HSID=xxx; ..." npx @wcg-hieule/notebooklm-mcp
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `NOTEBOOKLM_COOKIES` | ❌ | (from auth cache) | Full cookie header string |
| `NOTEBOOKLM_CSRF_TOKEN` | ❌ | (auto-extracted) | CSRF token |
| `NOTEBOOKLM_SESSION_ID` | ❌ | (auto-extracted) | Session ID |
| `NOTEBOOKLM_HL` | ❌ | `en` | Language code |
| `NOTEBOOKLM_QUERY_TIMEOUT` | ❌ | `120` | Query timeout in seconds |
| `NOTEBOOKLM_MCP_DEBUG` | ❌ | `false` | Enable debug logging |

---

## Tools (32)

### 📓 Notebooks

| Tool | Description |
|------|-------------|
| `notebook_list` | List all notebooks |
| `notebook_get` | Get notebook details |
| `notebook_describe` | Describe notebook content |
| `notebook_create` | Create a new notebook |
| `notebook_rename` | Rename a notebook |
| `notebook_delete` | Delete a notebook |

### 📎 Sources

| Tool | Description |
|------|-------------|
| `source_add` | Add a source to a notebook |
| `source_list_drive` | List Drive files available as sources |
| `source_sync_drive` | Sync Drive sources |
| `source_rename` | Rename a source |
| `source_delete` | Delete a source |
| `source_describe` | Describe a source |
| `source_get_content` | Get source content |

### 💬 Querying & Chat

| Tool | Description |
|------|-------------|
| `notebook_query` | Query a notebook with a question |
| `chat_configure` | Configure chat settings |

### 🎙️ Studio

| Tool | Description |
|------|-------------|
| `studio_create` | Generate audio overview (podcast) |
| `studio_status` | Check studio generation status |
| `studio_delete` | Delete a studio artifact |
| `studio_revise` | Revise a studio artifact |

### 🔬 Research

| Tool | Description |
|------|-------------|
| `research_start` | Start a deep research session |
| `research_status` | Check research status |
| `research_import` | Import research results to notebook |

### 📤 Sharing & Export

| Tool | Description |
|------|-------------|
| `notebook_share_status` | Get sharing status |
| `notebook_share_public` | Make notebook public |
| `notebook_share_invite` | Invite collaborators |
| `notebook_share_batch` | Batch sharing operations |
| `export_artifact` | Export studio artifact |
| `download_artifact` | Download studio artifact |
| `note` | Add or manage notes |

### 🔐 Auth & Server

| Tool | Description |
|------|-------------|
| `refresh_auth` | Refresh authentication tokens |
| `save_auth_tokens` | Save tokens to cache |
| `server_info` | Get server info and status |

---

## Compatibility

Works with any MCP-compatible AI client:

- ✅ Gemini CLI / Antigravity IDE
- ✅ Claude Desktop
- ✅ VS Code Copilot
- ✅ Cursor

---

## License

MIT © [wcg-hieule](https://www.npmjs.com/~wcg-hieule)
