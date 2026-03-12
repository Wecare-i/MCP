# Dataverse MCP Server

> Custom MCP Server kết nối Microsoft Dataverse cho Antigravity IDE.

## Quick Start

```bash
npm install
npm run build
```

## Cấu hình

Thêm vào `mcp_config.json`:

```json
{
  "dataverse": {
    "command": "node",
    "args": ["D:/_Antigravity/MCP/dataverse-mcp/build/index.js"],
    "env": {
      "DATAVERSE_URL": "https://yourorg.crm5.dynamics.com",
      "DATAVERSE_TENANT_ID": "your-tenant-id",
      "DATAVERSE_CLIENT_ID": "your-client-id",
      "DATAVERSE_CLIENT_SECRET": "your-client-secret"
    }
  }
}
```

## Tools (17)

| Tool | Mô tả |
|------|--------|
| `list_entities` | Liệt kê tất cả tables |
| `get_entity_metadata` | Schema chi tiết 1 table |
| `get_entity_attributes` | Danh sách columns của table |
| `query_records` | Truy vấn OData ($filter, $select, $top, $orderby, $expand) |
| `create_record` | Tạo bản ghi mới |
| `update_record` | Cập nhật bản ghi |
| `delete_record` | ⚠️ Xóa bản ghi (không thể hoàn tác) |
| `get_record_by_id` | Lấy 1 record theo GUID |
| `execute_fetchxml` | Truy vấn FetchXML (aggregation, linked entities) |
| `get_relationships` | Lấy relationships (1:N, N:1, N:N) |
| `get_optionset` | Lấy Choice/OptionSet values |
| `check_dependencies` | Kiểm tra dependencies trước khi xóa |
| `delete_table` | ⚠️ Xóa custom table (auto-resolve dependencies) |
| `delete_attribute` | ⚠️ Xóa column (auto-resolve dependencies) |
| `analyze_table_quality` | Phân tích chất lượng dữ liệu (null rate, suspect columns) |
| `execute_action` | Gọi Dataverse Actions (Bound/Unbound) |
| `publish_customizations` | Publish tất cả customizations |

## Auth

OAuth 2.0 Client Credentials qua `@azure/msal-node`. Cần App Registration trên Azure AD + Application User trong Dataverse.

## Security

- `delete_record` bị **loại bỏ** có chủ đích
- `.env` đã gitignored
