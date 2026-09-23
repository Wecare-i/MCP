# Power BI Dataflow MCP Server

Custom MCP server export M code của Dataflow Gen1 (Power BI dataflow) ra file: thư mục thường trong repo git, hoặc note Markdown trong vault Obsidian.

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
- Hai chế độ ghi file, chọn bằng `DATAFLOW_FORMAT`:
  - `repo`: mỗi query một file `.pq` kèm `README.md`, dùng link Markdown thường. Cho người không dùng Obsidian và cho repo git của team
  - `obsidian`: note Markdown trong vault, có wikilink và MOC
- Trả M code về cho agent để đọc ngay trong phiên chat

### Non-functional

- Chế độ `obsidian` ghi theo `99 System/Agent/Quy ước ghi note.md` của vault: YAML ở dòng đầu, có khối `## For future agent`
- Chỉ ghi đè file do chính tool tạo. Chế độ `obsidian` nhận biết bằng `generated_by` trong frontmatter, chế độ `repo` bằng dòng đầu của file
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
| `DATAFLOW_OUTPUT_DIR` | ✅ ở chế độ `repo` | — |
| `OBSIDIAN_VAULT_DIR` | ✅ ở chế độ `obsidian` | — |
| `DATAFLOW_FORMAT` | | Theo biến nào đang có; có cả hai thì `obsidian` |
| `OBSIDIAN_DATAFLOW_FOLDER` | | `20 Areas/Wecare/Power BI Dataflow` |
| `POWERBI_TENANT_ID` | | `organizations` |
| `POWERBI_CLIENT_ID` | | Client ID mặc định của `@azure/identity` |

```bash
npm install
claude mcp add powerbi-dataflow -s user \
  -e "DATAFLOW_OUTPUT_DIR=D:/Tai Lieu/Wecare/TMDL/AR/New/Dataflow" \
  -- node "<đường dẫn>/powerbi-dataflow-mcp/src/index.js"
```

## Cấu trúc mã nguồn

| File | Việc |
|---|---|
| `src/index.js` | Điểm vào, khởi động stdio server |
| `src/server.js` | Khai báo tool, chọn chế độ ghi, ráp các bước, trả kết quả |
| `src/powerbi.js` | Đăng nhập Microsoft, gọi Power BI REST API |
| `src/mashup.js` | Tách M code của từng query từ `document` trong `model.json` |
| `src/markdown.js` | Hàm dùng chung cho hai chế độ: escape ô bảng, khối code, đọc file, định dạng ngày |
| `src/obsidian.js` | Chế độ `obsidian`: note dataflow, note query, cập nhật MOC |
| `src/repo.js` | Chế độ `repo`: file `.pq` từng query, README dataflow, README gốc |
| `test/server.test.js` | 12 test bằng `node --test`, phủ cả hai chế độ |

## Skill đi kèm

`skill/SKILL.md` là skill `powerbi-dataflow-check` cho Claude Code. Skill nối ba MCP: `powerbi-modeling-mcp` đọc model để tìm bảng lấy dữ liệu từ dataflow, `powerbi-dataflow` export đúng dataflow đó, `obsidian` đọc lại note của các phiên trước.

Cài: chép thư mục vào `~/.claude/skills/powerbi-dataflow-check/`.

## Nguồn

- Power BI REST API — Dataflows Get Dataflow: https://learn.microsoft.com/en-us/rest/api/power-bi/dataflows/get-dataflow
- `@azure/identity` InteractiveBrowserCredential: https://learn.microsoft.com/en-us/javascript/api/@azure/identity/interactivebrowsercredential
- MCP SDK cho TypeScript/JavaScript: https://github.com/modelcontextprotocol/typescript-sdk
