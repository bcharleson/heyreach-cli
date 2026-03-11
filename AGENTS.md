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

## Discovering Commands

```bash
# List all command groups
heyreach --help

# List subcommands in a group
heyreach campaigns --help

# Get help for a specific subcommand (shows options + examples)
heyreach campaigns list --help
```

## All Command Groups

### campaigns (8 commands)
Manage LinkedIn outreach campaigns — list, get, pause, resume, add leads, stop leads, pull lead analytics.

```
list          List campaigns (paginated, filterable by keyword/status/account)
get           Get a campaign by ID
resume        Resume a paused campaign
pause         Pause a running campaign
add-leads     Add leads to a campaign (V2 — returns added/updated/failed counts)
stop-lead     Stop a lead's progression in a campaign
get-leads     Get leads from a campaign with status breakdowns
get-for-lead  Find which campaigns a lead is enrolled in
```

### inbox (4 commands)
Read and respond to LinkedIn conversations across all connected accounts.

```
list      List conversations (filter by account, campaign, tags, seen status, search)
get       Get a conversation with all messages by account ID + conversation ID
send      Send a message to a LinkedIn conversation
set-seen  Mark a conversation as seen or unseen
```

### accounts (2 commands)
Manage connected LinkedIn accounts.

```
list  List all LinkedIn accounts (paginated, searchable)
get   Get a LinkedIn account by ID
```

### lists (9 commands)
Manage lead and company lists.

```
list                List all lists (filter by type, keyword, campaign)
get                 Get a list by ID
create              Create an empty lead or company list
get-leads           Get leads from a list (up to 1000 per request)
add-leads           Add leads to a list (V2 — returns detailed counts)
delete-leads        Delete leads from a list by LinkedIn member IDs
delete-leads-by-url Delete leads from a list by LinkedIn profile URLs
get-companies       Get companies from a company list
get-for-lead        Find which lists a lead belongs to
```

### stats (1 command)
Pull campaign analytics with day-by-day breakdown.

```
overview  Overall stats for date range (profile views, messages, connections, reply rates)
```

### leads (4 commands)
Look up and tag individual leads.

```
get          Get lead details by LinkedIn profile URL
add-tags     Add tags to a lead (existing tags unchanged)
get-tags     Get tags for a lead (alphabetically sorted)
replace-tags Remove all existing tags and replace with new tags
```

### lead-tags (1 command)
Create workspace-level tags.

```
create  Create one or multiple tags with display name and color
```

### webhooks (5 commands)
Subscribe to real-time LinkedIn events.

```
create  Create a webhook for a specific event type
get     Get a webhook by ID
list    List all webhooks (paginated)
update  Update webhook configuration (name, URL, event type, active status)
delete  Delete a webhook
```

### network (2 commands)
Query LinkedIn network connections.

```
list   Get network connections for a LinkedIn sender (uses pageNumber/pageSize pagination)
check  Check if a lead is connected to a specific sender
```

### org (11 commands)
Organization management — requires Organization API key.

```
workspaces       List all workspaces
create-workspace Create a new workspace
update-workspace Update workspace name or seat limit
api-keys         Get API/integration keys for a workspace
create-api-key   Generate a new API key (PUBLIC, N8N, MAKE, ZAPIER, MCP)
users            List all org users (filter by role, invitation status)
get-user         Get user details by ID
workspace-users  List users in a specific workspace
invite-admins    Invite users as organization admins
invite-members   Invite users with specific workspace permissions
invite-managers  Invite external managers with workspace access
```

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
# Last 30 days overall stats
heyreach stats overview \
  --start-date "2025-01-01T00:00:00Z" \
  --end-date "2025-01-31T23:59:59Z" \
  --pretty
# → { byDayStats: {...}, overallStats: { messagesSent, totalMessageReplies, ... } }
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

**Max items per request:** 100 (1000 for lead/company list queries)

**Exception:** Network commands use `--page` and `--page-size` instead of offset/limit.

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
