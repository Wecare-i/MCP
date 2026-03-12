# Stitch React Templates

Bộ 10 layout templates chuẩn cho Stitch MCP, kèm Wecare Design System.

## Tech Stack

- **Format**: Markdown (prompt templates)
- **Target**: Stitch MCP → generate UI screens
- **Design System**: Wecare brand (teal/dark, Inter font)
- **Loại**: Documentation / Templates — không có code

## Requirements

### Functional
- Cung cấp prompt templates cho 10 loại layout phổ biến
- Mỗi template có: mô tả, component list, Stitch prompt mẫu
- Hỗ trợ Loop Mode cho multi-screen generation
- Wecare Design System reference

### Constraints
- Templates phải tương thích Stitch MCP API
- Loop Mode chỉ áp dụng cho layouts có navigation nhất quán

## Features

- [x] 10 layout templates (Admin Dashboard → Centered Layout)
- [x] Wecare Design System (00-wecare-design-system.md)
- [x] Loop Mode support (6/10 templates)
- [x] Use case mapping cho từng template

## Dependencies / Tích hợp

- **Stitch MCP** — consumer chính (generate_screen_from_text)
- **stitch-loop skill** — sử dụng templates cho multi-screen gen
- **react:components skill** — convert output thành React

## Known Issues

- Không có — đây là tài liệu tĩnh

## Roadmap

1. Thêm templates mobile-specific
2. Thêm dark mode variants
3. Component-level templates (không chỉ page layouts)

## Quyết định thiết kế

- **Markdown format**: Dễ đọc, dễ copy-paste vào Stitch prompt — không cần build
- **Loop Mode flag**: Chỉ mark templates có navigation nhất quán (sidebar/navbar) — tránh inconsistency khi gen nhiều screens
