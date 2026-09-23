# powerbi-dataflow-mcp

MCP server export Dataflow Gen1 (Power BI dataflow) theo workspace ID và dataflow ID ra file, rồi trả M code về cho agent.

Hai cách ghi file, chọn bằng `DATAFLOW_FORMAT`:

| Chế độ | Ghi ra | Dùng khi |
|---|---|---|
| `repo` | Thư mục thường: mỗi query một file `.pq`, kèm `README.md` | Không dùng Obsidian, hoặc muốn commit M code vào repo git của team |
| `obsidian` | Note Markdown trong vault: wikilink, MOC, frontmatter theo quy ước vault | Có vault Obsidian |

## Tool `dataflow_gen1_export`

| Tham số | Bắt buộc | Mô tả |
|---|---|---|
| `workspace_id` | ✅ | ID của workspace (GUID) |
| `dataflow_id` | ✅ | ID của dataflow (GUID) |
| `query_name` | | Chỉ trả M code của query này. Note vẫn chứa mọi query |

Lấy hai ID từ M code của bảng trong semantic model (`PowerPlatform.Dataflows(...){[workspaceId="..."]}...{[dataflowId="..."]}`), hoặc từ URL `https://app.powerbi.com/groups/<workspace_id>/dataflows/<dataflow_id>`.

Tool trả về tóm tắt (chế độ đang dùng, đường dẫn file, tên query, `loadEnabled`, query group) và M code.

## Chế độ `repo`: thư mục thường

```
<DATAFLOW_OUTPUT_DIR>/
├── README.md                             danh sách mọi dataflow đã export
└── <tên workspace>/<tên dataflow>/
    ├── README.md                         thông tin dataflow + bảng query
    └── <tên query>.pq                    M code của một query
```

File `.pq` mở được bằng VS Code và diff được bằng git. README dùng link Markdown thường nên GitHub, VS Code và cả Obsidian đều mở được.

Luật ghi đè:

- File `.pq` do tool tạo bắt đầu bằng dòng `// powerbi-dataflow-mcp`. README do tool tạo bắt đầu bằng `<!-- powerbi-dataflow-mcp -->`. Thiếu dòng đó thì tool báo lỗi, không ghi đè.
- Trong README của dataflow, tool ghi lại mọi thứ phía trên dòng `<!-- export:end -->`. Mục `## Ghi chú` bên dưới được giữ nguyên.
- Trong README gốc, tool chỉ ghi lại phần giữa `<!-- export:start -->` và `<!-- export:end -->`.
- File `.pq` của query không còn nữa thì không bị xoá. Tool liệt kê trong field `staleQueryFiles`.

## Chế độ `obsidian`: note trong vault

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
| `DATAFLOW_OUTPUT_DIR` | ✅ ở chế độ `repo` | Thư mục lưu M code. Thư mục phải có sẵn |
| `OBSIDIAN_VAULT_DIR` | ✅ ở chế độ `obsidian` | Thư mục gốc của vault |
| `DATAFLOW_FORMAT` | | `repo` hoặc `obsidian`. Bỏ trống thì tool tự chọn theo biến nào đang có, có cả hai thì dùng `obsidian` |
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
```

Chế độ `repo` — ghi vào một thư mục trong repo git:

```bash
claude mcp add powerbi-dataflow -s user \
  -e "DATAFLOW_OUTPUT_DIR=D:/Tai Lieu/Wecare/TMDL/AR/New/Dataflow" \
  -- node "<đường dẫn>/powerbi-dataflow-mcp/src/index.js"
```

Chế độ `obsidian` — ghi vào vault:

```bash
claude mcp add powerbi-dataflow -s user \
  -e "OBSIDIAN_VAULT_DIR=D:/Tai Lieu/Obsidian/My Vault" \
  -- node "<đường dẫn>/powerbi-dataflow-mcp/src/index.js"
```

## Test

```bash
npm test
```

Test dùng Power BI client giả lập và thư mục tạm, không gọi API thật. Cả hai chế độ ghi file đều có test.
