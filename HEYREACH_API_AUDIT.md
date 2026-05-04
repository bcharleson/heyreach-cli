# HeyReach Public API — Independent Audit & Strategic Recommendations

**Auditor:** Brandon Charleson — author of [`heyreach-cli`](https://www.npmjs.com/package/heyreach-cli) (CLI + MCP wrapper for the HeyReach Public API)
**Audit date:** 2026-05-04
**API base:** `https://api.heyreach.io/api/public/`
**Scope:** Every documented endpoint plus undocumented endpoints discovered during integration testing. Live calls executed against a production workspace.

---

## Executive Summary

Building `heyreach-cli` (54 commands across 10 groups, now used by AI agents via MCP) surfaced a handful of **real-world quality issues** in the HeyReach Public API that are invisible from the outside but actively painful for anyone integrating programmatically. None of them are show-stoppers. All of them are 1–4 hour fixes for the team that owns the API and its Swashbuckle layer.

The API is fundamentally solid. What's missing is **the polish that turns a "working" API into one that AI agents and SaaS integrators can adopt with confidence.**

| # | Issue | Severity | Effort to fix |
|---|---|---|---|
| 1 | `StartCampaign` endpoint is undocumented | **High** | ~30 min (just publish the spec) |
| 2 | Swagger UI returns a redirect loop | **High** | ~1 hr (Swashbuckle config) |
| 3 | `Resume` rejects DRAFT campaigns with a misleading error | **Medium** | ~30 min (better message) |
| 4 | No `Delete` / `Stop` / `Cancel` endpoint for campaigns | **Medium** | ~1 day (depends on data model) |
| 5 | Sequence validator error messages are cryptic | **Medium** | ~2 hr (improve validator output) |
| 6 | Campaigns silently auto-pause when list is empty | **Low** | ~1 hr (return a hint in `Resume` response) |
| 7 | V1 lead-adding endpoints still in docs alongside V2 | **Low** | ~15 min (mark V1 deprecated) |

---

## Detailed Findings

### 1. Undocumented `StartCampaign` endpoint — High severity

**What I found:**
The official Postman collection lists `POST /campaign/Resume` as the way to "activate" a campaign. In practice, calling `Resume` on a freshly created (DRAFT) campaign returns:

```json
{ "errorMessage": "The campaign you are trying to resume is not paused, finished or failed." }
```

After probing, I discovered the real activation endpoint:

```
POST /campaign/StartCampaign?campaignId={id}
```

It works perfectly — DRAFT campaigns transition to IN_PROGRESS as expected — but it is **completely absent** from your Postman documentation, your Swagger UI, and your help-center articles.

**Impact:**
Anyone building a programmatic campaign-creation flow (which is exactly the use case that AI agents and your customers building internal tooling want most) will hit a wall at the activation step. There is no way to discover this endpoint from your published docs.

**Recommended fix:**
- Add `StartCampaign` to the Postman collection in the **Campaigns** folder
- Add it to the OpenAPI spec served at `/swagger/v1/swagger.json` (it's likely already there if you have `[ApiExplorerSettings]` set correctly)
- Update the help-center article on programmatic campaign creation to include the DRAFT → start → running flow

---

### 2. Swagger UI returns a redirect loop — High severity

**What I found:**

```
$ curl -I https://api.heyreach.io/swagger
HTTP/1.1 301 Moved Permanently
Location: https://api.heyreach.io/swagger/

$ curl -I https://api.heyreach.io/swagger/
HTTP/1.1 301 Moved Permanently
Location: https://api.heyreach.io/swagger
```

Both URLs redirect to each other indefinitely. The OpenAPI JSON itself (`/swagger/v1/swagger.json`) appears unreachable through the public host, which means there is **no machine-readable spec available to integrators**.

**Impact:**
- AI agents and code-generation tools (OpenAPI Generator, NSwag, Kiota) cannot auto-generate clients
- Integrators have no way to verify request/response shapes outside of trial-and-error
- Your own team loses the ability to test the API interactively from the browser

**Recommended fix:**
Standard Swashbuckle setup for ASP.NET Core. In `Program.cs` / `Startup.cs`:

```csharp
app.UseSwagger();
app.UseSwaggerUI(c => {
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "HeyReach Public API v1");
    c.RoutePrefix = "swagger"; // serves UI at /swagger
});
```

The redirect loop almost always comes from a mismatched `RoutePrefix` and a hosting-layer URL rewrite rule. ~1 hour fix from someone familiar with the project.

---

### 3. `Resume` rejects DRAFT with a misleading error — Medium severity

**What I found:**
When `Resume` is called on a DRAFT campaign, the error message is:

> "The campaign you are trying to resume is not paused, finished or failed."

This is technically correct but unhelpful. It does not tell the caller **what to do instead** (i.e., call `StartCampaign`).

**Impact:**
This is the #1 confusion point for anyone building a campaign creation flow. The error sends them back to the docs (which don't list `StartCampaign`), creating a dead end.

**Recommended fix:**
```
"This campaign is in DRAFT status. Use POST /campaign/StartCampaign?campaignId={id} to activate it. The Resume endpoint only works on PAUSED, FINISHED, or FAILED campaigns."
```

Five extra words of context turn a frustrating error into a self-resolving one.

---

### 4. No `Delete` / `Stop` / `Cancel` endpoint for campaigns — Medium severity

**What I found:**
The campaigns API has `Pause` and `Resume`, but no way to permanently remove or cancel a campaign. Once a campaign exists, it exists forever in the workspace.

**Impact:**
- Test campaigns accumulate indefinitely in customer workspaces (I now have ~12 from building the CLI)
- Bulk campaign management scripts (e.g., "delete all campaigns matching pattern X") are impossible
- Workspace cleanup requires manual UI clicks

**Recommended fix:**
Add `POST /campaign/Delete?campaignId={id}` (or `DELETE /campaign/{id}`). Soft-delete is fine — the goal is to give integrators a way to clean up. If hard delete is risky for analytics history, accept that and add a "soft delete / archive" flag instead.

---

### 5. Sequence validator error messages are cryptic — Medium severity

**What I found:**
Building a sequence via `CreateCampaign` with a missing `actionDelay` field returns:

```
"Node at: $.sequence has invalid delay: 00:00:00"
```

The message does not say:
- That `actionDelay` is the field name to set
- That the minimum acceptable value is 3 hours
- That it must be set on **CONNECTION_REQUEST and every END node**

I had to discover all three rules by trial and error.

**Recommended fix:**
```
"Node 'CONNECTION_REQUEST' at sequence root has invalid delay: 00:00:00. Set actionDelay >= 3 and actionDelayUnit = 'HOUR'."
```

Same pattern for END nodes. The validator already knows which node failed — surface that information in the error.

---

### 6. Campaigns silently auto-pause when list is empty — Low severity

**What I found:**
Calling `Resume` on a paused campaign whose lead list is empty returns HTTP 200 success, transitions the campaign to IN_PROGRESS for ~1 second, then silently returns it to PAUSED. The caller has no way to know this happened without polling status afterward.

**Impact:**
Confusing for E2E tests and for any orchestration logic that branches on the response. The "success" response is misleading.

**Recommended fix:**
Either:
- Return `200 { status: "PAUSED", reason: "no_active_leads" }` instead of plain success, or
- Reject the call upfront with `400 "Cannot resume campaign with no active leads"`

The second option is cleaner.

---

### 7. V1 / V2 lead-adding endpoints both documented — Low severity

**What I found:**
The Postman collection lists `AddLeadsToCampaign` and `AddLeadsToCampaignV2` side by side without indicating which to use. Same for `AddLeadsToList` / `V2`. The V2 endpoints return a far better response shape (`{addedLeadsCount, updatedLeadsCount, failedLeadsCount}` vs. just an integer).

**Recommended fix:**
Mark V1 as deprecated in the Postman descriptions and the OpenAPI spec, link to V2 as the recommended replacement.

---

## Strategic Recommendations

### Why this matters more than it looks

HeyReach has built a strong product. The API is a real moat — most LinkedIn automation competitors don't have one, or theirs is half-baked. **The next 24 months of B2B SaaS growth is going to be driven by LLM-powered agents calling APIs**, and HeyReach is positioned to win that wave _if_ the API meets the bar that AI agents need.

That bar is higher than the bar for human integrators. Specifically:

1. **Every endpoint must be discoverable from a single source of truth** (Swagger / OpenAPI). Agents can't read marketing pages or Notion docs.
2. **Every error must tell the agent what to do next.** Humans can Google; agents can only read what you returned.
3. **Every state transition must be observable.** Silent auto-pauses break agentic loops.

The findings above are mostly small fixes that close exactly these gaps.

### Suggested prioritization

| Quarter | Investment | Outcome |
|---|---|---|
| Q2 | Fix Swagger UI + publish OpenAPI spec + document `StartCampaign` | Unblocks every code-gen tool and AI agent today |
| Q2 | Improve sequence validator error messages + Resume error message | Cuts integration support burden by an estimated 30–50% |
| Q3 | Add `DeleteCampaign` endpoint | Removes the most common "this is annoying" complaint from power users |
| Q3 | Publish an `agents.md` / `llms.txt` style file at `https://api.heyreach.io/llms.txt` describing the full API in agent-friendly terms | Makes HeyReach the obvious choice when an AI agent needs LinkedIn outreach |

### MCP / agent-native positioning

I built `heyreach-cli` partly as a CLI and partly as an MCP server. The MCP server exposes all 54 commands as tools that Claude, Cursor, and other agents can call directly. **Adoption signal:** in the first 90 days, the MCP path has been the more interesting one — agents are using it to build campaigns end-to-end without human intervention.

If HeyReach published an official MCP server (or simply blessed an existing one), it would be the first LinkedIn outreach platform to do so. That's a defensible "first mover in the AI agent era" position that's worth more than another paid feature.

---

## What I'm not going to charge for

I'm sharing this audit at no cost because I'm invested in HeyReach winning. For context, an equivalent strategic API audit from a consultancy typically runs **$8,000–$25,000** depending on scope — covering endpoint coverage, error-message review, OpenAPI hygiene, and a written deliverable like this one. Independent senior engineers usually charge **$3,000–$7,500** for the same work.

I'd rather see these fixes shipped than invoice for them. If any of the findings need clarification, deeper investigation, or example fixes in the Swashbuckle layer, I'm happy to jump on a call with the API team.

---

## Appendix: Live evidence

All findings were verified against `https://api.heyreach.io/api/public/` on 2026-05-04 with a workspace API key. Reproduction commands and raw responses are available on request.

— Brandon

