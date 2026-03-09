# MCP Workspace — Wecare-i

> Tập trung quản lý tất cả MCP servers phục vụ cho hệ sinh thái phát triển Wecare.

## Tổng Quan MCP Servers

| MCP | Loại | Mô tả | Folder |
|-----|------|--------|--------|
| **Stitch** | External | Generate UI screens từ text prompt | [`stitch/`](../stitch/) |
| **NotebookLM** | External | RAG engine, query từ Google NotebookLM | [`notebooklm/`](../notebooklm/) |
| **Figma** | External | Trích xuất design tokens, inspect UI | [`figma/`](../figma/) |
| **GitHub** | External | Quản lý repos, PRs, files | [`github/`](../github/) |
| **BigQuery** | External | Query & phân tích dữ liệu GCP | [`BigQuery/`](../BigQuery/) |
| **CloudRun** | External | Deploy services lên Google Cloud Run | [`cloudrun/`](../cloudrun/) |
| **Dataverse** | Self-hosted | Kết nối Dataverse / Power Platform | [`dataverse-mcp/`](../dataverse-mcp/) |
| **Fabric** | Self-hosted | Microsoft Fabric Lakehouse integration | [`Fabric/`](../Fabric/) |

## Phân Loại

### 🌐 External MCP (không cần build)
Kết nối qua `npx` hoặc HTTPS — chỉ cần config API key/token.

```
stitch/       → HTTPS endpoint (googleapis.com)
notebooklm/   → npx notebooklm-mcp@latest
figma/        → npx figma-mcp (chưa active)
github/       → npx @modelcontextprotocol/server-github
BigQuery/     → npx @toolbox-sdk/server@latest
cloudrun/     → npx @google-cloud/cloud-run-mcp
```

### 🏠 Self-hosted MCP (cần build local)
Chạy từ source code local — cần `npm install && npm run build`.

```
dataverse-mcp/  → node build/index.js  (D:/...03_Personal/MCP/dataverse-mcp/build/index.js)
Fabric/         → Microsoft Fabric Lakehouse (xem Fabric/README.md)
```

## Workflow Tích Hợp

```
DESIGN   →  Figma (inspect) · Stitch (generate AI)
KNOWLEDGE →  NotebookLM (query docs, best practices)
DATA     →  BigQuery (analytics) · Dataverse (CRM/Power Platform)
CODE     →  GitHub (version control) · Cloud Run (deploy)
FABRIC   →  Lakehouse (data engineering)
```

## Cấu Hình Chính

File config MCP: `C:\Users\hoang\.gemini\antigravity\mcp_config.json`

## Cấu Trúc Thư Mục

```
MCP/
├── BigQuery/            ← BigQuery MCP docs
├── Fabric/              ← Microsoft Fabric Lakehouse (self-hosted)
├── cloudrun/            ← Cloud Run MCP docs
├── dataverse-mcp/       ← Dataverse MCP (self-hosted, build/)
├── figma/               ← Figma MCP docs
├── github/              ← GitHub MCP docs
├── notebooklm/          ← NotebookLM MCP docs
├── stitch/              ← Stitch MCP docs
├── docs/                ← Tài liệu tổng hợp (file này)
├── React-template/      ← Template React project
└── .agent/workflows/    ← Automation workflows
```

## Trạng Thái Kết Nối

| MCP | Status |
|-----|--------|
| Stitch | ✅ Active |
| NotebookLM | ✅ Active |
| GitHub | ✅ Active |
| BigQuery | ✅ Active |
| CloudRun | ✅ Active |
| Dataverse | ✅ Active |
| Fabric | ✅ Active |
| Figma | ⏸️ Chưa configure |
