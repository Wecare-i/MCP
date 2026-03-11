# MCP Workspace — Wecare-i

> Monorepo quản lý tất cả MCP (Model Context Protocol) servers phục vụ hệ sinh thái AI-assisted development của Wecare.

## Tech Stack

- **Runtime**: Node.js >= 18
- **Language**: TypeScript (self-hosted servers), JavaScript (gg-Cloud-run)
- **Protocol**: MCP SDK (`@modelcontextprotocol/sdk`)
- **Auth**: Azure Service Principal (OAuth2), Google ADC, GitHub PAT
- **Transport**: stdio (local), HTTPS (external)

## Tổng Quan MCP Servers

### 🏠 Self-hosted (cần build local)

| MCP | Version | Package | Mô tả | Tools |
|-----|---------|---------|--------|:-----:|
| **Dataverse** | 1.1.0 | `@wecare-team/dataverse-mcp` | CRUD + FetchXML + Quality Analysis cho Microsoft Dataverse | 17 |
| **Fabric** | 1.0.0 | `fabric-lakehouse-mcp-server` | Lakehouse SQL + Workspace + Semantic + Reports + Dataflow + Notebook | 25+ |

### 🌐 External (chỉ cần config)

| MCP | Cách kết nối | Mô tả | Status |
|-----|-------------|--------|--------|
| **Stitch** | HTTPS (`stitch.googleapis.com`) | Generate UI screens từ text prompt | ✅ Active |
| **NotebookLM** | `npx notebooklm-mcp@latest` | RAG engine — query từ Google NotebookLM | ✅ Active |
| **GitHub** | `npx @modelcontextprotocol/server-github` | Quản lý repos, PRs, push files | ✅ Active |
| **BigQuery** | `npx @toolbox-sdk/server@latest` | Query & phân tích dữ liệu GCP | ✅ Active |
| **CloudRun** | `npx @google-cloud/cloud-run-mcp` | Deploy services lên Google Cloud Run | ✅ Active |
| **Figma** | `npx figma-developer-mcp` | Inspect design files (cần Figma Desktop) | ⏸️ Chưa configure |

## Cấu Trúc Thư Mục

```
MCP/
├── BigQuery/              ← Docs + mcp-bigquery-pkg (@wecare-i/mcp-bigquery v1.0.0)
├── Fabric/                ← Self-hosted Fabric MCP (TypeScript, src/ + dist/)
│   └── src/
│       ├── index.ts       ← Entry point (3 clients: SQL, REST, PowerBI)
│       ├── services/      ← fabricClient, fabricRestClient, powerbiClient
│       ├── tools/         ← 8 tool modules (table, query, analysis, workspace, semantic, report, dataflow, notebook)
│       └── schemas/       ← Zod validation schemas
├── React-template/        ← 10 Stitch layout templates + Wecare Design System
├── dataverse-mcp/         ← Self-hosted Dataverse MCP (TypeScript, published npm)
│   └── src/
│       ├── index.ts       ← Entry point (MsalAuth + DataverseClient)
│       ├── auth/          ← MSAL OAuth2
│       ├── client/        ← HTTP client cho Dataverse OData API
│       ├── tools/         ← 18 tool files (incl. dependency-resolver)
│       └── types/         ← TypeScript interfaces
├── docs/                  ← Tài liệu tổng hợp (README.md)
├── figma/                 ← Figma MCP setup docs
├── gg-Cloud-run/          ← Google Cloud Run MCP (cloned repo, v1.10.0)
├── github/                ← GitHub MCP setup docs
├── notebooklm/            ← NotebookLM MCP setup docs
├── stitch/                ← Stitch MCP setup docs
├── .agent/workflows/      ← Automation workflows (app.md)
└── .gitignore
```

## Features

### Dataverse MCP (`dataverse-mcp/`)
- [x] CRUD operations (create, read, update, delete records)
- [x] Entity metadata & attributes discovery
- [x] OData query ($filter, $select, $top, $orderby, $expand)
- [x] FetchXML query (aggregation, groupby)
- [x] Relationships exploration (1:N, N:1, N:N)
- [x] OptionSet/Choice values
- [x] Delete table/attribute với dependency resolution tự động
- [x] Publish customizations
- [x] Data quality analysis (null rate)
- [x] Execute Dataverse Actions (Bound/Unbound)
- [x] Published to npm: `@wecare-team/dataverse-mcp`

### Fabric MCP (`Fabric/`)
- [x] Lakehouse SQL queries (tedious driver)
- [x] Table exploration (list, schema, preview, search, stats)
- [x] Workspace management (list, get, items)
- [x] Semantic Model / DAX queries
- [x] Reports & Dashboards listing
- [x] Dataflow Gen2 operations (list, run, status)
- [x] Notebook & Spark (list, run, status)
- [x] 3 API clients: FabricClient (SQL), FabricRestClient (REST), PowerBIClient
- [x] MCP Resources (connection_info, tables_catalog)

### React Templates (`React-template/`)
- [x] 10 layout templates chuẩn cho Stitch MCP
- [x] Wecare Design System (00-wecare-design-system.md)
- [x] Loop Mode support cho multi-screen generation

## Dependencies / Tích hợp

| Package | Dùng trong | Mục đích |
|---------|-----------|----------|
| `@modelcontextprotocol/sdk` | Tất cả self-hosted | MCP protocol |
| `@azure/identity` | Fabric | Auth Azure Service Principal |
| `@azure/msal-node` | Dataverse | Auth MSAL OAuth2 |
| `mssql` | Fabric | SQL connection (Lakehouse) |
| `dotenv` | Fabric, Dataverse | Environment variables |
| `zod` | Fabric | Schema validation |

## Known Issues

- **Figma MCP** chưa được configure — cần Figma Desktop App đang chạy
- `gg-Cloud-run/` là repo clone từ Google, có 2 TODOs nội bộ (không ảnh hưởng)
- BigQuery `mcp-bigquery-pkg` chưa publish lên npm (chỉ có local)

## Roadmap

- [ ] Publish `@wecare-i/mcp-bigquery` lên npm
- [ ] Configure Figma MCP
- [ ] Fabric MCP: publish npm package
- [ ] Thêm MCP mới (nếu có nhu cầu)

## Quyết Định Thiết Kế

- **Monorepo pattern**: Tất cả MCP servers trong 1 workspace để dễ quản lý, chia sẻ docs
- **Self-hosted vs External**: Chỉ self-host khi không có NPM package sẵn hoặc cần custom logic (Dataverse, Fabric)
- **stdio transport**: Tất cả self-hosted MCP dùng stdio cho local development — không cần HTTP server
- **Azure Service Principal**: Auth pattern thống nhất cho Microsoft services (Dataverse, Fabric, Power BI)
- **Mỗi folder = 1 MCP**: README.md chuẩn hóa (Yêu cầu → Cài đặt → Tools → Resources)
