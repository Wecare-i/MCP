# Fabric MCP Server

MCP server kết nối AI (Claude, Gemini, VS Code Copilot) với toàn bộ Microsoft Fabric platform.

## Tech Stack

- **Runtime**: Node.js >= 18
- **Language**: TypeScript
- **MCP SDK**: `@modelcontextprotocol/sdk` ^1.6.1
- **Auth**: Azure Service Principal (`@azure/identity` ^4.0.0)
- **SQL Driver**: `tedious` (qua `mssql` ^11.0.0) — Fabric SQL Endpoint
- **Validation**: `zod` ^3.23.8
- **Transport**: stdio (local)

## Requirements

### Functional
- Kết nối và query Fabric Lakehouse qua SQL Endpoint (read-only)
- Quản lý Workspaces qua Fabric REST API
- Truy vấn Semantic Models qua Power BI REST API (DAX queries)
- Khám phá Reports & Dashboards
- Quản lý và trigger Dataflow Gen2
- Quản lý và chạy Notebooks trên Spark
- *(Planned)* Quản lý Data Pipelines
- *(Planned)* CI/CD Deployment Pipelines

### Non-functional
- Read-only SQL (block INSERT/UPDATE/DELETE/DROP...)
- Output character limit 50,000 để tránh overwhelm LLM
- Auto-add TOP clause cho query không có LIMIT
- Token cache cho Azure AD access token

### Constraints
- Yêu cầu Azure Service Principal (Client ID + Secret)
- Fabric SQL Endpoint chỉ hỗ trợ tedious driver trực tiếp (không dùng mssql ConnectionPool)

## Features

- [x] Lakehouse SQL — list/schema/preview/search tables, execute query, row count, column stats, table summary
- [x] Workspace Management — list workspaces, get workspace, list items (filter by type)
- [x] Semantic Model — list models, get model, execute DAX
- [x] Reports & Dashboards — list reports/dashboards, get report, get pages, get tiles
- [x] Dataflow Gen2 — list, get, run (trigger), get status
- [x] Notebooks & Spark — list, get, run (with parameters), get status
- [ ] Data Pipeline — list, get, run, get status *(planned)*
- [ ] CI/CD Deployment — list pipelines, get stages, deploy *(planned)*

## Architecture

### 3 Clients

| Client | API Base | Scope | Dùng cho |
|--------|----------|-------|----------|
| `FabricClient` | SQL Endpoint (tedious) | `database.windows.net` | Lakehouse SQL query |
| `FabricRestClient` | `api.fabric.microsoft.com/v1` | `api.fabric.microsoft.com` | Workspace, Dataflow, Notebook, Pipeline, CI/CD |
| `PowerBIClient` | `api.powerbi.com/v1.0/myorg` | `analysis.windows.net` | Semantic Model, Reports, Dashboards |

### Project Structure

```
src/
├── index.ts              # Entry point + MCP resources
├── types.ts              # TypeScript interfaces
├── constants.ts          # Constants & limits
├── services/
│   ├── fabricClient.ts       # SQL (tedious + Azure AD token)
│   ├── fabricRestClient.ts   # Fabric REST API
│   └── powerbiClient.ts     # Power BI REST API
├── tools/
│   ├── tableTools.ts         # 4 tools — list, schema, preview, search
│   ├── queryTools.ts         # 2 tools — execute SQL, row count
│   ├── analysisTools.ts      # 2 tools — column stats, table summary
│   ├── workspaceTools.ts     # 3 tools — list, get, list items
│   ├── semanticTools.ts      # 3 tools — list models, get, execute DAX
│   ├── reportTools.ts        # 5 tools — reports + dashboards
│   ├── dataflowTools.ts      # 4 tools — list, get, run, status
│   └── notebookTools.ts      # 4 tools — list, get, run, status
└── schemas/
    └── *Schemas.ts           # Zod input schemas (1 file per domain)
```

### Tool Count: 27 tools total

## Dependencies / Tích hợp

- **Microsoft Fabric** — SQL Endpoint + REST API
- **Power BI** — REST API (DAX query, Reports, Dashboards)
- **Azure AD** — OAuth2 Client Credentials (Service Principal)

## Known Issues

- `mssql` ConnectionPool không tương thích 100% với Fabric SQL Endpoint → dùng tedious Connection trực tiếp
- Một số API trả về 202/204 không có body → cần handle đặc biệt
- Fabric REST API cho Dataflow/Notebook dùng generic items endpoint cho jobs: `/workspaces/{wsId}/items/{itemId}/jobs/instances`

## Roadmap

1. Thêm Data Pipeline tools (list, get, run, get_status)
2. Thêm CI/CD Deployment Pipeline tools (list, get_stages, deploy)
3. Publish lên npm
4. Hỗ trợ Lakehouse File API (upload/download files)

## Quyết định thiết kế

- **3 clients tách biệt** thay vì 1 client chung: mỗi Azure service có scope khác nhau, tách riêng giúp token caching hiệu quả hơn
- **Read-only SQL** bắt buộc: chặn mutation keywords ở application level, không phụ thuộc vào DB permissions
- **registerTool** (Lakehouse tools) vs **server.tool** (REST tools): Lakehouse tools dùng `registerTool` mới hơn với `annotations`, REST tools dùng `server.tool` đơn giản hơn
- **Pattern: workspace_id optional** — tất cả REST tools đều nhận optional `workspace_id`, fallback về `FABRIC_WORKSPACE_ID` từ env
