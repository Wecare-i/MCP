# Figma MCP (Framelink)

Framelink MCP for Figma — trích xuất design data từ Figma files cho AI coding tools.

## Tech Stack

- **Package**: `figma-developer-mcp` (npm, npx)
- **Source**: Cloned từ [GLips/Figma-Context-MCP](https://github.com/GLips/Figma-Context-MCP)
- **Auth**: Figma Personal Access Token
- **Transport**: stdio
- **Loại**: External MCP — clone repo cho reference

## Requirements

### Functional
- Inspect Figma design files (layout, styling, metadata)
- Cung cấp context cho AI tools (Cursor, Claude, Antigravity)
- Simplify Figma API response cho LLM consumption

### Constraints
- Cần Figma Desktop App đang chạy (local)
- Cần Figma Personal Access Token
- **Status**: ⏸️ Chưa configure

## Features

- [x] Fetch Figma file metadata
- [x] Get node design data (layout, styling)
- [x] Simplify response cho LLM
- [ ] Configure và kết nối vào Antigravity (pending)

## Dependencies / Tích hợp

- **Figma API** — design data source
- **Figma Desktop App** — cần chạy local

## Known Issues

- Chưa configure — cần Figma Desktop App + API token
- Folder này là clone từ upstream, không customize

## Roadmap

1. Configure Figma API token
2. Test integration với Antigravity
3. Kết hợp với react:components skill

## Quyết định thiết kế

- **Clone repo** thay vì chỉ npx: Giữ local reference cho docs và troubleshooting
- **Chưa prioritize**: Stitch MCP đã cover phần generate UI — Figma MCP là bổ sung cho inspect existing designs
