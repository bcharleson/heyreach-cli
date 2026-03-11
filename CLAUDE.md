# Claude Code Instructions — HeyReach CLI

## Project Overview

CLI and MCP server for the [HeyReach](https://heyreach.io) LinkedIn automation platform. Wraps the HeyReach Public API (47 commands across 10 groups) into both a terminal CLI and an MCP server for AI assistants.

**Dual interface, single codebase:** Every API endpoint is defined once as a `CommandDefinition` object that powers both the CLI subcommand and the MCP tool.

## Architecture

### CommandDefinition Pattern

Every API endpoint lives in one file under `src/commands/<group>/<subcommand>.ts` and exports a single `CommandDefinition` object:

```typescript
interface CommandDefinition {
  name: string;           // MCP tool name: "campaigns_list"
  group: string;          // CLI group: "campaigns"
  subcommand: string;     // CLI subcommand: "list"
  description: string;    // Shared help text
  inputSchema: ZodObject; // Validates CLI flags AND MCP input
  cliMappings: {...};     // Maps Zod fields to Commander args/options
  endpoint: { method, path };
  fieldMappings: {...};   // Where each field goes: path | query | body
  handler: (input, client) => Promise<unknown>;
}
```

**Adding a new endpoint = creating one file + adding it to the group index + allCommands array in `src/commands/index.ts`.**

### Key Files

- `src/core/types.ts` — CommandDefinition interface and shared types
- `src/core/client.ts` — HTTP client (X-API-KEY header, retry, rate limiting, offset/limit pagination)
- `src/core/handler.ts` — executeCommand() builds HTTP requests from CommandDefinition + input
- `src/core/auth.ts` — API key resolution (--api-key flag > env var > config file). Supports both workspace and org keys.
- `src/core/output.ts` — JSON output formatting, --fields, --quiet, --pretty
- `src/core/errors.ts` — Typed error classes (AuthError, RateLimitError, etc.)
- `src/core/config.ts` — ~/.heyreach/config.json manager
- `src/commands/index.ts` — Command registry, auto-registration, login/logout/status/config
- `src/mcp-entry.ts` — MCP server (registers all CommandDefinitions as tools)
- `src/index.ts` — CLI entry point
- `src/mcp.ts` — Direct MCP entry point

### Directory Structure

```
src/
├── index.ts                 # CLI entry
├── mcp.ts                   # MCP entry
├── mcp-entry.ts             # MCP server factory
├── core/                    # Shared infrastructure
│   ├── types.ts
│   ├── client.ts
│   ├── handler.ts
│   ├── auth.ts
│   ├── config.ts
│   ├── output.ts
│   └── errors.ts
├── commands/
│   ├── index.ts             # Registry + registerAllCommands()
│   ├── campaigns/           # 8 commands (list, get, resume, pause, add-leads, stop-lead, get-leads, get-for-lead)
│   ├── inbox/               # 4 commands (list, get, send, set-seen)
│   ├── accounts/            # 2 commands (list, get) — LinkedIn accounts
│   ├── lists/               # 9 commands (get, list, create, get-leads, add-leads, delete-leads, delete-leads-by-url, get-companies, get-for-lead)
│   ├── stats/               # 1 command (overview)
│   ├── leads/               # 4 commands (get, add-tags, get-tags, replace-tags)
│   ├── lead-tags/           # 1 command (create)
│   ├── webhooks/            # 5 commands (create, get, list, update, delete)
│   ├── network/             # 2 commands (list, check) — MyNetwork
│   └── org/                 # 11 commands — Organization Management API (requires --org-key)
```

## Tech Stack

- **TypeScript** (ESM, strict mode)
- **Node.js 18+** (target node18 in tsup)
- **Commander.js** — CLI framework
- **Zod** — Input validation (shared between CLI and MCP)
- **@modelcontextprotocol/sdk** — MCP server
- **tsup** — Bundler (two entry points: index.ts, mcp.ts)
- **vitest** — Testing

## Development Commands

```bash
bun run build      # Build with tsup → dist/
bun run dev        # Run CLI with tsx (no build needed)
bun test           # Run vitest
bun run typecheck  # TypeScript type checking
```

## API Quirks

- **Auth header is `X-API-KEY`** (not Bearer token)
- **Base URL:** `https://api.heyreach.io/api/public/`
- **Most list endpoints use POST** (not GET) — body contains offset/limit/filters
- **Pagination:** POST body `{ offset, limit }` → response `{ totalCount, items[] }`
- **MyNetwork endpoints use `pageNumber`/`pageSize`** instead of offset/limit
- **Rate limit:** 300 requests/minute (429 on exceed)
- **Dual API keys:** Workspace key (regular endpoints) vs Organization key (`org` group)
- **Organization API** has its own separate 300 req/min limit
- **V2 endpoints** (AddLeadsToCampaignV2, AddLeadsToListV2) return detailed counts; V1 returns just a number. CLI uses V2.

## Adding New Commands

1. Create `src/commands/<group>/<subcommand>.ts`
2. Export a `CommandDefinition` object following existing patterns
3. Import and add it to the group's `index.ts`
4. Add the group to `allCommands` in `src/commands/index.ts` (if new group)
5. Build and test: `bun run build && bun test`

Use `executeCommand()` from `src/core/handler.ts` as the handler for standard endpoints. Write custom handlers when the API requires special request transformation (e.g., splitting comma-separated CLI strings into arrays, nested filter objects).

## Important Conventions

- **All output is JSON to stdout** — never use console.log for anything except structured output. Use console.error for errors.
- **Zod validation runs before API calls** — gives clear validation errors
- **Org commands auto-use org API key** — the `registerCommand()` function detects `group === 'org'` and uses `resolveOrgAuth()` instead of `resolveAuth()`
- **Comma-separated CLI inputs** → Arrays are accepted as comma-separated strings (e.g., `--statuses "IN_PROGRESS,PAUSED"`) and split in the handler
- **JSON inputs** → Complex nested objects use `--xxx-json` flags (e.g., `--leads-json`, `--tags-json`, `--permissions-json`)

## Do Not

- Do not modify the output format — agents depend on JSON to stdout
- Do not add interactive prompts to API commands — only login should be interactive
- Do not create new command files without adding them to the group index and allCommands array
- Do not use `Authorization: Bearer` — HeyReach uses `X-API-KEY` header
