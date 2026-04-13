# @wcg-hieule/dataverse-mcp

> **MCP Server for Microsoft Dataverse** — Give your AI agent full CRUD access to Dataverse tables, FetchXML queries, schema exploration, and data quality analysis.

[![npm version](https://img.shields.io/npm/v/@wcg-hieule/dataverse-mcp.svg)](https://www.npmjs.com/package/@wcg-hieule/dataverse-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@wcg-hieule/dataverse-mcp.svg)](https://www.npmjs.com/package/@wcg-hieule/dataverse-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

---

## Quick Start

```bash
npx -y @wcg-hieule/dataverse-mcp
```

Add to your `mcp_config.json`:

```json
{
  "mcpServers": {
    "dataverse": {
      "command": "npx",
      "args": ["-y", "@wcg-hieule/dataverse-mcp"],
      "env": {
        "DATAVERSE_URL": "https://yourorg.crm5.dynamics.com",
        "DATAVERSE_TENANT_ID": "your-tenant-id",
        "DATAVERSE_CLIENT_ID": "your-client-id",
        "DATAVERSE_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

---

## Authentication

Uses **OAuth 2.0 Client Credentials** via `@azure/msal-node`.

**Prerequisites:**
1. Create an **App Registration** in Azure AD
2. Grant it **Application User** access in Dataverse with appropriate security role
3. Copy Tenant ID, Client ID, and generate a Client Secret

---

## Environment Variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| `DATAVERSE_URL` | ✅ | Your Dataverse org URL (e.g. `https://org.crm5.dynamics.com`) |
| `DATAVERSE_TENANT_ID` | ✅ | Azure AD Tenant ID |
| `DATAVERSE_CLIENT_ID` | ✅ | App Registration Client ID |
| `DATAVERSE_CLIENT_SECRET` | ✅ | App Registration Client Secret |

---

## Tools (18)

### 📋 Schema & Discovery

| Tool | Description |
|------|-------------|
| `list_entities` | List all tables in Dataverse |
| `get_entity_metadata` | Get detailed schema of a table |
| `get_entity_attributes` | List all columns of a table |
| `get_relationships` | Explore relationships (1:N, N:1, N:N) |
| `get_optionset` | Get Choice/OptionSet values |

### 🔍 Querying

| Tool | Description |
|------|-------------|
| `query_records` | OData query with `$filter`, `$select`, `$top`, `$orderby`, `$expand` |
| `get_record_by_id` | Fetch a single record by GUID |
| `execute_fetchxml` | FetchXML queries — aggregation, linked entities, groupby |

### ✏️ CRUD Operations

| Tool | Description |
|------|-------------|
| `create_record` | Create a new record |
| `update_record` | Update an existing record |
| `delete_record` | ⚠️ Delete a record (irreversible) |

### 🏗️ Schema Management

| Tool | Description |
|------|-------------|
| `create_table` | Create a custom table (entity) with primary column |
| `create_attribute` | Create a column (String, Memo, Integer, Decimal, Money, Boolean, DateTime, Lookup, Picklist) |

### 🛠️ Administration

| Tool | Description |
|------|-------------|
| `check_dependencies` | Check dependencies before deleting |
| `delete_table` | ⚠️ Delete a custom table (auto-resolves dependencies) |
| `delete_attribute` | ⚠️ Delete a column (auto-resolves dependencies) |
| `publish_customizations` | Publish all pending customizations |

### 📊 Analysis

| Tool | Description |
|------|-------------|
| `analyze_table_quality` | Data quality analysis (null rate, suspect columns) |
| `execute_action` | Call Dataverse Actions (Bound or Unbound) |

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
