# MCP Docs

Tài liệu tổng hợp về tất cả MCP servers trong workspace — overview, phân loại, trạng thái kết nối.

## Tech Stack

- **Format**: Markdown documentation
- **Loại**: Tài liệu tổng hợp — không có code

## Requirements

### Functional
- Tổng quan tất cả MCP servers (self-hosted + external)
- Phân loại theo cách kết nối
- Trạng thái kết nối realtime
- Workflow tích hợp (Design → Knowledge → Data → Code)

## Features

- [x] Bảng tổng quan MCP servers (8 servers)
- [x] Phân loại External vs Self-hosted
- [x] Workflow integration diagram
- [x] Cấu trúc thư mục

## Known Issues

- Folder tên `cloudrun/` trong docs nhưng thực tế là `gg-Cloud-run/` — inconsistent

## Quyết định thiết kế

- **Tách docs riêng**: Tổng quan nằm riêng khỏi root PROJECT.md — root PROJECT.md focus vào technical details, docs/ focus vào onboarding overview
