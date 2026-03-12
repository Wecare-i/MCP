# Google Cloud Run MCP

MCP server cho phép AI agents deploy apps lên Google Cloud Run.

## Tech Stack

- **Package**: `@google-cloud/cloud-run-mcp` (npm, npx)
- **Source**: Cloned từ [GoogleCloudPlatform/cloud-run-mcp](https://github.com/GoogleCloudPlatform/cloud-run-mcp)
- **Version**: v1.10.0
- **Auth**: Google ADC (Application Default Credentials)
- **Transport**: stdio (local) / SSE (remote)
- **Loại**: External MCP — clone repo cho reference

## Requirements

### Functional
- Deploy file contents / local folder lên Cloud Run
- List & get Cloud Run services
- Get service logs
- List/create GCP projects

### Constraints
- Cần Google Cloud SDK + ADC login
- `deploy-local-folder`, `list-projects`, `create-project` chỉ available khi chạy locally

## Features

- [x] Deploy file contents to Cloud Run
- [x] Deploy local folder to Cloud Run
- [x] List Cloud Run services
- [x] Get service details
- [x] Get service logs
- [x] List GCP projects
- [x] Create GCP project

## Dependencies / Tích hợp

- **Google Cloud Run** — deployment target
- **Google Cloud SDK** — authentication
- **gcloud CLI** — ADC login

## Known Issues

- Repo clone từ Google, có 2 TODOs nội bộ (không ảnh hưởng functionality)
- Folder tên `gg-Cloud-run` — khác với tên chuẩn `cloudrun` trong docs

## Roadmap

- Không có customize plan — sử dụng as-is từ upstream

## Quyết định thiết kế

- **Clone repo** thay vì chỉ npx: Giữ local reference, dễ debug khi deploy gặp lỗi
- **Dùng prebuilt**: Google official package, không cần customize
