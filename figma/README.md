# Figma MCP — Hướng Dẫn Cài Đặt

> Kết nối Antigravity với Figma để đọc design files, trích xuất tokens trực tiếp từ màn hình.

## Yêu Cầu

- ✅ **Figma Desktop App** (bắt buộc — MCP chạy qua local server của Figma Desktop)
- ✅ Tài khoản Figma (Free hoặc Pro)
- ✅ Node.js 18+

## Cài Đặt

### Bước 1 — Cài Figma Desktop

Tải tại: https://www.figma.com/downloads/

### Bước 2 — Bật MCP Server trong Figma Desktop

1. Mở **Figma Desktop**
2. Vào **Preferences** (menu Figma → Preferences)
3. Tìm tab **Developer** hoặc **Advanced**
4. Bật **"Enable Dev Mode MCP Server"**
5. Figma sẽ expose local server tại: `http://127.0.0.1:3845`

### Bước 3 — Cấu hình mcp_config.json

```json
"figma": {
  "command": "npx",
  "args": ["-y", "figma-developer-mcp", "--stdio"],
  "env": {}
}
```

> Hoặc dùng SSE mode nếu Figma Desktop đã chạy:
> ```json
> "figma": {
>   "serverUrl": "http://127.0.0.1:3845/sse"
> }
> ```

### Bước 4 — Verify

Restart MCP server trong Antigravity → Kiểm tra `figma` server active.

## Lưu Ý Quan Trọng

| ⚠️ | Figma Desktop **phải đang chạy** thì MCP mới hoạt động |
|----|---------------------------------------------------------|
| ⚠️ | Mở file Figma cần đọc **trước** khi query |
| ⚠️ | Chỉ đọc được file đang **mở trong Figma Desktop** |

## Tools Có Sẵn (sau khi kết nối)

| Tool | Mô tả |
|------|--------|
| `get_figma_data` | Đọc toàn bộ file Figma đang mở |
| `download_figma_images` | Export assets từ file |

## Use Cases

- Trích xuất **color palette, typography, spacing** từ design
- Đọc **component specs** để code đúng với design
- Lấy **asset URLs** để embed vào app

## Resources

- [Figma Developer MCP (NPM)](https://www.npmjs.com/package/figma-developer-mcp)
- [Figma Downloads](https://www.figma.com/downloads/)
- [Figma API Docs](https://www.figma.com/developers/api)
