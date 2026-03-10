# @wecare-team/dataverse-mcp

> MCP Server kết nối Microsoft Dataverse cho Claude/Antigravity IDE.
> Cung cấp 17 tools để tương tác với Microsoft Dataverse.

## Cài đặt nhanh (không cần clone repo)

Thêm vào `mcp_config.json` của Claude/Antigravity:

```json
{
  "dataverse": {
    "command": "npx",
    "args": ["-y", "@wecare-team/dataverse-mcp"],
    "env": {
      "DATAVERSE_URL": "https://yourorg.crm5.dynamics.com",
      "DATAVERSE_TENANT_ID": "your-tenant-id",
      "DATAVERSE_CLIENT_ID": "your-client-id",
      "DATAVERSE_CLIENT_SECRET": "your-client-secret"
    }
  }
}
```

> `-y` tự động download và chạy — không cần cài trước.

## Environment Variables

| Biến | Mô tả |
|------|-------|
| `DATAVERSE_URL` | URL org Dataverse, VD: `https://yourorg.crm5.dynamics.com` |
| `DATAVERSE_TENANT_ID` | Azure AD Tenant ID |
| `DATAVERSE_CLIENT_ID` | App Registration Client ID |
| `DATAVERSE_CLIENT_SECRET` | App Registration Client Secret |

### Cách lấy credentials

1. Vào [Azure Portal](https://portal.azure.com) → **App registrations** → New registration
2. Tạo **Client Secret** trong Certificates & secrets
3. Vào Dataverse → **Settings > Users** → Tạo Application User → Gán role **System Customizer**

## Tools (17)

| Tool | Mô tả |
|------|--------|
| `list_entities` | Liệt kê tất cả tables |
| `get_entity_metadata` | Schema chi tiết 1 table |
| `get_entity_attributes` | Danh sách columns của table |
| `query_records` | Truy vấn OData ($filter, $select, $top, $orderby, $expand) |
| `get_record_by_id` | Lấy 1 record theo GUID |
| `create_record` | Tạo bản ghi mới |
| `update_record` | Cập nhật bản ghi |
| `delete_record` | Xóa bản ghi |
| `execute_fetchxml` | Truy vấn FetchXML (aggregation, groupby) |
| `get_relationships` | Lấy relationships (1:N, N:1, N:N) |
| `get_optionset` | Lấy Choice/OptionSet values |
| `delete_table` | ⚠️ Xóa custom table (tự xử lý dependencies) |
| `delete_attribute` | ⚠️ Xóa column (tự xử lý dependencies) |
| `publish_customizations` | Publish customizations |
| `check_dependencies` | Kiểm tra dependencies trước khi xóa |
| `analyze_table_quality` | Phân tích null rate và data quality |
| `execute_action` | Gọi Dataverse Bound/Unbound Action |

## Auth

OAuth 2.0 Client Credentials qua `@azure/msal-node`. Cần App Registration trên Azure AD + Application User trong Dataverse.

## License

MIT © [Wecare-i](https://github.com/Wecare-i)
