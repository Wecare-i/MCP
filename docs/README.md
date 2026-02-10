# MCP Workspace

> Tập trung quản lý các MCP servers và tài liệu liên quan.

## MCP Servers

| MCP | Mô tả | Folder |
|-----|--------|--------|
| **Stitch** | Generate UI designs từ text prompts | [`stitch/`](stitch/) |
| **NotebookLM** | Query kiến thức từ Google NotebookLM | [`notebooklm/`](notebooklm/) |
| **Figma** | Trích xuất design tokens, inspect UI | [`figma/`](figma/) |

## Workflow Tổng Thể

```
1. DESIGN   →  Figma MCP (inspect) hoặc Stitch MCP (generate)
2. KNOWLEDGE →  NotebookLM MCP (query tài liệu, best practices)
3. BUILD    →  Code từ design + knowledge
```

## Cấu Trúc

```
MCP/
├── stitch/              ← Templates, projects cho Stitch
├── notebooklm/          ← Notebooks, context cho NotebookLM
├── figma/               ← Design tokens, Figma resources
├── docs/                ← Tài liệu chung (file này)
└── .agent/workflows/    ← Automation workflows
```
