# NotebookLM MCP Server (TypeScript)

MCP server kết nối Google NotebookLM — RAG engine, query notebooks, manage sources & audio.

## Tech Stack

- **Runtime**: Node.js >= 18
- **Language**: TypeScript
- **Bundler**: tsup (single-file bundle, ~74KB)
- **Auth**: Cookie-based (shared với Python CLI `nlm login`)
- **Transport**: stdio
- **Loại**: Self-hosted — rewrite từ Python sang TypeScript

## Requirements

### Functional
- CRUD notebooks (list, get, create, rename, delete)
- Manage sources (add, list, rename, delete, get content)
- Query notebooks (RAG-powered Q&A)
- Studio operations (create audio, check status, revise)
- Research features (start, status, import)
- Notes management
- Sharing (public, invite, batch)
- Auth token management

### Non-functional
- Single-file bundle cho fast startup
- Cookie auth shared với Python CLI — không cần login lại

### Constraints
- Cần `nlm login` (Python CLI) để lấy cookies ban đầu
- File upload chưa supported (dùng Python CLI `nlm source add --file`)
- HTTP/SSE transport chưa implemented

## Features

- [x] Notebooks — list, get, describe, create, rename, delete (6 tools)
- [x] Sources — add, list_drive, sync_drive, rename, delete, describe, get_content (7 tools)
- [x] Querying — notebook_query, chat_configure (2 tools)
- [x] Studio — create, status, delete, revise (4 tools)
- [x] Downloads — download_artifact (1 tool)
- [x] Exports — export_artifact (1 tool)
- [x] Research — start, status, import (3 tools)
- [x] Notes — note (1 tool)
- [x] Sharing — share_status, share_public, share_invite, share_batch (4 tools)
- [x] Auth — refresh_auth, save_auth_tokens (2 tools)
- [x] Server — server_info (1 tool)
- **Total: 32 tools**

## Dependencies / Tích hợp

| Package | Mục đích |
|---------|----------|
| `@modelcontextprotocol/sdk` | MCP protocol |
| `tsup` | TypeScript bundler |
| `notebooklm-tools` (Python) | Auth token source |

## Known Issues

- File upload chưa supported — phải dùng Python CLI
- Download chưa supported — phải dùng Python CLI
- HTTP/SSE transport chưa implemented (chỉ stdio)

## Roadmap

1. File upload native (không cần Python CLI)
2. HTTP/SSE transport
3. Publish lên npm
4. Auto cookie refresh

## Quyết định thiết kế

- **Rewrite từ Python**: TypeScript cho fast startup, dễ distribute qua npm, nhất quán với các MCP khác
- **Cookie auth**: Google NotebookLM không có official API — phải dùng browser cookies
- **tsup single-file**: Bundle 74KB, startup nhanh so với Python version
- **Shared auth**: Reuse cookies từ Python CLI — không bắt user login lại
