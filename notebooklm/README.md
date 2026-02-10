# NotebookLM MCP

> Query kiến thức từ Google NotebookLM notebooks.

## Xác thực

```
setup_auth    → Đăng nhập Google lần đầu
re_auth       → Đổi tài khoản hoặc refresh
get_health    → Kiểm tra trạng thái kết nối
```

## Library

Library lưu tại: `%LOCALAPPDATA%\notebooklm-mcp\Data\library.json`

| Lệnh | Mô tả |
|-------|--------|
| `list_notebooks` | Liệt kê notebooks trong library |
| `add_notebook` | Thêm notebook (cần share link) |
| `remove_notebook` | Xóa khỏi library |
| `select_notebook` | Chọn notebook active |
| `ask_question` | Hỏi notebook |

## Notebooks Đã Thêm

| Name | Topics |
|------|--------|
| Layout Patterns & Wecare Design | Layout Patterns, Tailwind CSS, Wecare Brand |

## Cách Thêm Notebook Mới

1. Vào [notebooklm.google.com](https://notebooklm.google.com)
2. Mở notebook → **Share** → **"Anyone with the link"**
3. Copy link → `add_notebook(url, name, description, topics)`

## Giới hạn (Free Account)

- 100 notebooks, 50 sources/notebook
- 500k words, **50 queries/ngày**
