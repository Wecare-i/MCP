# power-automate-mcp

MCP Server quản lý Power Automate flows — list, get, trigger, monitor run history, enable/disable.

## Tech Stack

- TypeScript + `@modelcontextprotocol/sdk`
- Auth: Azure Service Principal (OAuth2, native `fetch`)
- API: `api.flow.microsoft.com` — Power Automate Management API
- Scope: `https://service.flow.microsoft.com/.default`

## Requirements

- Functional: List/Get flows, trigger manual flows, monitor runs, enable/disable
- Non-functional: Token cached, bundle ~12KB
- Constraint: Run history retention mặc định 28 ngày; flow trigger chỉ hoạt động với manual/HTTP trigger

## Features

- [x] `flow_list` — List flows trong environment (state, trigger type, owner)
- [x] `flow_get` — Get flow details (definition, connections)
- [x] `flow_trigger` — Trigger flow manually (HTTP/manual trigger)
- [x] `flow_get_runs` — Run history (filter: Succeeded/Failed/Running/Cancelled)
- [x] `flow_get_run_detail` — Full run detail (all action results, error messages)
- [x] `flow_enable` — Enable (start) stopped flow
- [x] `flow_disable` — Disable (stop) running flow
- [ ] `flow_cancel_run` — Cancel a running flow instance
- [ ] `flow_get_owners` — List flow owners/co-owners
- [ ] `flow_export` — Export flow package
- [ ] `scheduled_flow_list` — Filter chỉ scheduled flows

## Dependencies / Tích hợp

- `environmentId` lấy từ `powerplatform-admin-mcp` → `env_list`
- `flow_trigger` → `flow_get_runs` → `flow_get_run_detail` là workflow tự nhiên để monitor

## Known Issues

- `flow_trigger` dùng hardcoded trigger name `manual` — cần test với các flow có trigger name khác nhau
- Service Principal ownership: Flows thuộc user cá nhân không trigger được qua SP (cần SP làm co-owner)
- `flow_disable` cần cẩn thận — không có confirm step hiện tại

## Roadmap

- [ ] Verify SP có flow ownership / co-ownership trước khi trigger
- [ ] Test `flow_list` với environment `wecare-ii` thực tế
- [ ] Phân tích: có cần `flow_cancel_run` không nếu flow bị stuck?
- [ ] Publish npm: `@wcg-hieule/power-automate-mcp`
- [ ] Nghiên cứu Power Automate Admin API (v2) — endpoint mới hơn

## Quyết định thiết kế

- Dùng `api.flow.microsoft.com` (Management API) thay vì Logic Apps API — chuẩn cho Power Automate
- `flow_trigger` auto-detect trigger name từ flow definition thay vì hardcode — linh hoạt hơn
- Tách `flow_get_runs` và `flow_get_run_detail` — tránh payload quá lớn khi list nhiều runs
