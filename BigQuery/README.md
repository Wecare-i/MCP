# @wcg-hieule/bigquery-mcp

> **MCP Server for Google BigQuery** — Query, analyze, and forecast data in BigQuery directly from your AI agent.

[![npm version](https://img.shields.io/npm/v/@wcg-hieule/bigquery-mcp.svg)](https://www.npmjs.com/package/@wcg-hieule/bigquery-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@wcg-hieule/bigquery-mcp.svg)](https://www.npmjs.com/package/@wcg-hieule/bigquery-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

---

## Quick Start

```bash
# 1. Authenticate with GCP
gcloud auth application-default login

# 2. Add to mcp_config.json and run via npx
```

Add to your `mcp_config.json`:

```json
{
  "mcpServers": {
    "bigquery": {
      "command": "npx",
      "args": ["-y", "@wcg-hieule/bigquery-mcp"],
      "env": {
        "BIGQUERY_PROJECT": "your-gcp-project-id",
        "BIGQUERY_LOCATION": "asia-southeast1"
      }
    }
  }
}
```

---

## Authentication

Supports two methods:

**Option A — Application Default Credentials (recommended)**
```bash
gcloud auth application-default login
```

**Option B — Service Account Key**
```json
{
  "env": {
    "GOOGLE_APPLICATION_CREDENTIALS": "C:/path/to/service-account-key.json"
  }
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `BIGQUERY_PROJECT` | ✅ | — | GCP Project ID |
| `BIGQUERY_LOCATION` | ❌ | `US` | BigQuery dataset location |
| `GOOGLE_APPLICATION_CREDENTIALS` | ❌ | ADC | Path to service account key file |

---

## Tools (9)

### 🔍 Exploration

| Tool | Description |
|------|-------------|
| `list_dataset_ids` | List all datasets in the project |
| `list_table_ids` | List tables in a specific dataset |
| `get_dataset_info` | Get metadata of a dataset |
| `get_table_info` | Get schema + metadata of a table |
| `search_catalog` | Search tables/datasets/views by keyword |

### ⚡ Query & Analysis

| Tool | Description |
|------|-------------|
| `execute_sql` | Run a SQL query and return results |
| `ask_data_insights` | Ask a natural language question → get SQL + insights |
| `forecast` | Time series forecasting using BigQuery ML ARIMA_PLUS |
| `analyze_contribution` | Key driver / contribution analysis across dimensions |

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
