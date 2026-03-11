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

## Tools (11)

| Tool | Mô tả |
|------|--------|
| `list_entities` | Liệt kê tất cả tables |
| `get_entity_metadata` | Schema chi tiết 1 table |
| `get_entity_attributes` | Danh sách columns của table |
| `query_records` | Truy vấn OData ($filter, $select, $top, $orderby, $expand) |
| `create_record` | Tạo bản ghi mới |
| `update_record` | Cập nhật bản ghi |
| `get_record_by_id` | Lấy 1 record theo GUID |
| `execute_fetchxml` | Truy vấn FetchXML |
| `get_relationships` | Lấy relationships (1:N, N:1, N:N) |
| `get_optionset` | Lấy Choice/OptionSet values |
| `delete_table` | ⚠️ Xóa custom table (kiểm tra dependencies trước) |

## Auth

OAuth 2.0 Client Credentials qua `@azure/msal-node`. Cần App Registration trên Azure AD + Application User trong Dataverse.

## Security

- `delete_record` bị **loại bỏ** có chủ đích
- `.env` đã gitignored
