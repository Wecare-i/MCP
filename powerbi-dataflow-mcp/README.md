# powerbi-dataflow-mcp

MCP server export Dataflow Gen1 (Power BI dataflow) theo workspace ID và dataflow ID vào vault Obsidian.
Đây là bản MCP của script `scripts/Export-DataflowGen1.ps1` trong repo AR. Script ghi file `.pq`, còn MCP ghi note Markdown vào vault.

## Tool `dataflow_gen1_export`

| Tham số | Bắt buộc | Mô tả |
|---|---|---|
| `workspace_id` | ✅ | ID của workspace (GUID) |
| `dataflow_id` | ✅ | ID của dataflow (GUID) |
| `query_name` | | Chỉ trả M code của query này. Note vẫn chứa mọi query |

Lấy hai ID từ M code của bảng trong semantic model (`PowerPlatform.Dataflows(...){[workspaceId="..."]}...{[dataflowId="..."]}`), hoặc từ URL `https://app.powerbi.com/groups/<workspace_id>/dataflows/<dataflow_id>`.

Tool trả về tóm tắt (đường dẫn note, tên query, `loadEnabled`, query group) và M code.

## Note trong vault

Thư mục mặc định: `20 Areas/Wecare/Power BI Dataflow/`.

| File | Nội dung |
|---|---|
| `<tên workspace>/<tên dataflow>.md` | Note của dataflow: frontmatter (ID, `exported`, `dataflow_modified`), bảng query, M code của các query |
| `<tên workspace>/<tên dataflow>/<tên query>.md` | Note riêng của query dài. Chỉ có khi note dataflow dài hơn 400 dòng; query dài hơn 50 dòng được tách ra |
| `Power BI Dataflow — MOC.md` | Danh sách mọi dataflow đã export, nhóm theo workspace |

Note theo `99 System/Agent/Quy ước ghi note.md` của vault: YAML ở dòng đầu, có `type`, `tags`, `updated` và khối `## For future agent`.

Luật ghi đè:

- Tool chỉ ghi đè note có `generated_by: powerbi-dataflow-mcp` trong frontmatter. Note người dùng tự tạo ở cùng đường dẫn thì tool báo lỗi.
- Trong note dataflow, tool ghi lại mọi thứ phía trên dòng `<!-- export:end -->`. Mục `## Ghi chú` bên dưới và các key frontmatter người dùng thêm (ví dụ `relations:`) được giữ nguyên.
- Trong MOC, tool chỉ ghi lại phần giữa `<!-- export:start -->` và `<!-- export:end -->`.
- Note query không còn được dùng không bị xoá. Tool liệt kê các note này trong field `staleQueryNotes` của kết quả.

## Cấu hình

| Biến môi trường | Bắt buộc | Mô tả |
|---|---|---|
| `OBSIDIAN_VAULT_DIR` | ✅ | Thư mục gốc của vault |
| `OBSIDIAN_DATAFLOW_FOLDER` | | Thư mục trong vault. Mặc định `20 Areas/Wecare/Power BI Dataflow` |
| `POWERBI_TENANT_ID` | | Mặc định `organizations` |
| `POWERBI_CLIENT_ID` | | Client ID của app registration riêng, dùng khi tenant chặn client mặc định |

## Đăng nhập

- Lần gọi API đầu tiên mở trình duyệt tới trang đăng nhập Microsoft (`InteractiveBrowserCredential` của `@azure/identity`). Token được giữ trong bộ nhớ đến khi MCP server tắt.
- Không đặt `POWERBI_CLIENT_ID` thì `@azure/identity` dùng client ID mặc định của SDK (public client của Azure CLI).
- Tenant chặn client mặc định thì đăng ký một app riêng: public client, redirect URI `http://localhost`, quyền delegated `Workspace.Read.All` và `Dataflow.Read.All` trên Power BI Service. Sau đó đặt `POWERBI_CLIENT_ID`.

## Cài đặt

```bash
npm install
claude mcp add powerbi-dataflow -s user -e "OBSIDIAN_VAULT_DIR=D:/Tai Lieu/Obsidian/My Vault" -- node "D:/Tai Lieu/Wecare/MCP/powerbi-dataflow-mcp/src/index.js"
```

## Test

```bash
npm test
```

Test dùng Power BI client giả lập và vault tạm, không gọi API thật.
