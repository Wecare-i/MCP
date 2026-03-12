# BigQuery MCP

MCP server kết nối Google BigQuery cho phân tích dữ liệu trực tiếp từ AI tools.

## Tech Stack

- **Runtime**: Node.js >= 18
- **Package**: `@toolbox-sdk/server` (external, npx)
- **Auth**: Google ADC (Application Default Credentials)
- **Transport**: stdio
- **Loại**: External MCP — không cần build

## Requirements

### Functional
- Query SQL trên BigQuery datasets
- Khám phá datasets, tables, schema
- Phân tích dữ liệu AI-powered (ask_data_insights)
- Forecast time series
- Analyze metric contribution

### Non-functional
- Sử dụng prebuilt BigQuery package — zero custom code
- Auth qua Google ADC hoặc Service Account key

### Constraints
- Cần Google Cloud Project có BigQuery enabled
- Location: `asia-southeast1` (Singapore)

## Features

- [x] Execute SQL queries
- [x] List datasets & tables
- [x] Get table schema/info
- [x] Search catalog (tables, views, models)
- [x] AI data insights (ask_data_insights)
- [x] Time series forecast
- [x] Metric contribution analysis
- [ ] Custom BigQuery package `@wecare-i/mcp-bigquery` (planned)

## Dependencies / Tích hợp

- **Google Cloud BigQuery** — data warehouse
- **Google ADC** — authentication
- **@toolbox-sdk/server** — MCP server wrapper

## Known Issues

- `mcp-bigquery-pkg` chưa publish lên npm — chỉ có local trong `BigQuery/` folder
- Package `@toolbox-sdk/server` là external, không customize được tools

## Roadmap

1. Publish `@wecare-i/mcp-bigquery` lên npm
2. Custom tools nếu cần (vượt khả năng prebuilt)

## Quyết định thiết kế

- **Dùng prebuilt** thay vì tự viết: BigQuery Toolbox SDK đã cover 100% use cases hiện tại
- **ADC auth**: đơn giản, không cần manage service account keys thủ công
- **Project ID hardcode** trong config: chỉ có 1 GCP project duy nhất
