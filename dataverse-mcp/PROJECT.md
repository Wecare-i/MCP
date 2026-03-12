# Dataverse MCP Server

Custom MCP server kết nối Microsoft Dataverse — CRUD, FetchXML, Quality Analysis, Dependency Resolution.

## Tech Stack

- **Runtime**: Node.js >= 18
- **Language**: TypeScript
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **Auth**: MSAL OAuth2 (`@azure/msal-node`)
- **Transport**: stdio
- **Package**: `@wecare-team/dataverse-mcp` (published npm)
- **Loại**: Self-hosted — cần build local

## Requirements

### Functional
- CRUD operations trên Dataverse entities
- OData query ($filter, $select, $top, $orderby, $expand)
- FetchXML query (aggregation, linked entities)
- Entity metadata discovery (attributes, relationships, optionsets)
- Delete table/attribute với auto dependency resolution
- Data quality analysis (null rate, suspect columns)
- Execute Dataverse Actions (Bound/Unbound)
- Publish customizations

### Non-functional
- Auto-resolve blocking dependencies trước khi delete
- Cảnh báo dependencies không thể auto-resolve (Canvas App, Plugin)
- Vietnamese description cho tất cả tools

### Constraints
- Cần Azure App Registration + Application User trong Dataverse
- OAuth2 Client Credentials flow (không interactive)

## Features

- [x] CRUD operations (create, read, update, delete records)
- [x] Entity metadata & attributes discovery
- [x] OData query ($filter, $select, $top, $orderby, $expand)
- [x] FetchXML query (aggregation, groupby, linked entities)
- [x] Relationships exploration (1:N, N:1, N:N)
- [x] OptionSet/Choice values
- [x] Delete table with dependency resolution
- [x] Delete attribute with dependency resolution
- [x] Check dependencies before delete
- [x] Publish customizations
- [x] Data quality analysis (null rate, suspect columns)
- [x] Execute Dataverse Actions (Bound/Unbound)
- [x] Published to npm: `@wecare-team/dataverse-mcp`

## Dependencies / Tích hợp

| Package | Mục đích |
|---------|----------|
| `@modelcontextprotocol/sdk` | MCP protocol |
| `@azure/msal-node` | MSAL OAuth2 authentication |
| `dotenv` | Environment variables |

## Known Issues

- `delete_record` tool bị loại bỏ có chủ đích — tránh xóa data production
- Dependency resolver chỉ auto-resolve Views/Forms/Workflows — Canvas App/Plugin cần xử lý thủ công

## Roadmap

1. Thêm batch operations (bulk create/update)
2. Audit log / change tracking
3. Support cho virtual tables

## Quyết định thiết kế

- **Dependency resolver tự động**: Trước khi delete column/table, tự động gỡ khỏi Views/Forms và deactivate Workflows — giảm manual work
- **delete_record bị loại**: Security measure — tránh AI xóa nhầm production data
- **Vietnamese descriptions**: Tất cả tool descriptions viết bằng tiếng Việt — phù hợp với team context
- **MSAL vs Azure Identity**: Chọn MSAL vì cần Client Credentials flow cụ thể, Azure Identity quá generic
