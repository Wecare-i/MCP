#!/usr/bin/env node
/**
 * Power BI Dataflow MCP Server
 *
 * Export Dataflow Gen1 (Power BI dataflow) theo workspace ID và dataflow ID:
 * lưu model.json, tách M code của từng query thành file .pq, rồi trả M code về cho AI.
 *
 * Auth: tài khoản người dùng. Lần gọi API đầu tiên mở trình duyệt để đăng nhập.
 * Transport: stdio
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

const server = createServer();
await server.connect(new StdioServerTransport());
console.error("powerbi-dataflow-mcp đang chạy qua stdio");
