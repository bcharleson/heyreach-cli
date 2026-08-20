# Changelog

## 0.2.2

Agency profiles for the existing May public-API surface. npm already has 0.2.1 without `--profile`; this release is the first publishable cut with fail-closed isolation.

**This release is agency rails, not full API coverage.** HeyReach Postman now documents 82 endpoints. This CLI still covers the May surface (campaigns, lists, inbox V2, accounts, leads, webhooks, network, org management, overall stats) plus named profiles. Not claimed: Inbox V3, per-campaign stats, org LinkedIn account move, account-login API, email enrichment — those are 0.2.3 later. No new API commands in 0.2.2.

- `--profile` / `HEYREACH_PROFILE` loads one workspace key (`~/.heyreach/profiles/<slug>.json`, mode 0600)
- `--workspace <numeric id>` confirms writes only; missing or mismatched id aborts before HTTP (`WORKSPACE_MISMATCH`)
- `GET /auth/CheckApiKey` cannot whoami — `login --profile` requires `--workspace`
- POST list/read endpoints are not writes and do not require `--workspace`
- No `--all-profiles`. One process, one profile
- Default single-key path (`heyreach login` / `HEYREACH_API_KEY`) is unchanged
- `heyreach --version` matches `package.json` (0.2.2)

## 0.2.1

Published on npm. Single workspace key (`--api-key` / `HEYREACH_API_KEY` / `~/.heyreach/config.json`). No `--profile`, no bound workspace id, no fail-closed write gate.
