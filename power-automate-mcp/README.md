# @wcg-hieule/power-automate-mcp

> **MCP Server for Power Automate** — List, trigger, enable/disable flows and monitor run history via Power Automate API.

[![npm version](https://img.shields.io/npm/v/@wcg-hieule/power-automate-mcp.svg)](https://www.npmjs.com/package/@wcg-hieule/power-automate-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

---

## Quick Start

```json
{
  "mcpServers": {
    "power-automate": {
      "command": "npx",
      "args": ["-y", "@wcg-hieule/power-automate-mcp"],
      "env": {
        "AZURE_TENANT_ID": "your-tenant-id",
        "AZURE_CLIENT_ID": "your-client-id",
        "AZURE_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

---

## Environment Variables

| Variable | Required | Description |
|----------|:--------:|-------------|
| `AZURE_TENANT_ID` | ✅ | Azure AD Tenant ID |
| `AZURE_CLIENT_ID` | ✅ | App Registration Client ID |
| `AZURE_CLIENT_SECRET` | ✅ | App Registration Client Secret |

---

## Tools (7)

| Tool | Description |
|------|-------------|
| `flow_list` | List all flows in an environment (state, trigger type) |
| `flow_get` | Get detailed info about a specific flow |
| `flow_trigger` | ⚠️ Manually trigger a flow (HTTP/manual trigger) |
| `flow_get_runs` | Get run history (filter by status: Succeeded/Failed/Running) |
| `flow_get_run_detail` | Get full details of a specific run including action results |
| `flow_enable` | Enable (start) a stopped flow |
| `flow_disable` | ⚠️ Disable (stop) a running flow |

> **Note:** `environmentId` can be found via `env_list` in the Admin MCP.

---

## License

MIT © [wcg-hieule](https://www.npmjs.com/~wcg-hieule)
