# GitHub MCP Server

MCP server kết nối GitHub platform — quản lý repos, issues, PRs, Actions, security scanning.

## Tech Stack

- **Package**: `@modelcontextprotocol/server-github` (npx)
- **Source**: [github/github-mcp-server](https://github.com/github/github-mcp-server)
- **Language**: Go (upstream — chỉ dùng npx, không build từ source)
- **Auth**: GitHub Personal Access Token (PAT)
- **Transport**: stdio

## Toolsets đang dùng

```
repos, issues, pull_requests, orgs, actions, code_security, secret_protection
```

| Toolset | Tools | Chức năng |
|---------|-------|-----------|
| **repos** | 17 | Search, file CRUD, branches, commits, releases, tags |
| **issues** | 7 | CRUD issues, comments, sub-issues |
| **pull_requests** | 10 | Read/list/merge PRs, review, comments |
| **orgs** | 1 | Search organizations |
| **actions** | 4 | List/get workflow runs, trigger, job logs |
| **code_security** | 2 | Code scanning alerts |
| **secret_protection** | 2 | Secret scanning alerts |

**Tổng: 7 toolsets, ~43 tools**

## Toolsets đã tắt

`context`, `users`, `copilot`, `git`, `stargazers`, `labels`, `projects`, `gists`, `notifications`, `discussions`, `security_advisories`, `dependabot`

## Config

File: `~/.gemini/antigravity/mcp_config.json` → section `github`

## Known Issues

- PAT cần rotation thường xuyên cho security
- Folder này đã clean — chỉ giữ docs reference, không có source code

## Quyết định thiết kế

- **npx** thay vì build from source: đơn giản, tự động update
- **Selective toolsets**: chỉ bật 7/20 toolsets để giảm noise, tập trung vào workflow thực tế
- **Folder clean**: xóa toàn bộ Go source code, giữ lại LICENSE + README reference
