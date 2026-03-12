# canvas-apps-mcp

MCP Server quản lý Power Apps Canvas — list, inspect, publish apps và quản lý permissions.

## Tech Stack

- TypeScript + `@modelcontextprotocol/sdk`
- Auth: Azure Service Principal (OAuth2, native `fetch`)
- API: `api.powerapps.com` — Power Apps Management API

## Requirements

- Functional: List/Get apps, inspect connections, publish, get permissions
- Non-functional: Token cached, bundle < 15KB
- Constraint: SP cần quyền truy cập Power Apps management API (PowerApps.Apps.Read / .Write)

## Features

- [x] `app_list` — List all apps across tenant
- [x] `app_get` — Get app details by ID
- [x] `app_list_by_env` — List apps trong environment cụ thể
- [x] `app_get_connections` — Danh sách connectors app đang dùng
- [x] `app_publish` — Publish phiên bản mới nhất của app
- [x] `app_get_permissions` — Xem ai có quyền và role gì
- [ ] `app_share` — Share app với user/group/everyone
- [ ] `app_export` — Export app package (.zip)
- [ ] `app_versions` — List các version cũ của app
- [ ] `connector_list` — List connectors trong environment

## Dependencies / Tích hợp

- `environmentId` lấy từ `powerplatform-admin-mcp` → `env_list`
- Connector info có thể dùng để audit security (ai đang dùng connector gì)

## Known Issues

- `app_publish` có thể fail nếu app đang trong trạng thái Edit (chưa save)
- API `2016-11-01` khá cũ — Microsoft có thể deprecate, cần monitor

## Roadmap

- [ ] Verify SP có đủ quyền với Power Apps API
- [ ] Test `app_list_by_env` với environment `wecare-ii`
- [ ] Thêm `app_share` để automate permission assignment
- [ ] Publish npm: `@wcg-hieule/canvas-apps-mcp`
- [ ] Nghiên cứu Power Apps Inventory API (mới hơn, xem preview release)

## Quyết định thiết kế

- Dùng `api.powerapps.com` thay vì `api.powerplatform.com/appmanagement` vì ổn định hơn và documented rõ hơn
- `app_get_permissions` thay vì `app_assign_to_user` — read trước, write sau khi verify quyền
