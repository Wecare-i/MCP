# Stitch MCP — Hướng Dẫn Cài Đặt

> Generate và edit UI screens từ text prompt, tích hợp AI design với Google Stitch.

## Yêu Cầu

- ✅ Google API Key có access Stitch
- ✅ Không cần cài thêm gì — kết nối qua HTTPS

## Cài Đặt

### Bước 1 — Lấy Google API Key

1. Vào [Google AI Studio](https://aistudio.google.com)
2. **Get API key** → Tạo key mới
3. Copy API key

### Bước 2 — Cấu hình mcp_config.json

```json
"stitch": {
  "serverUrl": "https://stitch.googleapis.com/mcp",
  "headers": {
    "X-Goog-Api-Key": "<YOUR_GOOGLE_API_KEY>"
  }
}
```

### Bước 3 — Verify

Restart MCP → Test: `list_projects` để xem danh sách Stitch projects.

## Workflow Thiết Kế UI

```
1. create_project           → Tạo project container
2. generate_screen_from_text → Generate màn hình từ prompt
3. edit_screens             → Tinh chỉnh theo feedback
4. generate_variants        → Tạo alternatives
5. → Dùng react:components skill convert sang React
```

## Tips Viết Prompt Hiệu Quả

- Nêu rõ **loại màn hình** (dashboard, form, list, detail page)
- Chỉ định **color scheme** hoặc brand (Wecare brand: teal/dark)
- Mô tả **components cần có** (sidebar, table, cards, modal)
- Dùng `/app` workflow để tạo nhiều screens liên kết

## Tools Có Sẵn

| Tool | Mô tả |
|------|--------|
| `create_project` | Tạo project Stitch mới |
| `generate_screen_from_text` | Generate màn hình từ prompt |
| `edit_screens` | Chỉnh sửa màn hình có sẵn |
| `generate_variants` | Tạo các variants |
| `list_projects` | Liệt kê projects |
| `get_project` | Chi tiết project |
| `list_screens` | Liệt kê screens trong project |
| `get_screen` | Chi tiết 1 screen + HTML |

## Resources

- [Google AI Studio (API Key)](https://aistudio.google.com)
- [Stitch](https://stitch.google.com)
