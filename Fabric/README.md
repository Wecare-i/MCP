# @wcg-hieule/fabric-mcp

> **MCP Server for Microsoft Fabric** — Connect your AI agent to Fabric Lakehouse SQL, Workspace Management, Semantic Models, Reports, Dataflow Gen2, Notebooks, Pipelines, and CI/CD Deployment.

[![npm version](https://img.shields.io/npm/v/@wcg-hieule/fabric-mcp.svg)](https://www.npmjs.com/package/@wcg-hieule/fabric-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@wcg-hieule/fabric-mcp.svg)](https://www.npmjs.com/package/@wcg-hieule/fabric-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

---

## Quick Start

Add to your `mcp_config.json`:

```json
{
  "mcpServers": {
    "fabric": {
      "command": "npx",
      "args": ["-y", "@wcg-hieule/fabric-mcp"],
      "env": {
        "FABRIC_SQL_ENDPOINT": "your-endpoint.datawarehouse.fabric.microsoft.com",
        "FABRIC_DATABASE": "your-lakehouse-name",
        "FABRIC_TENANT_ID": "your-tenant-id",
        "FABRIC_CLIENT_ID": "your-client-id",
        "FABRIC_CLIENT_SECRET": "your-client-secret",
        "FABRIC_WORKSPACE_ID": "your-workspace-id"
      }
    }
  }
}
```

---

## Authentication

Uses **Azure Service Principal** (OAuth 2.0 Client Credentials) for all API access.

**Prerequisites:**
1. Register an App in **Azure AD** and generate a Client Secret
2. Grant the Service Principal **Contributor** role on the Fabric Workspace
3. Copy Tenant ID, Client ID, Client Secret, and Workspace ID

---

## Environment Variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| `FABRIC_SQL_ENDPOINT` | ✅ | Lakehouse SQL Endpoint hostname |
| `FABRIC_DATABASE` | ✅ | Lakehouse database name |
| `FABRIC_TENANT_ID` | ✅ | Azure AD Tenant ID |
| `FABRIC_CLIENT_ID` | ✅ | App Registration Client ID |
| `FABRIC_CLIENT_SECRET` | ✅ | App Registration Client Secret |
| `FABRIC_WORKSPACE_ID` | ❌ | Default Workspace ID for REST API tools |

---

## Tools (32)

### 📊 Lakehouse SQL

| Tool | Description |
|------|-------------|
| `fabric_list_tables` | List all tables and views |
| `fabric_get_table_schema` | Get column structure of a table |
| `fabric_preview_table` | Preview sample data (TOP N) |
| `fabric_search_tables` | Search tables by name |
| `fabric_execute_query` | Execute SQL SELECT/WITH (read-only) |
| `fabric_get_row_count` | Count rows in a table |
| `fabric_get_column_stats` | Column statistics (min, max, null, distinct) |
| `fabric_get_table_summary` | Full table overview (schema + count + sample) |

### 🏢 Workspace Management

| Tool | Description |
|------|-------------|
| `workspace_list` | List all accessible workspaces |
| `workspace_get` | Get workspace details |
| `workspace_list_items` | List items in workspace (filter by type) |

### 🧠 Semantic Model (Power BI)

| Tool | Description |
|------|-------------|
| `semantic_list_models` | List all Semantic Models in workspace |
| `semantic_get_model` | Get Semantic Model details |
| `semantic_execute_dax` | Execute a DAX query |

### 📈 Reports & Dashboards

| Tool | Description |
|------|-------------|
| `reports_list` | List all Reports |
| `reports_get` | Get report details (URL, dataset ID) |
| `reports_get_pages` | List all pages in a Report |
| `dashboards_list` | List all Dashboards |
| `dashboards_get_tiles` | List all tiles in a Dashboard |

### 🔄 Dataflow Gen2

| Tool | Description |
|------|-------------|
| `dataflow_list` | List all Dataflow Gen2 in workspace |
| `dataflow_get` | Get Dataflow details |
| `dataflow_run` | ⚠️ Trigger a Dataflow refresh |
| `dataflow_get_status` | Check Dataflow run status |

### 📓 Notebooks & Spark

| Tool | Description |
|------|-------------|
| `notebook_list` | List all Notebooks |
| `notebook_get` | Get Notebook details |
| `notebook_run` | ⚠️ Trigger Notebook run on Spark (supports parameters) |
| `notebook_get_status` | Check Notebook run status |

### 🚇 Data Pipeline

| Tool | Description |
|------|-------------|
| `pipeline_list` | List all Data Pipelines |
| `pipeline_get` | Get Pipeline details |
| `pipeline_run` | ⚠️ Trigger a Pipeline run |
| `pipeline_get_status` | Check Pipeline run status |

### 🚀 CI/CD Deployment

| Tool | Description |
|------|-------------|
| `cicd_list_pipelines` | List all Deployment Pipelines |
| `cicd_get_pipeline` | Get Deployment Pipeline details |
| `cicd_get_stages` | List stages (Dev/Test/Prod) and their items |
| `cicd_deploy` | ⚠️ Deploy (promote) items between stages |

> **⚠️ Note:** Tools marked with ⚠️ trigger real operations on Fabric — use with caution.

---

## Architecture

The server uses **3 API clients** internally:

| Client | API | Covers |
|--------|-----|--------|
| `FabricClient` | SQL Endpoint | Lakehouse SQL queries |
| `FabricRestClient` | `api.fabric.microsoft.com/v1` | Workspace, Dataflow, Notebook, Pipeline, CI/CD |
| `PowerBIClient` | `api.powerbi.com/v1.0/myorg` | Semantic Models, Reports, Dashboards |

---

## Compatibility

Works with any MCP-compatible AI client:

- ✅ Gemini CLI / Antigravity IDE
- ✅ Claude Desktop
- ✅ VS Code Copilot
- ✅ Cursor

---

## License

MIT © [wcg-hieule](https://www.npmjs.com/~wcg-hieule)
