import { describe, expect, it } from 'vitest';
import { isMutatingCommand } from '../../src/core/mutating.js';
import { campaignsListCommand } from '../../src/commands/campaigns/list.js';
import { campaignsPauseCommand } from '../../src/commands/campaigns/pause.js';
import { campaignsCreateCommand } from '../../src/commands/campaigns/create.js';
import { inboxListCommand } from '../../src/commands/inbox/list.js';
import { accountsListCommand } from '../../src/commands/accounts/list.js';
import { listsListCommand } from '../../src/commands/lists/list.js';
import { statsOverviewCommand } from '../../src/commands/stats/overview.js';
import { webhooksDeleteCommand } from '../../src/commands/webhooks/delete.js';
import { listsDeleteLeadsCommand } from '../../src/commands/lists/delete-leads.js';

describe('isMutatingCommand', () => {
  it('POST list/read does not require --workspace (not mutating)', () => {
    expect(isMutatingCommand(campaignsListCommand)).toBe(false);
    expect(isMutatingCommand(inboxListCommand)).toBe(false);
    expect(isMutatingCommand(accountsListCommand)).toBe(false);
    expect(isMutatingCommand(listsListCommand)).toBe(false);
    expect(isMutatingCommand(statsOverviewCommand)).toBe(false);
  });

  it('explicit writes and DELETE/PATCH are mutating', () => {
    expect(campaignsPauseCommand.mutating).toBe(true);
    expect(campaignsCreateCommand.mutating).toBe(true);
    expect(isMutatingCommand(campaignsPauseCommand)).toBe(true);
    expect(isMutatingCommand(webhooksDeleteCommand)).toBe(true);
    expect(isMutatingCommand(listsDeleteLeadsCommand)).toBe(true);
  });
});
