import { beforeAll, describe, expect, it } from 'vitest';
import { createClient } from '../src/core/client.js';
import { HeyReachError } from '../src/core/errors.js';
import { listsListCommand } from '../src/commands/lists/list.js';
import { accountsListCommand } from '../src/commands/accounts/list.js';
import { campaignsCreateCommand } from '../src/commands/campaigns/create.js';
import { campaignsUpdateSettingsCommand } from '../src/commands/campaigns/update-settings.js';
import { campaignsUpdateSequenceCommand } from '../src/commands/campaigns/update-sequence.js';
import { campaignsUpdateAccountsCommand } from '../src/commands/campaigns/update-accounts.js';
import { campaignsUpdateScheduleCommand } from '../src/commands/campaigns/update-schedule.js';
import { campaignsGetSequenceCommand } from '../src/commands/campaigns/get-sequence.js';
import { campaignsGetCommand } from '../src/commands/campaigns/get.js';

const API_KEY = process.env.HEYREACH_API_KEY;
const BASE_URL = 'https://api.heyreach.io/api/public';
const LIVE_TIMEOUT_MS = 60_000;
const NONEXISTENT_ID = 999999999;

const describeE2E = API_KEY ? describe : describe.skip;

type ListItem = { id: number; name: string; listType?: string };
type AccountItem = { id: number; firstName?: string; lastName?: string };

describeE2E('e2e: campaigns lifecycle', () => {
  const client = createClient({ apiKey: API_KEY!, baseUrl: BASE_URL });
  const runStamp = new Date().toISOString().replace(/[:.]/g, '-');

  let userListId: number;
  let primaryAccountId: number;
  let secondaryAccountId: number | null = null;
  let campaignId: number;

  beforeAll(async () => {
    // Discover at least one USER_LIST and one LinkedIn account to work with.
    const listsResult = (await listsListCommand.handler(
      listsListCommand.inputSchema.parse({ limit: 100, listType: 'USER_LIST' }),
      client,
    )) as { items: ListItem[] };

    const userList = listsResult.items.find((l) => (l.listType ?? 'USER_LIST') === 'USER_LIST');
    if (!userList) {
      throw new Error('E2E requires at least one USER_LIST in the workspace. None found.');
    }
    userListId = userList.id;

    const accountsResult = (await accountsListCommand.handler(
      accountsListCommand.inputSchema.parse({ limit: 10 }),
      client,
    )) as { items: AccountItem[] };

    if (accountsResult.items.length === 0) {
      throw new Error('E2E requires at least one connected LinkedIn account. None found.');
    }
    primaryAccountId = accountsResult.items[0].id;
    secondaryAccountId = accountsResult.items[1]?.id ?? null;
  }, LIVE_TIMEOUT_MS);

  it('step 1 — create draft campaign', { timeout: LIVE_TIMEOUT_MS }, async () => {
    const input = campaignsCreateCommand.inputSchema.parse({
      name: `e2e-${runStamp}`.slice(0, 50),
      linkedInUserListId: userListId,
      accountIds: String(primaryAccountId),
      scheduleJson: JSON.stringify({
        dailyStartTime: '09:00:00',
        dailyEndTime: '17:00:00',
        timeZoneId: 'America/New_York',
      }),
      sequenceJson: JSON.stringify({
        nodeType: 'CONNECTION_REQUEST',
        actionDelay: 3,
        actionDelayUnit: 'HOUR',
        payload: {
          messages: ['Hi {{firstName}}, would love to connect.'],
          fallbackMessage: 'Hi there, would love to connect.',
        },
        conditionalNode: {
          nodeType: 'MESSAGE',
          actionDelay: 1,
          actionDelayUnit: 'DAY',
          payload: {
            messages: ['Thanks for connecting, {{firstName}}!'],
            fallbackMessage: 'Thanks for connecting!',
          },
          unconditionalNode: { nodeType: 'END', actionDelay: 3, actionDelayUnit: 'HOUR' },
          conditionalNode: { nodeType: 'END', actionDelay: 3, actionDelayUnit: 'HOUR' },
        },
        unconditionalNode: { nodeType: 'END', actionDelay: 3, actionDelayUnit: 'HOUR' },
      }),
    });
    const result = (await campaignsCreateCommand.handler(input, client)) as { campaignId: number };
    expect(result).toHaveProperty('campaignId');
    expect(typeof result.campaignId).toBe('number');
    campaignId = result.campaignId;
  });

  it('step 2 — update settings (name + exclusions)', { timeout: LIVE_TIMEOUT_MS }, async () => {
    const input = campaignsUpdateSettingsCommand.inputSchema.parse({
      campaignId,
      name: `e2e-updated-${runStamp}`.slice(0, 50),
      linkedInUserListId: userListId,
      excludeContactedFromOtherCampaigns: true,
      excludeHasOtherAccConversations: false,
    });
    await expect(campaignsUpdateSettingsCommand.handler(input, client)).resolves.toBeDefined();
  });

  it('step 3 — update sequence (2-step: connect + follow-up)', { timeout: LIVE_TIMEOUT_MS }, async () => {
    const input = campaignsUpdateSequenceCommand.inputSchema.parse({
      campaignId,
      sequenceJson: JSON.stringify({
        nodeType: 'CONNECTION_REQUEST',
        actionDelay: 3,
        actionDelayUnit: 'HOUR',
        payload: {
          messages: ['e2e-step3-marker: Hi {{firstName}}, saw your work at {{companyName}}.'],
          fallbackMessage: 'e2e-step3-marker: Hi there, would love to connect.',
        },
        conditionalNode: {
          nodeType: 'MESSAGE',
          actionDelay: 2,
          actionDelayUnit: 'DAY',
          payload: {
            messages: ['e2e-step3-marker: Thanks for connecting, {{firstName}}!'],
            fallbackMessage: 'e2e-step3-marker: Thanks for connecting!',
          },
          unconditionalNode: { nodeType: 'END', actionDelay: 3, actionDelayUnit: 'HOUR' },
          conditionalNode: { nodeType: 'END', actionDelay: 3, actionDelayUnit: 'HOUR' },
        },
        unconditionalNode: { nodeType: 'END', actionDelay: 3, actionDelayUnit: 'HOUR' },
      }),
    });
    await expect(campaignsUpdateSequenceCommand.handler(input, client)).resolves.toBeDefined();
  });

  it('step 4a — update accounts', { timeout: LIVE_TIMEOUT_MS }, async () => {
    const accountIds = secondaryAccountId
      ? `${primaryAccountId},${secondaryAccountId}`
      : String(primaryAccountId);
    const input = campaignsUpdateAccountsCommand.inputSchema.parse({ campaignId, accountIds });
    await expect(campaignsUpdateAccountsCommand.handler(input, client)).resolves.toBeDefined();
  });

  it('step 4b — update schedule', { timeout: LIVE_TIMEOUT_MS }, async () => {
    const input = campaignsUpdateScheduleCommand.inputSchema.parse({
      campaignId,
      scheduleJson: JSON.stringify({
        dailyStartTime: '10:00:00',
        dailyEndTime: '16:00:00',
        timeZoneId: 'Europe/London',
        enabledSaturday: false,
      }),
    });
    await expect(campaignsUpdateScheduleCommand.handler(input, client)).resolves.toBeDefined();
  });

  it('step 5 — verify remote state reflects updates', { timeout: LIVE_TIMEOUT_MS }, async () => {
    const campaign = (await campaignsGetCommand.handler(
      campaignsGetCommand.inputSchema.parse({ campaignId }),
      client,
    )) as { id: number; name: string; status?: string };
    expect(campaign.id).toBe(campaignId);
    expect(campaign.name).toContain('e2e-updated-');
    // Campaign must remain in a non-active state (DRAFT / PAUSED / SCHEDULED) after updates.
    if (campaign.status) {
      expect(['DRAFT', 'PAUSED', 'SCHEDULED']).toContain(campaign.status);
    }

    const sequence = (await campaignsGetSequenceCommand.handler(
      campaignsGetSequenceCommand.inputSchema.parse({ campaignId }),
      client,
    )) as Record<string, unknown>;
    expect(sequence).toBeDefined();
    // The sequence should round-trip with a CONNECTION_REQUEST root (ignoring implicit START wrapper)
    // and reflect the step-3 update marker, proving the sequence replacement took effect.
    const serialized = JSON.stringify(sequence);
    expect(serialized).toContain('CONNECTION_REQUEST');
    expect(serialized).toContain('MESSAGE');
    expect(serialized).toContain('e2e-step3-marker');
  });

  it('step 6 — error handling: update on non-existent campaign throws HeyReachError', { timeout: LIVE_TIMEOUT_MS }, async () => {
    const input = campaignsUpdateSettingsCommand.inputSchema.parse({
      campaignId: NONEXISTENT_ID,
      name: 'never-applied',
      linkedInUserListId: userListId,
    });
    await expect(campaignsUpdateSettingsCommand.handler(input, client)).rejects.toBeInstanceOf(
      HeyReachError,
    );
  });
});


