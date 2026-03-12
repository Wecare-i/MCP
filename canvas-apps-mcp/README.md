# @wcg-hieule/canvas-apps-mcp

> **MCP Server for Power Apps Canvas** — List, inspect, publish and manage Canvas Apps via Power Apps API.

[![npm version](https://img.shields.io/npm/v/@wcg-hieule/canvas-apps-mcp.svg)](https://www.npmjs.com/package/@wcg-hieule/canvas-apps-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)

---

## Quick Start

```json
{
  "mcpServers": {
    "canvas-apps": {
      "command": "npx",
      "args": ["-y", "@wcg-hieule/canvas-apps-mcp"],
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

## Tools (6)

| Tool | Description |
|------|-------------|
| `app_list` | List all Canvas Apps across all environments |
| `app_get` | Get detailed info about a specific app |
| `app_list_by_env` | List Canvas Apps in a specific environment |
| `app_get_connections` | Get connectors used by an app |
| `app_publish` | Publish the latest saved version of an app |
| `app_get_permissions` | Get role assignments (who has access and what role) |

---

## License

MIT © [wcg-hieule](https://www.npmjs.com/~wcg-hieule)
