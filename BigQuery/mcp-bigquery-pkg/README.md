# @wecare-i/mcp-bigquery

> Wecare BigQuery MCP Server — Kết nối AI agent với Google BigQuery.

## Cài đặt cho Team

Thêm vào `mcp_config.json` (không cần clone repo, không cần cài đặt gì thêm):

```json
{
  "mcpServers": {
    "bigquery": {
      "command": "npx",
      "args": ["-y", "@wecare-i/mcp-bigquery@latest", "--stdio"],
      "env": {
        "BIGQUERY_PROJECT": "your-gcp-project-id",
        "BIGQUERY_LOCATION": "asia-southeast1"
      }
    }
  }
}
```

## Authentication

Chạy lần đầu để xác thực với Google Cloud:

```bash
gcloud auth application-default login
```

Hoặc dùng Service Account:
```
GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\key.json
```

## Tools

| Tool | Mô tả |
|------|--------|
| `execute_sql` | Chạy SQL query |
| `list_dataset_ids` | Liệt kê tất cả datasets |
| `list_table_ids` | Liệt kê tables trong dataset |
| `get_dataset_info` | Metadata của dataset |
| `get_table_info` | Schema + metadata của table |
| `search_catalog` | Tìm table/dataset theo keyword |
| `ask_data_insights` | AI phân tích dữ liệu |
| `forecast` | Dự báo time series (ARIMA_PLUS) |
| `analyze_contribution` | Key driver / contribution analysis |

## Env Variables

| Variable | Required | Default | Mô tả |
|----------|----------|---------|-------|
| `BIGQUERY_PROJECT` | ✅ | — | GCP Project ID |
| `BIGQUERY_LOCATION` | ❌ | `US` | BigQuery location |
| `GOOGLE_APPLICATION_CREDENTIALS` | ❌ | ADC | Path to service account key |

## Wecare Config

```json
"env": {
  "BIGQUERY_PROJECT": "project-2025-449801",
  "BIGQUERY_LOCATION": "asia-southeast1"
}
```

## Links

- [npm](https://www.npmjs.com/package/@wecare-i/mcp-bigquery)
- [GitHub](https://github.com/Wecare-i/-R-D---MCP-Bigquery)
- [BigQuery Console](https://console.cloud.google.com/bigquery)
