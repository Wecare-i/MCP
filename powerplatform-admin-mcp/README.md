# @wcg-hieule/powerplatform-admin-mcp

> **MCP Server for Power Platform Admin** — Manage environments, solutions, capacity via Power Platform API.

[![npm version](https://img.shields.io/npm/v/@wcg-hieule/powerplatform-admin-mcp.svg)](https://www.npmjs.com/package/@wcg-hieule/powerplatform-admin-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

---

## Quick Start

```json
{
  "mcpServers": {
    "powerplatform-admin": {
      "command": "npx",
      "args": ["-y", "@wcg-hieule/powerplatform-admin-mcp"],
      "env": {
        "AZURE_TENANT_ID": "your-tenant-id",
        "AZURE_CLIENT_ID": "your-client-id",
        "AZURE_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

> **Prerequisite**: Service Principal must have **Power Platform Administrator** role in PPAC.

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
| `env_list` | List all environments (name, type, region, state) |
| `env_get` | Get detailed info about a specific environment |
| `env_create` | Create a new Sandbox or Developer environment |
| `env_list_solutions` | List managed/unmanaged solutions in an environment |
| `env_get_capacity` | Get storage capacity usage |
| `tenant_settings_get` | Get tenant-level governance settings |
| `service_health_status` | Get health state of all environments |

---

## License

MIT © [wcg-hieule](https://www.npmjs.com/~wcg-hieule)
