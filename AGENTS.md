# AI Agent Guide — HeyReach CLI

> This file helps AI agents (GPT, Claude, Gemini, open-source models, etc.) install, authenticate, and use the HeyReach CLI to manage LinkedIn automation campaigns, leads, lists, conversations, and more via the HeyReach platform.

## Quick Start

```bash
# Install globally
npm install -g heyreach-cli

# Authenticate (non-interactive — best for agents)
export HEYREACH_API_KEY="your-api-key-here"

# Verify it works
heyreach status

# Or save credentials (validates key before saving)
heyreach login --api-key "your-api-key-here"
```

**Requirements:** Node.js 18+

## Authentication

Set your API key via environment variable — no interactive login needed:

```bash
export HEYREACH_API_KEY="your-api-key-here"
```

Or pass it per-command:

```bash
heyreach campaigns list --api-key "your-api-key-here"
```

Or save it permanently (validates the key first):

```bash
heyreach login --api-key "your-api-key-here"
# → {"success":true,"message":"Credentials saved and verified."}
```

API keys are generated from: HeyReach → Settings → Integrations → Public API

### Organization API (admin commands)

Organization commands (`heyreach org ...`) require a separate Organization API key:

```bash
export HEYREACH_ORG_API_KEY="your-org-api-key-here"
```

Or per-command: `heyreach org workspaces --org-key "your-org-key"`

### Key facts

- Auth header is `X-API-KEY` (not Bearer token)
- API keys never expire but can be deleted/deactivated
- Workspace key and Organization key are separate — each has its own 300 req/min rate limit
- Base URL is fixed: `https://api.heyreach.io/api/public/`
- `heyreach login` validates the key against the API before saving — invalid keys are rejected immediately

## Output Format

All commands output **JSON to stdout** by default — ready for parsing:

```bash
# Default: compact JSON
heyreach campaigns list
# → {"totalCount":5,"items":[{"id":123,"name":"Q1 Outreach","status":"IN_PROGRESS",...}]}

# Pretty-printed JSON
heyreach campaigns list --pretty

# Select specific fields
heyreach campaigns list --fields id,name,status

# Suppress output (exit code only)
heyreach campaigns list --quiet
```

**Exit codes:** 0 = success, 1 = error. Errors go to stderr as JSON:
```json
{"error":"No API key found. Run \"heyreach login\" or set HEYREACH_API_KEY.","code":"AUTH_ERROR"}
```

### Error codes

| Code | Meaning |
|------|---------|
| `AUTH_ERROR` | Missing or invalid API key |
| `NOT_FOUND` | Resource doesn't exist (bad ID, no matching lead, etc.) |
| `VALIDATION_ERROR` | Missing required fields or invalid input |
| `RATE_LIMIT` | 300 req/min exceeded (auto-retried with backoff) |
| `SERVER_ERROR` | HeyReach API error (auto-retried up to 3 times) |
| `HTTP_ERROR` | Other HTTP error |

## Discovering Commands

```bash
# List all command groups
heyreach --help

# List subcommands in a group
heyreach campaigns --help

# Get help for a specific subcommand (shows options + examples)
heyreach campaigns list --help
```

## Complete Command Reference

### campaigns (8 commands)
Manage LinkedIn outreach campaigns.

| Command | Required flags | Optional flags | Description |
|---------|---------------|----------------|-------------|
| `list` | — | `--offset` `--limit` `--keyword` `--statuses` `--account-ids` | List campaigns (paginated) |
| `get` | `--campaign-id` | — | Get campaign by ID |
| `resume` | `--campaign-id` | — | Resume a paused campaign |
| `pause` | `--campaign-id` | — | Pause a running campaign |
| `add-leads` | `--campaign-id` `--leads-json` | `--resume-finished` `--resume-paused` | Add leads (V2, returns counts) |
| `stop-lead` | `--campaign-id` | `--lead-member-id` `--lead-url` | Stop lead progression |
| `get-leads` | `--campaign-id` | `--offset` `--limit` `--time-from` `--time-to` `--time-filter` | Get leads with analytics |
| `get-for-lead` | at least one of: `--email` `--linkedin-id` `--profile-url` | `--offset` `--limit` | Find campaigns for a lead |

### inbox (4 commands)
Read and respond to LinkedIn conversations.

| Command | Required flags | Optional flags | Description |
|---------|---------------|----------------|-------------|
| `list` | — | `--offset` `--limit` `--account-ids` `--campaign-ids` `--search` `--lead-linkedin-id` `--lead-profile-url` `--tags` `--seen` | List conversations |
| `get` | `--account-id` `--conversation-id` | — | Get conversation with messages |
| `send` | `--message` `--conversation-id` `--account-id` | `--subject` | Send a message |
| `set-seen` | `--conversation-id` `--account-id` `--seen` | — | Mark seen/unseen |

### accounts (2 commands)
Manage connected LinkedIn accounts.

| Command | Required flags | Optional flags | Description |
|---------|---------------|----------------|-------------|
| `list` | — | `--offset` `--limit` `--keyword` | List LinkedIn accounts |
| `get` | `--account-id` | — | Get account by ID |

### lists (9 commands)
Manage lead and company lists.

| Command | Required flags | Optional flags | Description |
|---------|---------------|----------------|-------------|
| `list` | — | `--offset` `--limit` `--keyword` `--list-type` `--campaign-ids` | List all lists |
| `get` | `--list-id` | — | Get list by ID |
| `create` | `--name` | `--type` | Create empty list |
| `get-leads` | `--list-id` | `--offset` `--limit` (max 1000) `--keyword` `--profile-url` `--linkedin-id` `--created-from` `--created-to` | Get leads from list |
| `add-leads` | `--list-id` `--leads-json` | — | Add leads (V2, returns counts) |
| `delete-leads` | `--list-id` `--member-ids` | — | Delete by member IDs |
| `delete-leads-by-url` | `--list-id` `--urls` | — | Delete by profile URLs |
| `get-companies` | `--list-id` | `--offset` `--limit` (max 1000) `--keyword` | Get companies from list |
| `get-for-lead` | at least one of: `--email` `--linkedin-id` `--profile-url` | `--offset` `--limit` | Find lists for a lead |

### stats (1 command)
Pull campaign analytics with day-by-day breakdown.

| Command | Required flags | Optional flags | Description |
|---------|---------------|----------------|-------------|
| `overview` | — | `--start-date` `--end-date` `--account-ids` `--campaign-ids` | Stats for date range |

**Note:** `--start-date` and `--end-date` default to the last 30 days if omitted. Just run `heyreach stats overview` for a quick summary.

### leads (4 commands)
Look up and tag individual leads.

| Command | Required flags | Optional flags | Description |
|---------|---------------|----------------|-------------|
| `get` | `--profile-url` | — | Get lead details |
| `add-tags` | `--tags` | `--profile-url` `--linkedin-id` `--create-if-missing` | Add tags to a lead |
| `get-tags` | `--profile-url` | — | Get tags (alphabetical) |
| `replace-tags` | `--tags` | `--profile-url` `--linkedin-id` `--create-if-missing` | Replace all tags |

**Note:** For `add-tags` and `replace-tags`, provide at least one of `--profile-url` or `--linkedin-id`. The `--create-if-missing` flag (default: true) auto-creates tags that don't exist yet.

### lead-tags (1 command)
Create workspace-level tags.

| Command | Required flags | Optional flags | Description |
|---------|---------------|----------------|-------------|
| `create` | `--tags-json` | — | Create tags with name + color |

Example: `heyreach lead-tags create --tags-json '[{"displayName":"Hot Lead","color":"Red"}]'`

### webhooks (5 commands)
Subscribe to real-time LinkedIn events.

| Command | Required flags | Optional flags | Description |
|---------|---------------|----------------|-------------|
| `create` | `--name` `--url` `--event-type` | `--campaign-ids` | Create webhook |
| `get` | `--webhook-id` | — | Get webhook by ID |
| `list` | — | `--offset` `--limit` | List all webhooks |
| `update` | `--webhook-id` | `--name` `--url` `--event-type` `--campaign-ids` `--active` | Update webhook |
| `delete` | `--webhook-id` | — | Delete webhook |

### network (2 commands)
Query LinkedIn network connections.

| Command | Required flags | Optional flags | Description |
|---------|---------------|----------------|-------------|
| `list` | `--sender-id` | `--page` `--page-size` | List connections (pageNumber pagination) |
| `check` | `--sender-id` + one of: `--profile-url` or `--linkedin-id` | — | Check if connected |

**Note:** Network commands use `--page`/`--page-size` instead of `--offset`/`--limit`.

### org (11 commands)
Organization management — requires Organization API key (`--org-key` or `HEYREACH_ORG_API_KEY`).

| Command | Required flags | Optional flags | Description |
|---------|---------------|----------------|-------------|
| `workspaces` | — | `--offset` `--limit` | List all workspaces |
| `create-workspace` | `--name` | `--seats-limit` | Create workspace |
| `update-workspace` | `--workspace-id` | `--name` `--seats-limit` | Update workspace |
| `api-keys` | `--workspace-id` | — | Get API keys for workspace |
| `create-api-key` | `--workspace-id` `--type` | — | Generate new API key |
| `users` | — | `--offset` `--limit` `--role` `--invitation-status` | List all org users |
| `get-user` | `--user-id` | — | Get user details |
| `workspace-users` | `--workspace-id` | `--offset` `--limit` `--role` `--invitation-status` | List workspace users |
| `invite-admins` | `--inviter-email` `--emails` | — | Invite org admins |
| `invite-members` | `--inviter-email` `--emails` `--workspace-ids` `--permissions-json` | — | Invite with permissions |
| `invite-managers` | `--inviter-email` `--emails` `--workspace-ids` | — | Invite external managers |

## Common Workflows

### Find and tag a lead

```bash
# Look up lead details
heyreach leads get --profile-url "https://linkedin.com/in/janedoe" --pretty

# Add tags
heyreach leads add-tags --profile-url "https://linkedin.com/in/janedoe" \
  --tags "hot,enterprise" --create-if-missing

# Check which campaigns they're in
heyreach campaigns get-for-lead --profile-url "https://linkedin.com/in/janedoe" --pretty
```

### Add leads to a campaign

```bash
# Add leads with full profile data
heyreach campaigns add-leads --campaign-id 123 --leads-json '[
  {
    "lead": {
      "firstName": "Jane",
      "lastName": "Doe",
      "profileUrl": "https://linkedin.com/in/janedoe",
      "companyName": "Acme Inc",
      "position": "VP Sales",
      "emailAddress": "jane@acme.com"
    }
  }
]'
# → {"addedLeadsCount":1,"updatedLeadsCount":0,"failedLeadsCount":0}
```

### Monitor inbox for new replies

```bash
# Check for unseen conversations
heyreach inbox list --seen false --pretty

# Read a conversation
heyreach inbox get --account-id 456 --conversation-id "conv-abc" --pretty

# Reply
heyreach inbox send --conversation-id "conv-abc" --account-id 456 \
  --message "Thanks for connecting! Would love to schedule a quick call."

# Mark as seen
heyreach inbox set-seen --conversation-id "conv-abc" --account-id 456 --seen true
```

### Set up event notifications

```bash
# Create a webhook for new message replies
heyreach webhooks create --name "Reply Hook" \
  --url "https://your-endpoint.com/hook" \
  --event-type MESSAGE_REPLY_RECEIVED

# Create a webhook for connection accepts (specific campaigns only)
heyreach webhooks create --name "Connections" \
  --url "https://your-endpoint.com/hook" \
  --event-type CONNECTION_REQUEST_ACCEPTED \
  --campaign-ids "123,456"
```

### Pull analytics

```bash
# Last 30 days overall stats (dates default automatically)
heyreach stats overview --pretty

# Custom date range
heyreach stats overview \
  --start-date "2025-01-01T00:00:00Z" \
  --end-date "2025-01-31T23:59:59Z" \
  --pretty
```

### Manage lists

```bash
# Create a list
heyreach lists create --name "Q2 Targets"

# Add leads
heyreach lists add-leads --list-id 789 --leads-json '[
  {"firstName":"Alex","lastName":"Chen","profileUrl":"https://linkedin.com/in/alexchen"}
]'

# Search leads in a list
heyreach lists get-leads --list-id 789 --keyword "alex" --pretty

# Remove leads by profile URL
heyreach lists delete-leads-by-url --list-id 789 \
  --urls "https://linkedin.com/in/alexchen"
```

### Organization admin

```bash
# List workspaces (requires org key)
heyreach org workspaces --pretty

# Create a workspace with seat limit
heyreach org create-workspace --name "Sales Team" --seats-limit 10

# Invite a member with permissions
heyreach org invite-members \
  --inviter-email "admin@company.com" \
  --emails "user@company.com" \
  --workspace-ids "123" \
  --permissions-json '{"viewCampaigns":true,"editManageCampaigns":true,"viewLeadLists":true}'
```

## Pagination

Most list endpoints use offset/limit in the POST body:

```bash
# First page (defaults: offset=0, limit=100)
heyreach campaigns list

# Next page
heyreach campaigns list --offset 100 --limit 100
```

Response: `{ "totalCount": 250, "items": [...] }`

**Max items per request:** 100 (1000 for `lists get-leads` and `lists get-companies`)

**Exception:** Network commands use `--page` and `--page-size` instead of offset/limit.

## Input Patterns

### Comma-separated lists
Arrays are passed as comma-separated strings:
```bash
--statuses "IN_PROGRESS,PAUSED"
--tags "hot,priority"
--campaign-ids "123,456,789"
--emails "a@co.com,b@co.com"
--urls "https://linkedin.com/in/one,https://linkedin.com/in/two"
```

### JSON inputs
Complex nested data uses `--xxx-json` flags:
```bash
# Lead data for campaigns/lists
--leads-json '[{"lead":{"firstName":"Jane","profileUrl":"..."}}]'

# Tag creation
--tags-json '[{"displayName":"Hot","color":"Red"}]'

# Workspace permissions
--permissions-json '{"viewCampaigns":true,"editManageCampaigns":true}'
```

## Key Enums

**Campaign statuses:** DRAFT, IN_PROGRESS, PAUSED, FINISHED, CANCELED, FAILED, STARTING, SCHEDULED

**Webhook event types:** CONNECTION_REQUEST_SENT, CONNECTION_REQUEST_ACCEPTED, MESSAGE_SENT, MESSAGE_REPLY_RECEIVED, INMAIL_SENT, INMAIL_REPLY_RECEIVED, EVERY_MESSAGE_REPLY_RECEIVED, FOLLOW_SENT, LIKED_POST, VIEWED_PROFILE, CAMPAIGN_COMPLETED, LEAD_TAG_UPDATED

**List types:** USER_LIST, COMPANY_LIST

**Tag colors:** Blue, Green, Purple, Pink, Red, Cyan, Yellow, Orange

**API key types:** PUBLIC, N8N, MAKE, ZAPIER, MCP

**User roles:** Admin, Member, Manager

**Invitation statuses:** Unknown, Pending, Accepted, Expired, Revoked

## MCP Server (for Claude, Cursor, VS Code)

The CLI includes a built-in MCP server exposing all 47 commands as tools:

```bash
heyreach mcp
```

MCP config for your AI assistant:
```json
{
  "mcpServers": {
    "heyreach": {
      "command": "npx",
      "args": ["heyreach-cli", "mcp"],
      "env": {
        "HEYREACH_API_KEY": "your-key"
      }
    }
  }
}
```

## Tips for AI Agents

1. **Always use `--help`** on a group before guessing subcommand names
2. **Parse JSON output** directly — it's the default format
3. **Check exit codes** — 0 means success, 1 means error
4. **Required options** are enforced with clear error messages before API calls
5. **Rate limits** are handled automatically (300 req/min) with exponential backoff retry
6. **Use `--fields`** to reduce output size when you only need specific data
7. **Use `--quiet`** when you only care about success/failure
8. **Use `--pretty`** for human-readable JSON output
9. **Most list endpoints use POST** — the CLI handles this internally, just use the commands
10. **Comma-separated inputs** work for arrays: `--statuses "IN_PROGRESS,PAUSED"`, `--tags "hot,priority"`
11. **JSON inputs** use `--xxx-json` flags: `--leads-json`, `--tags-json`, `--permissions-json`
12. **Org commands need a separate key** — set `HEYREACH_ORG_API_KEY` for `heyreach org ...` commands
13. **Lead lookup is by profile URL** — use `--profile-url` to identify leads across most endpoints
14. **V2 endpoints are used by default** — `add-leads` returns `{addedLeadsCount, updatedLeadsCount, failedLeadsCount}` instead of just a number
15. **Error messages are parsed** — nested API validation errors are extracted into clean, readable messages
16. **Login validates keys** — `heyreach login` checks the key against the API before saving, so a successful login means the key works
