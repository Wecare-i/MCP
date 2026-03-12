# @wcg-hieule/bigquery-mcp

> BigQuery MCP Server — Query và phân tích dữ liệu Google BigQuery trực tiếp từ AI agent.

## Quick Start

Thêm vào `mcp_config.json`:

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

## Authentication

```bash
# Option A — Application Default Credentials (khuyến nghị)
gcloud auth application-default login

# Option B — Service Account
# Set env: GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\key.json
```

## Tools

| Tool | Description |
|------|-------------|
| `execute_sql` | Chạy SQL query |
| `list_dataset_ids` | Liệt kê tất cả datasets |
| `list_table_ids` | Liệt kê tables trong dataset |
| `get_dataset_info` | Metadata của dataset |
| `get_table_info` | Schema + metadata của table |
| `search_catalog` | Tìm table/dataset theo keyword |
| `ask_data_insights` | Phân tích dữ liệu theo câu hỏi |
| `forecast` | Dự báo time series (ARIMA_PLUS) |
| `analyze_contribution` | Key driver / contribution analysis |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BIGQUERY_PROJECT` | ✅ | — | GCP Project ID |
| `BIGQUERY_LOCATION` | ❌ | `US` | BigQuery location |
| `GOOGLE_APPLICATION_CREDENTIALS` | ❌ | ADC | Service account key path |

## License

MIT
