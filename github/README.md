# GitHub MCP — Hướng Dẫn Cài Đặt

> Tương tác với GitHub repositories: tạo issues, PRs, push files, search code trực tiếp từ Antigravity.

## Yêu Cầu

- ✅ Tài khoản GitHub
- ✅ Node.js 18+
- ✅ GitHub Personal Access Token (PAT)

## Cài Đặt

### Bước 1 — Tạo Personal Access Token

1. Vào [github.com/settings/tokens](https://github.com/settings/tokens)
2. **Generate new token (classic)**
3. Chọn scopes:
   - `repo` — Full control of private repositories
   - `read:org` — Đọc thông tin organization
   - `workflow` — Nếu cần trigger GitHub Actions
4. Copy token

### Bước 2 — Cấu hình mcp_config.json

```json
"github": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "<YOUR_PAT_HERE>"
  }
}
```

### Bước 3 — Verify

Restart MCP → Test bằng lệnh: `list_commits` hoặc `search_repositories`.

## Tools Có Sẵn

| Category | Tool | Mô tả |
|----------|------|--------|
| **Repo** | `create_repository` | Tạo repo mới |
| **Repo** | `fork_repository` | Fork repo |
| **File** | `get_file_contents` | Đọc file/folder |
| **File** | `create_or_update_file` | Tạo/cập nhật file |
| **File** | `push_files` | Push nhiều files cùng lúc |
| **Branch** | `create_branch` | Tạo branch mới |
| **Issue** | `create_issue` / `list_issues` | Quản lý issues |
| **PR** | `create_pull_request` / `merge_pull_request` | Quản lý PRs |
| **Search** | `search_repositories` / `search_code` | Tìm kiếm |

## Organizations Đang Dùng

- **Wecare-i** — Tổ chức chính cho các dự án Wecare

## Resources

- [GitHub MCP Server](https://github.com/modelcontextprotocol/servers/tree/main/src/github)
- [Tạo GitHub PAT](https://github.com/settings/tokens)
