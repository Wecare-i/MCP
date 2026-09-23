# Power BI Dataflow MCP Server

Custom MCP server export M code của Dataflow Gen1 (Power BI dataflow) ra note Markdown trong vault Obsidian.

**Last Updated**: 2026-09-23

## Tech Stack

- **Runtime**: Node.js >= 20
- **Language**: JavaScript (ESM, không build — chạy thẳng `src/index.js`)
- **MCP SDK**: `@modelcontextprotocol/sdk` ^1.30.0
- **Auth**: `InteractiveBrowserCredential` của `@azure/identity` — đăng nhập bằng tài khoản người dùng, không dùng service principal
- **Transport**: stdio
- **Loại**: Self-hosted — không cần build, `npm install` là chạy được

## Requirements

### Functional

- Export một Dataflow Gen1 theo `workspace_id` + `dataflow_id`
- Tách M code của từng query trong dataflow
- Ghi note Markdown vào vault Obsidian, cập nhật MOC
- Trả M code về cho agent để đọc ngay trong phiên chat

### Non-functional

- Note ghi theo `99 System/Agent/Quy ước ghi note.md` của vault: YAML ở dòng đầu, có khối `## For future agent`
- Chỉ ghi đè note do chính tool tạo (`generated_by: powerbi-dataflow-mcp` trong frontmatter)
- Giữ nguyên phần người dùng viết tay: mục `## Ghi chú` và các key frontmatter thêm vào

### Constraints

- Dataflow Gen1, không phải Gen2
- Bắt buộc truyền cả hai ID. Tool không export cả workspace
- Token giữ trong bộ nhớ, mất khi MCP server tắt

## Tools

| Tool | Tham số | Mô tả |
|---|---|---|
| `dataflow_gen1_export` | `workspace_id` ✅, `dataflow_id` ✅, `query_name` | Export dataflow, ghi note vào vault, trả M code |

## Cấu hình

| Biến môi trường | Bắt buộc | Mặc định |
|---|---|---|
| `OBSIDIAN_VAULT_DIR` | ✅ | — |
| `OBSIDIAN_DATAFLOW_FOLDER` | | `20 Areas/Wecare/Power BI Dataflow` |
| `POWERBI_TENANT_ID` | | `organizations` |
| `POWERBI_CLIENT_ID` | | Client ID mặc định của `@azure/identity` |

```bash
npm install
claude mcp add powerbi-dataflow -s user \
  -e "OBSIDIAN_VAULT_DIR=D:/Tai Lieu/Obsidian/My Vault" \
  -- node "D:/Tai Lieu/Wecare/MCP/powerbi-dataflow-mcp/src/index.js"
```

## Cấu trúc mã nguồn

| File | Dòng | Việc |
|---|---|---|
| `src/index.js` | 17 | Điểm vào, khởi động stdio server |
| `src/server.js` | 170 | Khai báo tool, ráp các bước, trả kết quả |
| `src/powerbi.js` | 62 | Đăng nhập Microsoft, gọi Power BI REST API |
| `src/mashup.js` | 100 | Tách M code của từng query từ `document` trong `model.json` |
| `src/obsidian.js` | 443 | Ghi note dataflow, note query, cập nhật MOC |
| `test/server.test.js` | — | Test bằng `node --test` |

## Skill đi kèm

`skill/SKILL.md` là skill `powerbi-dataflow-check` cho Claude Code. Skill nối ba MCP: `powerbi-modeling-mcp` đọc model để tìm bảng lấy dữ liệu từ dataflow, `powerbi-dataflow` export đúng dataflow đó, `obsidian` đọc lại note của các phiên trước.

Cài: chép thư mục vào `~/.claude/skills/powerbi-dataflow-check/`.

## Nguồn

- Power BI REST API — Dataflows Get Dataflow: https://learn.microsoft.com/en-us/rest/api/power-bi/dataflows/get-dataflow
- `@azure/identity` InteractiveBrowserCredential: https://learn.microsoft.com/en-us/javascript/api/@azure/identity/interactivebrowsercredential
- MCP SDK cho TypeScript/JavaScript: https://github.com/modelcontextprotocol/typescript-sdk
