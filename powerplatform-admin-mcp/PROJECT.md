# powerplatform-admin-mcp

MCP Server quản lý Power Platform Admin — environments, solutions, capacity, tenant settings.

## Tech Stack

- TypeScript + `@modelcontextprotocol/sdk`
- Auth: Azure Service Principal (OAuth2 Client Credentials, native `fetch`)
- API: `api.bap.microsoft.com` (environments) + `api.powerplatform.com` (capacity)

## Requirements

- Functional: List/Get/Create environments, list solutions, get capacity, tenant settings, service health
- Non-functional: Startup < 500ms, token caching (tránh re-auth mỗi request)
- Constraint: Service Principal phải được assign **Power Platform Administrator** trong PPAC

## Features

- [x] `env_list` — List all environments (type, region, state, Dataverse URL)
- [x] `env_get` — Get details by environment ID
- [x] `env_create` — Create Sandbox/Developer environment
- [x] `env_list_solutions` — List managed/unmanaged solutions (requires Dataverse provisioned)
- [x] `env_get_capacity` — Storage capacity usage
- [x] `tenant_settings_get` — Tenant governance settings
- [x] `service_health_status` — State of all environments
- [ ] `env_delete` — Delete environment (cần confirm step)
- [ ] `env_copy` — Copy environment
- [ ] `connector_list` — List custom connectors in environment
- [ ] `dlp_policy_list` — List DLP policies

## Dependencies / Tích hợp

- Cùng Service Principal với `dataverse-mcp` và `fabric-mcp`
- `env_list_solutions` gọi tiếp Dataverse OData API → phụ thuộc environment có Dataverse

## Known Issues

- `env_list_solutions` dùng scope `{instanceUrl}/.default` — có thể bị deny nếu SP không có Dataverse access
- `env_get_capacity` dùng `api-version=2022-03-01-preview` — có thể thay đổi

## Roadmap

- [ ] Verify SP permissions trong PPAC (cần Power Platform Admin role)
- [ ] Test `env_list_solutions` với môi trường wecare-ii
- [ ] Publish npm: `@wcg-hieule/powerplatform-admin-mcp`
- [ ] Thêm `dlp_policy_list` + `connector_list`
- [ ] Thêm pagination support cho `env_list`

## Quyết định thiết kế

- Dùng `api.bap.microsoft.com` cho environments thay vì `api.powerplatform.com` vì endpoint chính thức PPAC dùng BAP
- `env_list_solutions` gọi Dataverse API chứ không phải PP API — vì solution data nằm trong Dataverse
- Token cache per-scope để support multi-API trong cùng 1 server
