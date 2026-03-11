import { startMcpFromCli } from './mcp-entry.js';

startMcpFromCli().catch((err) => {
  console.error('Failed to start MCP server:', err);
  process.exit(1);
});
