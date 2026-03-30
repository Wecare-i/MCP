# MCP Workspace — Wecare-i

> Monorepo quản lý tất cả MCP (Model Context Protocol) servers phục vụ hệ sinh thái AI-assisted development của Wecare.

**Last Updated**: 2026-03-30

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

| MCP | Local Path | Tools | Active |
|-----|-----------|:-----:|:------:|
| **Dataverse** | `dataverse-mcp/build/index.js` | 17 | ✅ |
| **Enterprise Admin** | `enterprise-admin-mcp/dist/index.js` | 23 | ⏸️ |
| **NotebookLM** | `notebooklm/dist/index.js` | 14 | ⏸️ |
| **BigQuery** | `BigQuery/dist/index.js` | 9 | ⏸️ |
| ~~**Fabric**~~ | `Fabric/dist/index.js` | 44 | ❌ Unconfigured |
| ~~**Cloud Run**~~ | ~~`gg-Cloud-run/mcp-server.js`~~ | ~~8~~ | ❌ Đã bỏ |

> ⚠️ **Tool limit**: Antigravity giới hạn **100 tools active**. Bật tất cả sẽ vượt (~120+). Chỉ bật MCP cần thiết theo task.

### 🔁 Converted to Skill (không dùng MCP nữa)

| MCP cũ | Skill thay thế | Lý do |
|--------|---------------|-------|
| `canvas-apps-mcp/` | `canvas-apps` skill | Dùng CLI/API trực tiếp |
| `power-automate-mcp/` | `power-automate` skill | Dùng CLI/API trực tiếp |

### 🌐 External (chỉ cần config)

| MCP | Cách kết nối | Mô tả | Status |
|-----|-------------|--------|--------|
| **Stitch** | HTTPS (`stitch.googleapis.com`) | Generate UI screens từ text prompt | ✅ Active |
| **GitHub** | `npx @modelcontextprotocol/server-github` | Repos, PRs, push files | ✅ Active |
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
- [x] **Create attribute/column** — String, Integer, Decimal, Money, Boolean, DateTime, Lookup, Picklist *(mới 2026-03-30)*
- [-] ~~Execute Dataverse Actions~~ — đã bỏ (ít dùng, tiết kiệm slot)

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

- PP Admin, Canvas, Automate cần verify Service Principal có đủ quyền trong PPAC
- **Quyết định gộp & loại bỏ**: Gộp Azure Cost, PP License, PP Admin thành `enterprise-admin-mcp` (dùng chung Auth). Loại bỏ Cloud Run, Canvas Apps & Power Automate MCP (đã chuyển sang Skill)
- **Tool limit 100**: Bật hết tất cả MCP sẽ vượt ~120 tools. Fabric (44 tools) đã bị gỡ tạm khỏi `mcp_config.json` để tránh crash limit.
- **Fabric 44 tools**: Codebase vẫn giữ nguyên, chờ review trim xuống ~10 tools để add lại vào config.
- **React-template**: Tạm giữ, chờ review đóng gói thành skill
- **Figma MCP** (*2026-03-30*): Đã xóa source clone (chiếm 130MB & lồng .git). Chỉ giữ lại docs cho đúng định dạng external package.

---

## Roadmap

- [ ] Assign role `Cost Management Reader` cho Service Principal tại subscription level (Azure Portal)
- [ ] Verify Graph API permission `Organization.Read.All` / `Directory.Read.All` cho License MCP
- [ ] Test `azure_cost_get_current` và `pp_license_list` qua Inspector
- [ ] **Trim Fabric MCP** từ 44 → ~10 tools hay dùng nhất (ưu tiên cao — tool budget)
- [ ] Configure Figma MCP
- [ ] Request Antigravity team support `includeTools`/`excludeTools` per-tool filtering

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
- **All local, no npm globals** *(2026-03-30)*: Tất cả MCP chạy từ local source
- **Xóa rác codebase** *(2026-03-30)*: Đã xóa vĩnh viễn `gg-Cloud-run/` (vấn đề security), `canvas-apps-mcp/` & `power-automate-mcp/` (chuyển qua dạng workflow scripts/skills) và các file dữ liệu/shell dư thừa khỏi source code.
