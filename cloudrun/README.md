# Cloud Run MCP — Hướng Dẫn Cài Đặt

> Deploy và quản lý Google Cloud Run services trực tiếp từ Antigravity.

## Yêu Cầu

- ✅ Google Cloud Project có Cloud Run enabled
- ✅ Node.js 18+
- ✅ `gcloud` CLI đã cài và đã login
- ✅ Quyền: `roles/run.admin` hoặc `roles/editor` trên project

## Cài Đặt

### Bước 1 — Cài gcloud CLI

Tải tại: https://cloud.google.com/sdk/docs/install

```bash
# Sau khi cài xong
gcloud init
gcloud auth application-default login
```

### Bước 2 — Enable APIs trên GCP

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### Bước 3 — Cấu hình mcp_config.json

```json
"cloudrun": {
  "command": "npx",
  "args": ["-y", "@google-cloud/cloud-run-mcp"],
  "env": {}
}
```

> **Lưu ý:** Không cần env vì dùng ADC (`gcloud auth application-default login`).

### Bước 4 — Verify

Restart MCP → Test: `list_projects` để xem danh sách GCP projects.

## GCP Projects Đang Dùng

| Project | ID |
|---------|-----|
| Main | `project-2025-449801` |

## Tools Có Sẵn

| Tool | Mô tả |
|------|--------|
| `list_projects` | Liệt kê GCP projects |
| `create_project` | Tạo GCP project mới |
| `list_services` | Liệt kê Cloud Run services |
| `get_service` | Chi tiết service + URL |
| `get_service_log` | Xem logs & lỗi runtime |
| `deploy_file_contents` | Deploy từ file contents (tự build) |
| `deploy_local_folder` | Deploy từ folder local |
| `deploy_container_image` | Deploy từ container image URL |

## Workflow Deploy Thường Dùng

```
1. list_projects          → Xác nhận project ID
2. deploy_file_contents   → Upload code → tự build & deploy
3. get_service            → Lấy URL service public
4. get_service_log        → Debug nếu có lỗi
```

## Resources

- [Cloud Run MCP GitHub](https://github.com/GoogleCloudPlatform/cloud-run-mcp)
- [Cloud Run Console](https://console.cloud.google.com/run)
- [gcloud CLI Install](https://cloud.google.com/sdk/docs/install)
