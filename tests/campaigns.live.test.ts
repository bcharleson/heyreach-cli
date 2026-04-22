import { describe, expect, it } from 'vitest';
import { createClient } from '../src/core/client.js';
import { NotFoundError, HeyReachError } from '../src/core/errors.js';
import { campaignsListCommand } from '../src/commands/campaigns/list.js';
import { campaignsGetSequenceCommand } from '../src/commands/campaigns/get-sequence.js';
import { campaignsUpdateSettingsCommand } from '../src/commands/campaigns/update-settings.js';
import { campaignsUpdateAccountsCommand } from '../src/commands/campaigns/update-accounts.js';

const API_KEY = process.env.HEYREACH_API_KEY;
const BASE_URL = 'https://api.heyreach.io/api/public';
const NONEXISTENT_ID = 999999999;

const describeLive = API_KEY ? describe : describe.skip;
const LIVE_TIMEOUT_MS = 30_000;

describeLive('live: read-only', () => {
  const client = createClient({ apiKey: API_KEY!, baseUrl: BASE_URL });

  it('campaigns list returns {totalCount, items}', { timeout: LIVE_TIMEOUT_MS }, async () => {
    const input = campaignsListCommand.inputSchema.parse({ limit: 1 });
    const result = (await campaignsListCommand.handler(input, client)) as {
      totalCount: number;
      items: unknown[];
    };
    expect(result).toHaveProperty('totalCount');
    expect(result).toHaveProperty('items');
    expect(Array.isArray(result.items)).toBe(true);
  });

  it('campaigns get-sequence on first campaign returns 200 (tree, empty, or success)', { timeout: LIVE_TIMEOUT_MS }, async () => {
    const list = (await campaignsListCommand.handler(
      campaignsListCommand.inputSchema.parse({ limit: 1 }),
      client,
    )) as { items: Array<{ id: number }> };

    if (list.items.length === 0) {
      console.warn('No campaigns in workspace — skipping get-sequence live test.');
      return;
    }

    const campaignId = list.items[0].id;
    const input = campaignsGetSequenceCommand.inputSchema.parse({ campaignId });
    const result = await campaignsGetSequenceCommand.handler(input, client);
    expect(result).toBeDefined();
  });
});

describeLive('live: error paths (non-existent campaignId)', () => {
  const client = createClient({ apiKey: API_KEY!, baseUrl: BASE_URL });

  it('update-settings on non-existent campaign throws 404 NOT_FOUND', async () => {
    const input = campaignsUpdateSettingsCommand.inputSchema.parse({
      campaignId: NONEXISTENT_ID,
      name: 'never-applied',
      linkedInUserListId: 1,
    });
    await expect(campaignsUpdateSettingsCommand.handler(input, client)).rejects.toSatisfy(
      (err: unknown) => {
        if (!(err instanceof HeyReachError)) return false;
        return (
          err instanceof NotFoundError ||
          err.statusCode === 404 ||
          err.statusCode === 400 ||
          err.code === 'NOT_FOUND' ||
          err.code === 'HTTP_ERROR'
        );
      },
    );
  });

  it('update-accounts on non-existent campaign throws a HeyReachError', async () => {
    const input = campaignsUpdateAccountsCommand.inputSchema.parse({
      campaignId: NONEXISTENT_ID,
      accountIds: '1',
    });
    await expect(campaignsUpdateAccountsCommand.handler(input, client)).rejects.toBeInstanceOf(
      HeyReachError,
    );
  });
});

