---
name: heyreach-cli
description: Use the HeyReach CLI and MCP server for LinkedIn campaigns, leads, lists, inbox, and webhooks. Name every client as a profile. Confirm status (slug, workspace_id, workspace_name) before writes. One process, one profile.
---

# HeyReach CLI — agent skill

Public CLI (`npm i -g heyreach-cli`). JSON on stdout. Node.js 18+.

**Name every client as a profile.** Confirm `status` / `whoami` (`profile`, `workspace_id`, `workspace_name`, `source`) before any write. One process, one profile. Never print or commit raw API keys.

HeyReach `GET /auth/CheckApiKey` is valid/invalid only. There is no live workspace whoami from a workspace public key. Bind the numeric `--workspace` id at login.

## Default: one workspace (existing npm users)

`--profile` is **not** required for old single-key users.

Resolve order **without** `--profile` / `HEYREACH_PROFILE`:

1. `--api-key`
2. `HEYREACH_API_KEY`
3. cwd `.env` `HEYREACH_API_KEY`
4. `~/.heyreach/config.json` from `heyreach login`

`heyreach login` writes `{ api_key }` to `~/.heyreach/config.json` (mode 0600). Pass `--workspace <id>` (and optional `--workspace-name`) to stamp the bound pair. `status` / `whoami` print `profile: "default"` plus that pair — never `api_key`.

```bash
export HEYREACH_API_KEY="your-key"
heyreach status
# confirm profile, workspace_id, workspace_name, then:
heyreach campaigns list
```

When `--workspace` is passed on this path and a bound id exists, they must match or the command aborts. Omitted: no extra flag required.

## Agency: name every client (including the house org)

Agencies should `login --profile <slug>` for **every** key, including the house org. The slug is the client name agents use.

`~/.heyreach/profiles/<slug>.json` = `{ api_key, workspace_id, workspace_name }` (mode 0600). CheckApiKey cannot whoami, so `--workspace <id>` is required.

```bash
heyreach login --profile client-a --api-key "$CLIENT_A_KEY" --workspace 1001 --workspace-name "Client A"
heyreach login --profile client-b --api-key "$CLIENT_B_KEY" --workspace 2002 --workspace-name "Client B"
# does not write or overwrite ~/.heyreach/config.json
# never stores org_api_key in a client profile

export HEYREACH_PROFILE=client-a
heyreach status
# confirm slug + workspace_id + workspace_name, then:
heyreach campaigns list
```

Or per command: `--profile client-a`.

**Hard rails**

- One process, one profile. No `--all-profiles`. No `WORKSPACE_KEYS`. Do not iterate `~/.heyreach/profiles`.
- When a profile is selected, it wins over a leftover cwd `.env` `HEYREACH_API_KEY`.
- Writes under `--profile` require `--workspace <that same numeric id>` (CLI) or `workspace_id` (MCP) **before** any HeyReach HTTP mutation.
- Missing or mismatched `--workspace` aborts (`VALIDATION_ERROR` / `WORKSPACE_MISMATCH`).
- POST list/read commands (campaigns list, inbox list, accounts list, …) do **not** require `--workspace`.
- `profile list` / `status` / `whoami` always return `profile` (slug or `default`), `workspace_id`, `workspace_name`, `source`. They never print the API key (no prefix).

```bash
heyreach --profile client-a --workspace 1001 campaigns pause --campaign-id 12345
```

## Profile commands

```bash
heyreach profile add client-a --api-key "$CLIENT_A_KEY" --workspace 1001 --workspace-name "Client A"
heyreach profile list
heyreach profile whoami
heyreach profile remove client-a
```

`logout` without `--profile` clears only `config.json`. `logout --profile client-a` removes only that profile file.

## MCP

One MCP server process per profile. Set `HEYREACH_PROFILE=client-a` (or `HEYREACH_API_KEY` for the default single-key workspace). Every tool description says pass `profile` for agency. Mutating tools require `profile` + `workspace_id` matching the bound pair. Call `status` first. There is no “run across all profiles” tool.

```json
{
  "mcpServers": {
    "heyreach-client-a": {
      "command": "npx",
      "args": ["heyreach-cli", "mcp"],
      "env": { "HEYREACH_PROFILE": "client-a" }
    }
  }
}
```

## Discover commands

```bash
heyreach --help
heyreach campaigns --help
heyreach campaigns create --help
```

Parse JSON. Exit 0 = success, 1 = error. Use `--fields` to shrink output.

Examples use `client-a` / `client-b` and numeric ids `1001` / `2002` only — no real workspace ids or API keys.
