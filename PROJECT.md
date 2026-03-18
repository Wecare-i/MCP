# MCP Workspace — Wecare-i

> Monorepo quản lý tất cả MCP (Model Context Protocol) servers phục vụ hệ sinh thái AI-assisted development của Wecare.

**Last Updated**: 2026-03-14

---

## Tech Stack

- **Runtime**: Node.js >= 18
- **Language**: TypeScript (self-hosted), JavaScript (gg-Cloud-run)
- **Protocol**: MCP SDK (`@modelcontextprotocol/sdk`)
- **Auth**: Azure Service Principal (OAuth2 Client Credentials), Google ADC, GitHub PAT
- **Transport**: stdio (local), HTTPS (external)
- **Bundler**: `tsup` (PP Admin, Canvas, Automate) | `tsc` (Dataverse, Fabric)

---

## Tổng Quan MCP Servers

### 🏠 Self-hosted (build local)

| MCP | Package | Version | npm Status | Tools |
|-----|---------|---------|------------|:-----:|
| **Dataverse** | `@wcg-hieule/dataverse-mcp` | `1.1.1` | ✅ Published | 17 |
| **Fabric** | `@wcg-hieule/fabric-mcp` | — | ⏸️ Chưa publish | 25+ |
| **PP Admin** | `@wcg-hieule/powerplatform-admin-mcp` | `1.0.0` | ⏸️ Chưa publish | 10 |
| **Canvas Apps** | `@wcg-hieule/canvas-apps-mcp` | `1.0.0` | ⏸️ Chưa publish | 6 |
| **Power Automate** | `@wcg-hieule/power-automate-mcp` | `1.0.0` | ⏸️ Chưa publish | 7 |
| **Azure Cost** | `@wcg-hieule/azure-cost-mcp` | `1.0.0` | ⏸️ Chưa publish | 7 |
| **PP License** | `@wcg-hieule/pp-license-mcp` | `1.0.0` | ⏸️ Chưa publish | 6 |

### 🌐 External (chỉ cần config)

| MCP | Cách kết nối | Mô tả | Status |
|-----|-------------|--------|--------|
| **Stitch** | HTTPS (`stitch.googleapis.com`) | Generate UI screens từ text prompt | ✅ Active |
| **NotebookLM** | `npx @wcg-hieule/notebooklm-mcp` | RAG engine — query từ Google NotebookLM | ✅ Active |
| **GitHub** | `npx @modelcontextprotocol/server-github` | Repos, PRs, push files | ✅ Active |
| **BigQuery** | `npx @wcg-hieule/bigquery-mcp` | Query & phân tích dữ liệu GCP | ✅ Active |
| **CloudRun** | `npx @wcg-hieule/cloudrun-mcp` | Deploy services lên Google Cloud Run | ✅ Active |
| **Figma** | `npx figma-developer-mcp` | Inspect design files (cần Figma Desktop) | ⏸️ Chưa configure |

---

## Cấu Trúc Thư Mục

```
MCP/
├── BigQuery/                 ← Docs + bigquery-mcp config
├── Fabric/                   ← Self-hosted Fabric MCP (TypeScript)
├── React-template/           ← 10 Stitch layout templates + Wecare Design System
├── azure-cost-mcp/           ← Azure Cost Management MCP (TypeScript, local dist/)
│   └── src/tools/            ← cost-get-current, cost-get-by-service, cost-get-by-resource, budget-list, budget-get-alert, invoice-list, cost-forecast
├── canvas-apps-mcp/          ← Canvas Apps MCP (TypeScript, local dist/)
│   └── src/tools/            ← app-list, app-get, app-list-by-env, app-get-connections, app-publish, app-permissions
├── dataverse-mcp/            ← Self-hosted Dataverse MCP (TypeScript, published npm)
├── figma/                    ← Figma MCP setup docs
├── gg-Cloud-run/             ← Google Cloud Run MCP (cloned repo)
├── github/                   ← GitHub MCP setup docs
├── notebooklm/               ← NotebookLM MCP setup docs
├── power-automate-mcp/       ← Power Automate MCP (TypeScript, local dist/)
│   └── src/tools/            ← flow-list, flow-get, flow-trigger, flow-get-runs, flow-get-run-detail, flow-enable, flow-disable
├── powerplatform-admin-mcp/  ← PP Admin MCP (TypeScript, local dist/)
│   └── src/tools/            ← env-list, env-get, env-create, env-list-solutions, env-get-capacity, tenant-settings, service-health, policy-list...
├── pp-license-mcp/            ← PP License & Capacity MCP (TypeScript, local dist/)
│   └── src/tools/            ← license-list, license-get-usage, license-get-pp-users, capacity-storage, capacity-api-calls, license-cost-estimate
├── stitch/                   ← Stitch MCP setup docs
└── .agent/workflows/         ← Automation workflows
```

---

## Build Commands

### Dataverse MCP (`dataverse-mcp/`)
```bash
cd dataverse-mcp
npm run build       # tsc → build/index.js
npm run dev         # tsc --watch
npm run start       # node build/index.js
npm publish         # publish lên npm (auto build via prepublishOnly)
```

### Canvas Apps MCP (`canvas-apps-mcp/`)
```bash
cd canvas-apps-mcp
npm run build       # tsup → dist/index.js
npm run dev         # tsx src/index.ts (hot reload)
npm run start       # node dist/index.js
```

### Power Automate MCP (`power-automate-mcp/`)
```bash
cd power-automate-mcp
npm run build       # tsup → dist/index.js
npm run dev         # tsx src/index.ts (hot reload)
```

### PP Admin MCP (`powerplatform-admin-mcp/`)
```bash
cd powerplatform-admin-mcp
npm run build       # tsup → dist/index.js
```

---

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

### Fabric MCP (`Fabric/`)
- [x] Lakehouse SQL queries (tedious driver)
- [x] Table exploration (list, schema, preview, search, stats)
- [x] Workspace management (list, get, items)
- [x] Semantic Model / DAX queries
- [x] Reports & Dashboards listing
- [x] Dataflow Gen2 operations (list, run, status)
- [x] Notebook & Spark (list, run, status)

### Power Platform Admin MCP (`powerplatform-admin-mcp/`)
- [x] List/Get environments (type, region, state, Dataverse URL)
- [x] Create Sandbox/Developer environments
- [x] List solutions (managed/unmanaged) trong environment
- [x] Get capacity & storage usage
- [x] Get tenant-level governance settings
- [x] Service health status

### Canvas Apps MCP (`canvas-apps-mcp/`)
- [x] List all canvas apps across tenant
- [x] Get app details
- [x] List apps by environment
- [x] Get connections/connectors used by app
- [x] Publish app (latest saved version → available to users)
- [x] Get role assignments (permissions)

### Azure Cost MCP (`azure-cost-mcp/`)
- [x] Get current month cost (daily breakdown)
- [x] Cost breakdown by service (top N)
- [x] Cost breakdown by resource (top N most expensive)
- [x] List budgets với spent % và status (OK/WARNING/EXCEEDED)
- [x] Budget alert details (threshold, contact emails, triggered?)
- [x] List invoices (PAYG/CSP — với fallback cho EA)
- [x] Cost forecast cho phần còn lại của tháng

### Power Platform License MCP (`powerplatform-license-mcp/`)
- [x] List tất cả license SKUs với consumed/enabled/available
- [x] Usage detail của 1 SKU với bar visualization
- [x] Danh sách users có Power Apps/Automate per-user license
- [x] Dataverse storage capacity per environment (DB/File/Log)
- [x] API call consumption + PAYG billing policies
- [x] Monthly cost estimate từ list price × assigned units

### Power Automate MCP (`power-automate-mcp/`)
- [x] List flows trong environment (state, trigger type)
- [x] Get flow details
- [x] Trigger flow manually (HTTP/manual trigger)
- [x] Get run history (filter by Succeeded/Failed/Running)
- [x] Get run detail (all action results, error messages)
- [x] Enable/Disable flow

---

## Authentication

Tất cả **Power Platform MCPs** (Admin, Canvas, Automate, Dataverse, License) dùng chung **Service Principal**:

| Variable | Value |
|----------|-------|
| `AZURE_TENANT_ID` | `08dd70ab-ac3b-4a33-acd1-ef3fe1729e61` |
| `AZURE_CLIENT_ID` | `6fba5a54-1729-4c41-b444-8992ae22c909` |
| `AZURE_CLIENT_SECRET` | (xem mcp_config.json) |

**Azure Cost MCP** cần thêm:
| Variable | Value |
|----------|-------|
| `AZURE_SUBSCRIPTION_ID` | Subscription ID cần theo dõi chi phí |

> ⚠️ **Cần verify**: Service Principal cần được assign **Power Platform Administrator** role trong PPAC để access Admin API + Canvas API.

---

## Dependencies

| Package | Dùng trong | Mục đích |
|---------|-----------|----------|
| `@modelcontextprotocol/sdk` | Tất cả self-hosted | MCP protocol |
| `@azure/msal-node` | Dataverse | Auth MSAL OAuth2 |
| `mssql` | Fabric | SQL connection (Lakehouse) |
| `zod` | Fabric, Canvas, Automate, PP Admin | Schema validation |
| `tsup` | PP Admin, Canvas, Automate | TypeScript bundler |
| Native `fetch` | PP Admin, Canvas, Automate | HTTP (Node.js 18+ built-in) |

---

## Known Issues

- **Figma MCP** chưa configure — cần Figma Desktop App
- `gg-Cloud-run/` là repo clone từ Google, không maintain
- 3 MCPs mới (PP Admin, Canvas, Automate) dùng local `dist/` chưa publish lên npm
- PP Admin, Canvas, Automate cần verify Service Principal có đủ quyền trong PPAC
- **Quyết định loại bỏ**: Copilot Studio MCP — không build do giới hạn licensing

---

## Roadmap

- [ ] Assign role `Cost Management Reader` cho Service Principal tại subscription level (Azure Portal)
- [ ] Verify Graph API permission `Organization.Read.All` / `Directory.Read.All` cho License MCP
- [ ] Test `azure_cost_get_current` và `pp_license_list` qua Inspector
- [ ] Publish `powerplatform-admin-mcp` lên npm
- [ ] Publish `canvas-apps-mcp` lên npm
- [ ] Publish `power-automate-mcp` lên npm
- [ ] Publish `fabric-mcp` lên npm
- [ ] Configure Figma MCP

---

## Quyết Định Thiết Kế

- **Monorepo pattern**: Tất cả MCP trong 1 workspace, dễ quản lý
- **Self-hosted vs External**: Self-host khi cần custom logic (Power Platform suite, Dataverse, Fabric)
- **stdio transport**: Tất cả self-hosted dùng stdio — không cần HTTP server
- **Azure Service Principal**: Auth pattern thống nhất cho tất cả Microsoft services
- **Native fetch (Node.js 18+)**: Không cần axios/node-fetch dependency — lighter bundle
- **Tool-per-file pattern**: Mỗi tool là 1 file riêng — dễ test, dễ maintain
- **tsup vs tsc**: PP Admin/Canvas/Automate dùng `tsup` (nhanh hơn, ESM clean) — Dataverse giữ `tsc` (ổn định, đã publish)
- **Không build Copilot Studio MCP**: Licensing limitation — API không public
