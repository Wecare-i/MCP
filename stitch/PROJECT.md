# Stitch MCP

Google Stitch MCP — generate và edit UI screens từ text prompt.

## Tech Stack

- **Protocol**: HTTPS (remote MCP server)
- **Endpoint**: `stitch.googleapis.com/mcp`
- **Auth**: Google API Key (từ AI Studio)
- **Transport**: HTTPS (streamable)
- **Loại**: External MCP — không cần build

## Requirements

### Functional
- Tạo project container cho screens
- Generate UI screens từ text prompt
- Edit screens theo feedback
- Generate variants (alternatives)
- List/get projects và screens

### Constraints
- Cần Google API Key có access Stitch
- Output là HTML — cần convert sang React (qua react:components skill)

## Features

- [x] Create project
- [x] Generate screen from text prompt
- [x] Edit existing screens
- [x] Generate variants
- [x] List projects
- [x] Get project details
- [x] List screens in project
- [x] Get screen details + HTML

## Dependencies / Tích hợp

- **Google AI Studio** — API key source
- **React-template/** — prompt templates cho Stitch
- **react:components skill** — convert HTML output sang React
- **stitch-loop skill** — multi-screen generation
- **enhance-prompt skill** — tối ưu prompt

## Known Issues

- Không có — external service, zero custom code

## Roadmap

- Không có customize plan — sử dụng as-is từ Google

## Quyết định thiết kế

- **HTTPS transport**: Stitch là remote MCP server hosted bởi Google — không cần local runtime
- **Tách prompt templates**: Templates nằm riêng trong `React-template/` — dễ maintain, dễ share
