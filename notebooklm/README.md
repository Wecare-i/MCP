# NotebookLM MCP — Hướng Dẫn Cài Đặt

> RAG engine cho research & documentation — Query kiến thức từ Google NotebookLM notebooks.

## Yêu Cầu

- ✅ Tài khoản Google (Gmail)
- ✅ Node.js 18+
- ✅ Chrome/Chromium browser (MCP tự động mở để login)

## Cài Đặt

### Bước 1 — Cấu hình mcp_config.json

```json
"notebooklm": {
  "command": "npx",
  "args": ["notebooklm-mcp@latest"]
}
```

### Bước 2 — Xác thực Google Account

Sau khi thêm config, restart MCP rồi chạy:

```
setup_auth
```

> Browser sẽ mở → Đăng nhập Google → Hoàn tất. Session được lưu tự động.

### Bước 3 — Kiểm tra kết nối

```
get_health
```

Kết quả mong đợi: `authenticated: true`

### Bước 4 — Thêm Notebook đầu tiên

1. Vào [notebooklm.google.com](https://notebooklm.google.com)
2. Tạo hoặc mở notebook
3. **Share** → **"Anyone with the link"** → Copy link
4. Dùng lệnh: `add_notebook(url, name, description, topics)`

## Xử Lý Sự Cố

| Vấn đề | Giải pháp |
|--------|-----------|
| Auth expired | Chạy `re_auth` |
| Rate limit (50 queries/ngày) | Chạy `re_auth` để đổi account |
| Browser conflict | Đóng Chrome → `cleanup_data` → `setup_auth` lại |

## Library & Data

Library lưu tại:
```
%LOCALAPPDATA%\notebooklm-mcp\Data\library.json
```

## Tools Có Sẵn

| Tool | Mô tả |
|------|--------|
| `setup_auth` | Đăng nhập Google lần đầu |
| `re_auth` | Đổi tài khoản / refresh |
| `get_health` | Kiểm tra trạng thái |
| `ask_question` | Hỏi notebook đang active |
| `list_notebooks` | Liệt kê notebooks trong library |
| `add_notebook` | Thêm notebook mới |
| `select_notebook` | Chọn notebook active |
| `search_notebooks` | Tìm kiếm trong library |

## Giới Hạn (Free Account)

| Giới hạn | Số lượng |
|----------|---------|
| Notebooks tối đa | 100 |
| Sources/notebook | 50 |
| Words/notebook | 500,000 |
| **Queries/ngày** | **50** |

## Notebooks Đang Dùng

| Name | Topics |
|------|--------|
| Layout Patterns & Wecare Design | Layout Patterns, Tailwind CSS, Wecare Brand |

## Resources

- [NotebookLM](https://notebooklm.google.com)
- [notebooklm-mcp NPM](https://www.npmjs.com/package/notebooklm-mcp)
