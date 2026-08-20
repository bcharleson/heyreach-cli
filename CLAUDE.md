# Claude Code Instructions — HeyReach CLI

## Project Overview

CLI and MCP server for the [HeyReach](https://heyreach.io) LinkedIn automation platform. **0.2.2** wraps the May public-API surface plus fail-closed agency profiles (`--profile` loads the key, `--workspace` confirms writes). Not full Postman coverage (82 endpoints). Inbox V3, per-campaign stats, org LinkedIn account move, account-login API, and email enrichment are out of this cut.

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
- `src/core/auth.ts` — API key resolution (`--api-key` → env → cwd `.env` → config; `--profile` / `HEYREACH_PROFILE` wins over env and `.env`). Supports both workspace and org keys.
- `src/core/output.ts` — JSON output formatting, --fields, --quiet, --pretty
- `src/core/errors.ts` — Typed error classes (AuthError, WorkspaceMismatchError, RateLimitError, etc.)
- `src/core/config.ts` — ~/.heyreach/config.json manager (mode 0600 on every write)
- `src/core/profiles.ts` — ~/.heyreach/profiles/<slug>.json (dir 0700, files 0600)
- `src/core/command-context.ts` — fail-closed workspace gate (bound numeric id; no live whoami)
- `src/core/mutating.ts` — explicit `mutating` flag; POST lists are reads
- `src/commands/index.ts` — Command registry, auto-registration, login/logout/status/config/profile
- `src/mcp-entry.ts` — MCP server (registers all CommandDefinitions as tools; same resolver)
- `src/program.ts` — CLI factory (`heyreach --version` from package.json via tsup `define`)
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
│   ├── profiles.ts
│   ├── command-context.ts
│   ├── mutating.ts
│   ├── output.ts
│   └── errors.ts
├── commands/
│   ├── index.ts             # Registry + registerAllCommands()
│   ├── campaigns/           # 15 commands (list, get, start, resume, pause, add-leads, stop-lead, get-leads, get-for-lead, create, update-settings, update-sequence, update-accounts, update-schedule, get-sequence)
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
- **Agency profiles** — `--profile` / `HEYREACH_PROFILE` selects one named workspace. Writes require `--workspace` matching the bound numeric id *before* HTTP. CheckApiKey cannot whoami; do not invent a live re-fetch. Confirm `status` (slug, workspace_id, workspace_name) before writes. See [SKILL.md](./SKILL.md).
- **Org commands auto-use org API key** — the `registerCommand()` function detects `group === 'org'` and uses `resolveOrgAuth()` instead of the workspace profile resolver
- **Comma-separated CLI inputs** → Arrays are accepted as comma-separated strings (e.g., `--statuses "IN_PROGRESS,PAUSED"`) and split in the handler
- **JSON inputs** → Complex nested objects use `--xxx-json` flags (e.g., `--leads-json`, `--tags-json`, `--permissions-json`)

## Do Not

- Do not modify the output format — agents depend on JSON to stdout
- Do not add interactive prompts to API commands — only login should be interactive
- Do not create new command files without adding them to the group index and allCommands array
- Do not use `Authorization: Bearer` — HeyReach uses `X-API-KEY` header
