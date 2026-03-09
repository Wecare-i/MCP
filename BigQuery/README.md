# BigQuery MCP — Hướng Dẫn Cài Đặt

> Query và phân tích dữ liệu Google BigQuery trực tiếp từ Antigravity.

## Yêu Cầu

- ✅ Google Cloud Project có BigQuery enabled
- ✅ Node.js 18+
- ✅ Service Account **hoặc** Application Default Credentials (ADC)

## Cài Đặt

### Bước 1 — Cấu hình Authentication

**Option A — Application Default Credentials (khuyến nghị cho local dev):**
```bash
gcloud auth application-default login
```

**Option B — Service Account Key:**
1. Vào [GCP Console → IAM → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Tạo Service Account → Grant role **BigQuery Data Viewer** + **BigQuery Job User**
3. Tạo JSON key → Download
4. Set env var: `GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\key.json`

### Bước 2 — Cấu hình mcp_config.json

```json
"bigquery": {
  "command": "npx",
  "args": ["-y", "@toolbox-sdk/server@latest", "--prebuilt", "bigquery", "--stdio"],
  "env": {
    "BIGQUERY_PROJECT": "project-2025-449801",
    "BIGQUERY_LOCATION": "asia-southeast1"
  }
}
```

### Bước 3 — Verify

Restart MCP → Test: `list_dataset_ids` để xem danh sách datasets.

## Project Hiện Tại

| Key | Value |
|-----|-------|
| Project ID | `project-2025-449801` |
| Location | `asia-southeast1` (Singapore) |

## Tools Có Sẵn

| Tool | Mô tả |
|------|--------|
| `execute_sql` | Chạy SQL query |
| `list_dataset_ids` | Liệt kê datasets |
| `list_table_ids` | Liệt kê tables |
| `get_table_info` | Lấy schema table |
| `search_catalog` | Tìm tables, views, models |
| `ask_data_insights` | Phân tích AI |
| `forecast` | Dự báo time series |
| `analyze_contribution` | Phân tích metric contribution |

## Resources

- [BigQuery Toolbox SDK](https://github.com/googleapis/mcp-toolbox-for-databases)
- [BigQuery Console](https://console.cloud.google.com/bigquery)
- [gcloud CLI](https://cloud.google.com/sdk/docs/install)
