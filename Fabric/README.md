# Fabric Lakehouse MCP Server

MCP server cho phép AI (Claude, Gemini, VS Code Copilot...) kết nối và tương tác với **Microsoft Fabric** — bao gồm Lakehouse SQL, Workspace Management, Semantic Models, Reports & Dashboards, Dataflow Gen2, và Notebooks.

## ✨ Tính năng

### 📊 Lakehouse SQL (Data Exploration)

| Tool | Mô tả |
|------|--------|
| `fabric_list_tables` | Liệt kê tất cả tables/views |
| `fabric_get_table_schema` | Xem cấu trúc columns của table |
| `fabric_preview_table` | Preview dữ liệu mẫu (TOP N) |
| `fabric_search_tables` | Tìm kiếm tables theo tên |
| `fabric_execute_query` | Thực thi SQL SELECT/WITH (read-only) |
| `fabric_get_row_count` | Đếm số rows |
| `fabric_get_column_stats` | Thống kê cột (min, max, null, distinct) |
| `fabric_get_table_summary` | Tổng quan table (schema + count + sample) |

### 🏢 Workspace Management

| Tool | Mô tả |
|------|--------|
| `workspace_list` | Liệt kê tất cả workspaces mà Service Principal có quyền truy cập |
| `workspace_get` | Lấy thông tin chi tiết một workspace |
| `workspace_list_items` | Liệt kê items trong workspace (Lakehouse, Notebook, Report...), lọc theo type |

### 🧠 Semantic Model (Power BI Datasets)

| Tool | Mô tả |
|------|--------|
| `semantic_list_models` | Liệt kê tất cả Semantic Models trong workspace |
| `semantic_get_model` | Lấy thông tin chi tiết một Semantic Model |
| `semantic_execute_dax` | Thực thi câu lệnh DAX query trên Semantic Model |

### � Reports & Dashboards

| Tool | Mô tả |
|------|--------|
| `reports_list` | Liệt kê tất cả Reports trong workspace |
| `reports_get` | Lấy thông tin chi tiết một Report (tên, URL embed, dataset ID...) |
| `reports_get_pages` | Liệt kê tất cả pages trong một Report |
| `dashboards_list` | Liệt kê tất cả Dashboards trong workspace |
| `dashboards_get_tiles` | Liệt kê tất cả tiles (visual elements) trong một Dashboard |

### 🔄 Dataflow Gen2

| Tool | Mô tả |
|------|--------|
| `dataflow_list` | Liệt kê tất cả Dataflow Gen2 trong workspace |
| `dataflow_get` | Lấy thông tin chi tiết một Dataflow Gen2 |
| `dataflow_run` | Kích hoạt chạy (trigger refresh) một Dataflow Gen2 ⚠️ |
| `dataflow_get_status` | Xem trạng thái chạy (job instances) của Dataflow |

### 📓 Notebooks & Spark

| Tool | Mô tả |
|------|--------|
| `notebook_list` | Liệt kê tất cả Notebooks trong workspace |
| `notebook_get` | Lấy thông tin chi tiết một Notebook |
| `notebook_run` | Kích hoạt chạy Notebook trên Spark (hỗ trợ parameters) ⚠️ |
| `notebook_get_status` | Xem trạng thái chạy (job instances) của Notebook |

> **⚠️ Lưu ý:** Các tool `dataflow_run` và `notebook_run` sẽ thực sự kích hoạt chạy trên Fabric capacity — hãy cẩn thận khi sử dụng.

## �🚀 Cài đặt

### 1. Yêu cầu
- Node.js >= 18
- Microsoft Fabric Lakehouse với SQL Endpoint
- Azure Service Principal (Client ID + Secret)

### 2. Install & Build

```bash
npm install
npm run build
```

### 3. Cấu hình

Copy `.env.example` → `.env` và điền thông tin:

```env
# Lakehouse SQL connection
FABRIC_SQL_ENDPOINT=your-endpoint.datawarehouse.fabric.microsoft.com
FABRIC_DATABASE=your-lakehouse-name

# Azure Service Principal
FABRIC_TENANT_ID=your-tenant-id
FABRIC_CLIENT_ID=your-client-id
FABRIC_CLIENT_SECRET=your-client-secret

# (Optional) Default Workspace ID cho REST API tools
FABRIC_WORKSPACE_ID=your-workspace-id
```

### 4. Chạy thử

```bash
npm start
```

## 🔌 Tích hợp MCP Client

### Claude Desktop

Thêm vào `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "fabric-lakehouse": {
      "command": "node",
      "args": ["e:/MCP Fabric/dist/index.js"],
      "env": {
        "FABRIC_SQL_ENDPOINT": "your-endpoint.datawarehouse.fabric.microsoft.com",
        "FABRIC_DATABASE": "Bronze",
        "FABRIC_TENANT_ID": "your-tenant-id",
        "FABRIC_CLIENT_ID": "your-client-id",
        "FABRIC_CLIENT_SECRET": "your-client-secret",
        "FABRIC_WORKSPACE_ID": "your-workspace-id"
      }
    }
  }
}
```

### VS Code (Copilot)

Thêm vào `.vscode/settings.json`:

```json
{
  "mcp": {
    "servers": {
      "fabric-lakehouse": {
        "command": "node",
        "args": ["e:/MCP Fabric/dist/index.js"],
        "env": {
          "FABRIC_SQL_ENDPOINT": "your-endpoint.datawarehouse.fabric.microsoft.com",
          "FABRIC_DATABASE": "Bronze",
          "FABRIC_TENANT_ID": "your-tenant-id",
          "FABRIC_CLIENT_ID": "your-client-id",
          "FABRIC_CLIENT_SECRET": "your-client-secret",
          "FABRIC_WORKSPACE_ID": "your-workspace-id"
        }
      }
    }
  }
}
```

### Gemini CLI

Thêm vào `settings.json`:

```json
{
  "mcpServers": {
    "fabric-lakehouse": {
      "command": "node",
      "args": ["e:/MCP Fabric/dist/index.js"],
      "env": {
        "FABRIC_SQL_ENDPOINT": "your-endpoint.datawarehouse.fabric.microsoft.com",
        "FABRIC_DATABASE": "Bronze",
        "FABRIC_TENANT_ID": "your-tenant-id",
        "FABRIC_CLIENT_ID": "your-client-id",
        "FABRIC_CLIENT_SECRET": "your-client-secret",
        "FABRIC_WORKSPACE_ID": "your-workspace-id"
      }
    }
  }
}
```

## 🧪 Debug với MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## 📁 Cấu trúc Project

```
src/
├── index.ts                    # Entry point + resources
├── types.ts                    # TypeScript interfaces
├── constants.ts                # Constants & limits
├── services/
│   ├── fabricClient.ts         # SQL connection + auth (Lakehouse)
│   ├── fabricRestClient.ts     # Fabric REST API client (Workspace, Dataflow, Notebook)
│   └── powerbiClient.ts        # Power BI REST API client (Semantic, Reports, Dashboards)
├── tools/
│   ├── tableTools.ts           # Table exploration tools
│   ├── queryTools.ts           # SQL query tools
│   ├── analysisTools.ts        # Data analysis tools
│   ├── workspaceTools.ts       # Workspace management tools
│   ├── semanticTools.ts        # Semantic model tools
│   ├── reportTools.ts          # Reports & dashboards tools
│   ├── dataflowTools.ts        # Dataflow Gen2 tools
│   └── notebookTools.ts        # Notebook & Spark tools
└── schemas/
    ├── tableSchemas.ts         # Zod schemas for table tools
    ├── querySchemas.ts         # Zod schemas for query tools
    ├── analysisSchemas.ts      # Zod schemas for analysis tools
    ├── workspaceSchemas.ts     # Zod schemas for workspace tools
    ├── semanticSchemas.ts      # Zod schemas for semantic tools
    ├── reportSchemas.ts        # Zod schemas for report tools
    ├── dataflowSchemas.ts      # Zod schemas for dataflow tools
    └── notebookSchemas.ts      # Zod schemas for notebook tools
```

## 🏗️ Kiến trúc API

Server sử dụng **3 client** để kết nối với các dịch vụ khác nhau:

| Client | API Base URL | Chức năng |
|--------|-------------|-----------|
| `FabricClient` | SQL Endpoint | Truy vấn SQL trên Lakehouse |
| `FabricRestClient` | `api.fabric.microsoft.com/v1` | Workspace, Dataflow, Notebook |
| `PowerBIClient` | `api.powerbi.com/v1.0/myorg` | Semantic Model, Reports, Dashboards |

Tất cả đều sử dụng **Azure Service Principal** (OAuth2 Client Credentials) để xác thực.
