# GitHub MCP Server

> Forked from [github/github-mcp-server](https://github.com/github/github-mcp-server) — sử dụng qua `npx`, không build từ source.

## Quick Start

```jsonc
// ~/.gemini/antigravity/mcp_config.json
{
  "github": {
    "command": "npx",
    "args": [
      "-y",
      "@modelcontextprotocol/server-github",
      "--",
      "--toolsets",
      "repos,issues,pull_requests,orgs,actions,code_security,secret_protection"
    ],
    "env": {
      "GITHUB_PERSONAL_ACCESS_TOKEN": "<your-pat>"
    }
  }
}
```

## Tools Reference

### 📁 Repos (17 tools)

| Tool | Mô tả | Read/Write |
|------|--------|------------|
| `SearchRepositories` | Tìm repositories | Read |
| `GetFileContents` | Đọc file trong repo | Read |
| `ListCommits` | List commits | Read |
| `SearchCode` | Tìm code across repos | Read |
| `GetCommit` | Chi tiết 1 commit | Read |
| `ListBranches` | List branches | Read |
| `ListTags` | List tags | Read |
| `GetTag` | Chi tiết 1 tag | Read |
| `ListReleases` | List releases | Read |
| `GetLatestRelease` | Release mới nhất | Read |
| `GetReleaseByTag` | Release theo tag | Read |
| `CreateOrUpdateFile` | Tạo/sửa file trên remote | Write |
| `CreateRepository` | Tạo repository mới | Write |
| `ForkRepository` | Fork repository | Write |
| `CreateBranch` | Tạo branch mới | Write |
| `PushFiles` | Push nhiều files | Write |
| `DeleteFile` | Xóa file | Write |

### 🐛 Issues (7 tools)

| Tool | Mô tả | Read/Write |
|------|--------|------------|
| `IssueRead` | Đọc chi tiết issue | Read |
| `SearchIssues` | Tìm issues | Read |
| `ListIssues` | List issues theo repo | Read |
| `ListIssueTypes` | List issue types | Read |
| `IssueWrite` | Tạo/sửa issue | Write |
| `AddIssueComment` | Comment vào issue | Write |
| `SubIssueWrite` | Tạo sub-issue | Write |

### 🔀 Pull Requests (10 tools)

| Tool | Mô tả | Read/Write |
|------|--------|------------|
| `PullRequestRead` | Đọc chi tiết PR | Read |
| `ListPullRequests` | List PRs | Read |
| `SearchPullRequests` | Tìm PRs | Read |
| `MergePullRequest` | Merge PR | Write |
| `UpdatePullRequestBranch` | Update branch của PR | Write |
| `CreatePullRequest` | Tạo PR mới | Write |
| `UpdatePullRequest` | Sửa PR | Write |
| `PullRequestReviewWrite` | Submit review | Write |
| `AddCommentToPendingReview` | Comment trong pending review | Write |
| `AddReplyToPullRequestComment` | Reply comment trên PR | Write |

### 🏢 Orgs (1 tool)

| Tool | Mô tả | Read/Write |
|------|--------|------------|
| `SearchOrgs` | Tìm organizations | Read |

### ⚡ Actions (4 tools)

| Tool | Mô tả | Read/Write |
|------|--------|------------|
| `ActionsList` | List workflow runs | Read |
| `ActionsGet` | Chi tiết workflow run | Read |
| `ActionsRunTrigger` | Trigger workflow manually | Write |
| `ActionsGetJobLogs` | Đọc job logs | Read |

### 🛡️ Code Security (2 tools)

| Tool | Mô tả | Read/Write |
|------|--------|------------|
| `GetCodeScanningAlert` | Chi tiết code scanning alert | Read |
| `ListCodeScanningAlerts` | List code scanning alerts | Read |

### 🔐 Secret Protection (2 tools)

| Tool | Mô tả | Read/Write |
|------|--------|------------|
| `GetSecretScanningAlert` | Chi tiết secret alert | Read |
| `ListSecretScanningAlerts` | List secret scanning alerts | Read |

## Disabled Toolsets

Các toolsets sau đã tắt để giảm noise:

`context` · `users` · `copilot` · `git` · `stargazers` · `labels` · `projects` · `gists` · `notifications` · `discussions` · `security_advisories` · `dependabot`

Bật lại bằng cách thêm vào `--toolsets`: ví dụ `repos,issues,...,notifications`

## License

MIT — see [LICENSE](./LICENSE)
