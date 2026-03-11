# HeyReach CLI

**HeyReach in your terminal.** Run LinkedIn automation campaigns, manage leads, lists, conversations, webhooks, and organization settings — from a single command line.

47 commands across 10 API groups. Full coverage of the [HeyReach](https://heyreach.io) Public API. Built for humans, scripts, CI/CD pipelines, and AI agents.

```bash
npm install -g heyreach-cli
```

---

## What is HeyReach?

[HeyReach](https://heyreach.io) is a LinkedIn automation platform for outbound sales and lead generation. It manages:

- **LinkedIn campaigns** — multi-step outreach sequences with connection requests, messages, InMails, profile views, and post likes
- **Lead management** — import, tag, and track prospects across campaigns and lists
- **Multi-account sending** — rotate across multiple LinkedIn accounts within a single campaign
- **Unified inbox** — read and reply to LinkedIn conversations across all connected accounts
- **Webhooks** — real-time event notifications for connection accepts, replies, campaign completions, and more
- **Organization management** — workspaces, users, permissions, and API key management at the org level

## What This CLI Enables

Every action you can take in the HeyReach dashboard, you can do from your terminal:

**Campaign operations** — list, get, pause, resume campaigns. Add leads to campaigns, stop leads mid-sequence, pull lead analytics with status breakdowns.

**Lead lifecycle** — look up any lead by LinkedIn profile URL, manage tags (add, replace, get), and track which campaigns and lists a lead belongs to.

**List management** — create lead and company lists, add/remove leads by ID or profile URL, query companies, and search leads within lists with date filters.

**Inbox management** — browse conversations with filters (account, campaign, tags, seen status), read full chatroom threads, send messages, and mark conversations as seen/unseen.

**Webhooks** — create, update, and delete webhooks for 12 event types including connection requests, message replies, InMail replies, campaign completions, and tag updates.

**Network intelligence** — query a sender's LinkedIn network and check connection status with any lead.

**Organization admin** — manage workspaces, users, API keys, and invite admins/members/managers — all via the Management API.

**AI agent integration** — every command works as both a CLI subcommand and an MCP tool, so AI assistants (Claude, Cursor, Windsurf) can manage your LinkedIn outbound directly.

---

## Install

### npm (recommended)

```bash
npm install -g heyreach-cli
```

### npx (zero-install)

```bash
npx heyreach-cli campaigns list
```

### From source

```bash
git clone https://github.com/bcharleson/heyreach-cli.git
cd heyreach-cli
npm install && npm run build
npm link
```

---

## Authentication

Three ways to authenticate, checked in this order:

1. **`--api-key` flag** — pass on any command: `heyreach campaigns list --api-key <key>`
2. **Environment variable** — `export HEYREACH_API_KEY=your-key`
3. **Stored config** — run `heyreach login` to save your key to `~/.heyreach/config.json`

Get your API key from your HeyReach workspace settings (Settings → Integrations → Public API).

### For AI agents and scripts

Set the environment variable — no interactive prompts, no config files:

```bash
export HEYREACH_API_KEY=your-key
heyreach campaigns list
```

### Interactive login

```bash
heyreach login
# Prompts for your API key, validates it, saves to ~/.heyreach/config.json
```

### Organization API (admin operations)

Organization commands (`heyreach org ...`) require a separate Organization API key:

```bash
export HEYREACH_ORG_API_KEY=your-org-key
heyreach org workspaces --pretty
```

Or: `heyreach login --org` to save the org key, or `--org-key <key>` per-command.

---

## Quick Start

```bash
# Authenticate
heyreach login

# List your campaigns
heyreach campaigns list --pretty

# Get a specific campaign
heyreach campaigns get --campaign-id 12345 --pretty

# List LinkedIn accounts
heyreach accounts list --pretty

# Check lead details
heyreach leads get --profile-url "https://linkedin.com/in/janedoe" --pretty

# Browse inbox
heyreach inbox list --pretty

# Check API key validity
heyreach status
```

---

## Output Formats

Every command outputs JSON by default — ready for piping to `jq`, parsing in scripts, or feeding to other tools.

```bash
# Default: compact JSON
heyreach campaigns list

# Pretty-printed JSON
heyreach campaigns list --pretty

# Select specific fields
heyreach campaigns list --fields "id,name,status"

# Suppress output (exit code only)
heyreach campaigns list --quiet
```

---

## Commands

### Campaigns (8)

Manage LinkedIn outreach campaigns.

```bash
heyreach campaigns list [--keyword <text>] [--statuses <list>] [--account-ids <list>]
heyreach campaigns get --campaign-id <id>
heyreach campaigns resume --campaign-id <id>
heyreach campaigns pause --campaign-id <id>
heyreach campaigns add-leads --campaign-id <id> --leads-json '<json>'
heyreach campaigns stop-lead --campaign-id <id> [--lead-url <url>] [--lead-member-id <id>]
heyreach campaigns get-leads --campaign-id <id> [--time-from <iso>] [--time-to <iso>] [--time-filter <type>]
heyreach campaigns get-for-lead [--email <e>] [--linkedin-id <id>] [--profile-url <url>]
```

**Statuses:** DRAFT, IN_PROGRESS, PAUSED, FINISHED, CANCELED, FAILED, STARTING, SCHEDULED

**Add leads example:**
```bash
heyreach campaigns add-leads --campaign-id 123 --leads-json '[
  {
    "lead": {
      "firstName": "Jane",
      "lastName": "Doe",
      "profileUrl": "https://linkedin.com/in/janedoe",
      "companyName": "Acme Inc",
      "position": "VP Sales"
    },
    "linkedInAccountId": 456
  }
]'
```

### Inbox (4)

Read and respond to LinkedIn conversations.

```bash
heyreach inbox list [--account-ids <list>] [--campaign-ids <list>] [--search <text>] [--tags <list>] [--seen <bool>]
heyreach inbox get --account-id <id> --conversation-id <id>
heyreach inbox send --conversation-id <id> --account-id <id> --message <text> [--subject <text>]
heyreach inbox set-seen --conversation-id <id> --account-id <id> --seen <bool>
```

### LinkedIn Accounts (2)

Manage connected LinkedIn accounts.

```bash
heyreach accounts list [--keyword <text>]
heyreach accounts get --account-id <id>
```

### Lists (9)

Manage lead and company lists.

```bash
heyreach lists list [--keyword <text>] [--list-type <type>] [--campaign-ids <list>]
heyreach lists get --list-id <id>
heyreach lists create --name <name> [--type <USER_LIST|COMPANY_LIST>]
heyreach lists get-leads --list-id <id> [--keyword <text>] [--profile-url <url>]
heyreach lists add-leads --list-id <id> --leads-json '<json>'
heyreach lists delete-leads --list-id <id> --member-ids <list>
heyreach lists delete-leads-by-url --list-id <id> --urls <list>
heyreach lists get-companies --list-id <id> [--keyword <text>]
heyreach lists get-for-lead [--email <e>] [--linkedin-id <id>] [--profile-url <url>]
```

**List types:** USER_LIST (default), COMPANY_LIST

### Stats (1)

Pull campaign analytics.

```bash
heyreach stats overview --start-date <iso> --end-date <iso> [--account-ids <list>] [--campaign-ids <list>]
```

Returns day-by-day and overall stats: profile views, messages sent/replied, connections sent/accepted, InMails, reply rates, and acceptance rates.

### Leads (4)

Look up and tag individual leads.

```bash
heyreach leads get --profile-url <url>
heyreach leads add-tags --tags <list> [--profile-url <url>] [--linkedin-id <id>] [--create-if-missing]
heyreach leads get-tags --profile-url <url>
heyreach leads replace-tags --tags <list> [--profile-url <url>] [--linkedin-id <id>] [--create-if-missing]
```

### Lead Tags (1)

Create workspace-level tags.

```bash
heyreach lead-tags create --tags-json '[{"displayName":"Hot","color":"Red"},{"displayName":"Priority","color":"Blue"}]'
```

**Tag colors:** Blue, Green, Purple, Pink, Red, Cyan, Yellow, Orange

### Webhooks (5)

Subscribe to real-time LinkedIn events.

```bash
heyreach webhooks list
heyreach webhooks get --webhook-id <id>
heyreach webhooks create --name <name> --url <url> --event-type <type> [--campaign-ids <list>]
heyreach webhooks update --webhook-id <id> [--name <n>] [--url <u>] [--event-type <t>] [--active <bool>]
heyreach webhooks delete --webhook-id <id>
```

**Event types:** CONNECTION_REQUEST_SENT, CONNECTION_REQUEST_ACCEPTED, MESSAGE_SENT, MESSAGE_REPLY_RECEIVED, INMAIL_SENT, INMAIL_REPLY_RECEIVED, EVERY_MESSAGE_REPLY_RECEIVED, FOLLOW_SENT, LIKED_POST, VIEWED_PROFILE, CAMPAIGN_COMPLETED, LEAD_TAG_UPDATED

### Network (2)

Query LinkedIn network connections.

```bash
heyreach network list --sender-id <id> [--page <n>] [--page-size <n>]
heyreach network check --sender-account-id <id> [--lead-profile-url <url>] [--lead-linkedin-id <id>]
```

### Organization Management (11)

Manage workspaces, users, and API keys. **Requires Organization API key** (`--org-key` or `HEYREACH_ORG_API_KEY`).

```bash
heyreach org workspaces [--offset <n>] [--limit <n>]
heyreach org create-workspace --name <name> [--seats-limit <n>]
heyreach org update-workspace --workspace-id <id> [--name <n>] [--seats-limit <n>]
heyreach org api-keys --workspace-id <id>
heyreach org create-api-key --workspace-id <id> --type <PUBLIC|N8N|MAKE|ZAPIER|MCP>
heyreach org users [--role <Admin|Member|Manager>] [--invitation-status <list>]
heyreach org get-user --user-id <id>
heyreach org workspace-users --workspace-id <id> [--role <role>]
heyreach org invite-admins --inviter-email <email> --emails <list>
heyreach org invite-members --inviter-email <email> --emails <list> --workspace-ids <list> --permissions-json '<json>'
heyreach org invite-managers --inviter-email <email> --emails <list> --workspace-ids <list>
```

---

## Pagination

Most list endpoints use offset/limit pagination in the POST body:

```bash
# First page (default: offset=0, limit=100)
heyreach campaigns list

# Second page
heyreach campaigns list --offset 100 --limit 100

# Smaller pages
heyreach campaigns list --offset 0 --limit 25
```

Response format: `{ "totalCount": 250, "items": [...] }`

**Exception:** Network commands use `--page` and `--page-size` instead of offset/limit.

---

## Common Workflows

### Launch a LinkedIn campaign with leads

```bash
# 1. Create a lead list
LIST=$(heyreach lists create --name "Q2 Prospects" | jq -r '.id')

# 2. Add leads to the list
heyreach lists add-leads --list-id "$LIST" --leads-json '[
  {"firstName":"Alex","lastName":"Chen","profileUrl":"https://linkedin.com/in/alexchen","companyName":"TechCo","position":"CTO"},
  {"firstName":"Sarah","lastName":"Kim","profileUrl":"https://linkedin.com/in/sarahkim","companyName":"StartupXYZ","position":"VP Sales"}
]'

# 3. Add leads to a campaign (assumes campaign already exists)
heyreach campaigns add-leads --campaign-id 12345 --leads-json '[
  {"lead":{"profileUrl":"https://linkedin.com/in/alexchen"}},
  {"lead":{"profileUrl":"https://linkedin.com/in/sarahkim"}}
]'

# 4. Resume the campaign
heyreach campaigns resume --campaign-id 12345
```

### Monitor replies and conversations

```bash
# Check for new conversations
heyreach inbox list --seen false --pretty

# Read a specific conversation
heyreach inbox get --account-id 456 --conversation-id "conv-abc" --pretty

# Reply to a conversation
heyreach inbox send --conversation-id "conv-abc" --account-id 456 --message "Thanks for connecting!"

# Mark as seen
heyreach inbox set-seen --conversation-id "conv-abc" --account-id 456 --seen true
```

### Tag and track leads

```bash
# Look up a lead
heyreach leads get --profile-url "https://linkedin.com/in/janedoe" --pretty

# Add tags
heyreach leads add-tags --profile-url "https://linkedin.com/in/janedoe" --tags "hot,enterprise" --create-if-missing

# See which campaigns they're in
heyreach campaigns get-for-lead --profile-url "https://linkedin.com/in/janedoe" --pretty

# See which lists they're on
heyreach lists get-for-lead --profile-url "https://linkedin.com/in/janedoe" --pretty
```

### Set up webhooks for real-time events

```bash
# Create a webhook for new replies
heyreach webhooks create --name "Reply Notifications" \
  --url "https://your-endpoint.com/heyreach-hook" \
  --event-type MESSAGE_REPLY_RECEIVED

# Create a webhook for connection accepts
heyreach webhooks create --name "Connection Accepts" \
  --url "https://your-endpoint.com/heyreach-hook" \
  --event-type CONNECTION_REQUEST_ACCEPTED \
  --campaign-ids "123,456"

# List all webhooks
heyreach webhooks list --pretty
```

### Pull campaign analytics

```bash
# Overall stats for last 30 days
heyreach stats overview \
  --start-date "2025-01-01T00:00:00Z" \
  --end-date "2025-01-31T23:59:59Z" \
  --pretty

# Stats for specific campaigns
heyreach stats overview \
  --start-date "2025-01-01T00:00:00Z" \
  --end-date "2025-01-31T23:59:59Z" \
  --campaign-ids "123,456" \
  --pretty
```

### Organization administration

```bash
# List workspaces (requires org key)
export HEYREACH_ORG_API_KEY=your-org-key
heyreach org workspaces --pretty

# Create a new workspace
heyreach org create-workspace --name "Sales Team" --seats-limit 10

# Invite a member with specific permissions
heyreach org invite-members \
  --inviter-email "admin@company.com" \
  --emails "newuser@company.com" \
  --workspace-ids "123" \
  --permissions-json '{"viewCampaigns":true,"viewLeadLists":true,"viewLinkedInSenderInboxes":true}'

# Generate an API key for a workspace
heyreach org create-api-key --workspace-id 123 --type PUBLIC
```

---

## MCP Server

The CLI doubles as an [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server, giving AI assistants direct access to all 47 HeyReach tools as native function calls.

```bash
heyreach mcp
```

### What this means

When you configure `heyreach mcp` as an MCP server in Claude, Cursor, VS Code, or Windsurf, your AI assistant can:

- List and manage LinkedIn campaigns mid-conversation
- Look up leads, check tags, and browse conversations on demand
- Send LinkedIn messages and manage inbox directly
- Create webhooks and monitor campaign analytics
- Handle org-level admin tasks (workspaces, users, API keys)

Every `CommandDefinition` in the codebase powers both a CLI subcommand and an MCP tool — one source of truth, two interfaces.

### Configuration

Add to your MCP settings (Claude Desktop, Cursor, VS Code, Windsurf):

```json
{
  "mcpServers": {
    "heyreach": {
      "command": "npx",
      "args": ["heyreach-cli", "mcp"],
      "env": {
        "HEYREACH_API_KEY": "your-api-key"
      }
    }
  }
}
```

This registers 47 tools across 10 groups:

| Group | Tools | Examples |
|-------|-------|---------|
| Campaigns | 8 | `campaigns_list`, `campaigns_resume`, `campaigns_add_leads` |
| Inbox | 4 | `inbox_list`, `inbox_get`, `inbox_send`, `inbox_set_seen` |
| Accounts | 2 | `accounts_list`, `accounts_get` |
| Lists | 9 | `lists_list`, `lists_create`, `lists_add_leads`, `lists_get_companies` |
| Stats | 1 | `stats_overview` |
| Leads | 4 | `leads_get`, `leads_add_tags`, `leads_get_tags`, `leads_replace_tags` |
| Lead Tags | 1 | `lead_tags_create` |
| Webhooks | 5 | `webhooks_create`, `webhooks_list`, `webhooks_update`, `webhooks_delete` |
| Network | 2 | `network_list`, `network_check` |
| Org | 11 | `org_workspaces`, `org_users`, `org_invite_members`, `org_create_api_key` |

---

## API Reference

- **Base URL:** `https://api.heyreach.io/api/public/`
- **Auth header:** `X-API-KEY` (not Bearer token)
- **Rate limit:** 300 requests/minute (Organization API has its own separate 300 req/min limit)
- **Pagination:** POST body `{ offset, limit }` → response `{ totalCount, items[] }`
- **Max items per request:** 100 (1000 for lead/company list queries)

Full API docs: [HeyReach API Documentation](https://documenter.getpostman.com/view/23808049/2sA2xb5F75)

---

## Architecture

Every command is a `CommandDefinition` — one source of truth powering both the CLI subcommand and the MCP tool:

```
src/
├── core/
│   ├── types.ts      # CommandDefinition interface
│   ├── client.ts     # HTTP client (X-API-KEY, retry, rate limit, pagination)
│   ├── auth.ts       # API key resolution (flag → env → config)
│   ├── config.ts     # ~/.heyreach/ config management
│   ├── errors.ts     # Typed error classes
│   ├── output.ts     # JSON output formatting
│   └── handler.ts    # Request builder from CommandDefinition
├── commands/
│   ├── campaigns/    # 8 commands
│   ├── inbox/        # 4 commands
│   ├── accounts/     # 2 commands
│   ├── lists/        # 9 commands
│   ├── stats/        # 1 command
│   ├── leads/        # 4 commands
│   ├── lead-tags/    # 1 command
│   ├── webhooks/     # 5 commands
│   ├── network/      # 2 commands
│   └── org/          # 11 commands
├── mcp-entry.ts      # MCP server (auto-registers all commands)
└── index.ts          # CLI entry point
```

Adding a new API endpoint = creating one file. It's automatically available in both CLI and MCP.

### HTTP Client Features

- **Auto-retry** with exponential backoff on 429 (rate limit) and 5xx errors
- **Rate limit awareness** — respects `Retry-After` headers
- **Offset/limit pagination** — handles HeyReach's POST body pagination pattern
- **30-second timeout** with configurable retries (default: 3)
- **Typed errors** — `AuthError`, `NotFoundError`, `RateLimitError`, `ValidationError`, `ServerError`

---

## Development

```bash
git clone https://github.com/bcharleson/heyreach-cli.git
cd heyreach-cli
bun install

bun run dev -- campaigns list    # Run in dev mode (tsx)
bun run build                    # Build with tsup
bun run typecheck                # Type-check (tsc --noEmit)
bun test                         # Run tests (vitest)
```

### Tech Stack

- **TypeScript** (ESM, strict mode)
- **Node.js 18+**
- **Commander.js** — CLI framework
- **Zod** — schema validation (shared between CLI and MCP)
- **@modelcontextprotocol/sdk** — MCP server
- **tsup** — bundler
- **vitest** — test runner

---

## License

MIT
