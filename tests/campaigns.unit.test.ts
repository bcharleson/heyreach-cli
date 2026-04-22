import { describe, expect, it, vi } from 'vitest';
import type { HeyReachClient, HeyReachRequestOptions } from '../src/core/types.js';
import { campaignsCreateCommand } from '../src/commands/campaigns/create.js';
import { campaignsUpdateSettingsCommand } from '../src/commands/campaigns/update-settings.js';
import { campaignsUpdateSequenceCommand } from '../src/commands/campaigns/update-sequence.js';
import { campaignsUpdateAccountsCommand } from '../src/commands/campaigns/update-accounts.js';
import { campaignsUpdateScheduleCommand } from '../src/commands/campaigns/update-schedule.js';
import { campaignsGetSequenceCommand } from '../src/commands/campaigns/get-sequence.js';

function mockClient(): { client: HeyReachClient; calls: HeyReachRequestOptions[] } {
  const calls: HeyReachRequestOptions[] = [];
  const client: HeyReachClient = {
    request: vi.fn(async (opts: HeyReachRequestOptions) => {
      calls.push(opts);
      return { ok: true };
    }),
    paginate: vi.fn(),
  };
  return { client, calls };
}

const SEQUENCE = {
  nodeType: 'CONNECTION_REQUEST',
  payload: { messages: ['Hi {{firstName}}'], fallbackMessage: 'Hi there' },
  conditionalNode: { nodeType: 'END' },
  unconditionalNode: { nodeType: 'END' },
};

const SCHEDULE = {
  dailyStartTime: '09:00:00',
  dailyEndTime: '17:00:00',
  timeZoneId: 'America/New_York',
};

describe('campaigns create', () => {
  it('parses sequence-json and schedule-json, splits account-ids, omits undefined optionals', async () => {
    const { client, calls } = mockClient();
    const input = campaignsCreateCommand.inputSchema.parse({
      name: 'Test',
      linkedInUserListId: '789',
      accountIds: '123, 456 ,789',
      sequenceJson: JSON.stringify(SEQUENCE),
      scheduleJson: JSON.stringify(SCHEDULE),
    });
    await campaignsCreateCommand.handler(input, client);

    expect(calls).toHaveLength(1);
    expect(calls[0].method).toBe('POST');
    expect(calls[0].path).toBe('/campaign/Create');
    expect(calls[0].body).toEqual({
      name: 'Test',
      linkedInUserListId: 789,
      linkedInAccountIds: [123, 456, 789],
      sequence: SEQUENCE,
      schedule: SCHEDULE,
    });
    expect(calls[0].body).not.toHaveProperty('excludeContactedFromOtherCampaigns');
    expect(calls[0].body).not.toHaveProperty('excludeListId');
  });

  it('omits sequence and schedule when JSON flags are missing', async () => {
    const { client, calls } = mockClient();
    const input = campaignsCreateCommand.inputSchema.parse({
      name: 'Minimal',
      linkedInUserListId: 1,
      accountIds: '42',
    });
    await campaignsCreateCommand.handler(input, client);
    expect(calls[0].body).not.toHaveProperty('sequence');
    expect(calls[0].body).not.toHaveProperty('schedule');
  });

  it('forwards exclude* booleans (Commander-style presence flags) and excludeListId when provided', async () => {
    const { client, calls } = mockClient();
    // Commander passes `true` for boolean flags when present, `undefined` when absent.
    const input = campaignsCreateCommand.inputSchema.parse({
      name: 'Full',
      linkedInUserListId: 1,
      accountIds: '1',
      excludeContactedFromOtherCampaigns: true,
      excludeHasOtherAccConversations: true,
      excludeListId: '2',
    });
    await campaignsCreateCommand.handler(input, client);
    expect(calls[0].body).toMatchObject({
      excludeContactedFromOtherCampaigns: true,
      excludeHasOtherAccConversations: true,
      excludeListId: 2,
    });
    expect(calls[0].body).not.toHaveProperty('excludeContactedFromSenderInOtherCampaign');
  });

  it('rejects name longer than 50 chars', () => {
    expect(() =>
      campaignsCreateCommand.inputSchema.parse({
        name: 'x'.repeat(51),
        linkedInUserListId: 1,
        accountIds: '1',
      }),
    ).toThrow();
  });

  it('rejects empty name', () => {
    expect(() =>
      campaignsCreateCommand.inputSchema.parse({
        name: '',
        linkedInUserListId: 1,
        accountIds: '1',
      }),
    ).toThrow();
  });

  it('coerces string campaign-id / list-id / exclude-list-id to number', () => {
    const parsed = campaignsCreateCommand.inputSchema.parse({
      name: 'Test',
      linkedInUserListId: '789',
      accountIds: '1',
      excludeListId: '456',
    });
    expect(parsed.linkedInUserListId).toBe(789);
    expect(parsed.excludeListId).toBe(456);
  });
});

describe('campaigns update-settings', () => {
  it('builds body with required fields and omits undefined optionals', async () => {
    const { client, calls } = mockClient();
    const input = campaignsUpdateSettingsCommand.inputSchema.parse({
      campaignId: '123',
      name: 'New Name',
      linkedInUserListId: '789',
    });
    await campaignsUpdateSettingsCommand.handler(input, client);
    expect(calls[0]).toEqual({
      method: 'POST',
      path: '/campaign/UpdateSettings',
      body: { campaignId: 123, name: 'New Name', linkedInUserListId: 789 },
    });
  });
});

describe('campaigns update-sequence', () => {
  it('parses sequence JSON and builds body with only campaignId + sequence', async () => {
    const { client, calls } = mockClient();
    const input = campaignsUpdateSequenceCommand.inputSchema.parse({
      campaignId: '123',
      sequenceJson: JSON.stringify(SEQUENCE),
    });
    await campaignsUpdateSequenceCommand.handler(input, client);
    expect(calls[0]).toEqual({
      method: 'POST',
      path: '/campaign/UpdateSequence',
      body: { campaignId: 123, sequence: SEQUENCE },
    });
  });

  it('rejects missing sequence-json', () => {
    expect(() =>
      campaignsUpdateSequenceCommand.inputSchema.parse({ campaignId: 1 }),
    ).toThrow();
  });
});

describe('campaigns update-accounts', () => {
  it('splits comma-separated account-ids into number[] and trims whitespace', async () => {
    const { client, calls } = mockClient();
    const input = campaignsUpdateAccountsCommand.inputSchema.parse({
      campaignId: '123',
      accountIds: '456, 789 , 101',
    });
    await campaignsUpdateAccountsCommand.handler(input, client);
    expect(calls[0]).toEqual({
      method: 'POST',
      path: '/campaign/UpdateAccounts',
      body: { campaignId: 123, linkedInAccountIds: [456, 789, 101] },
    });
  });
});

describe('campaigns update-schedule', () => {
  it('parses schedule JSON into body.schedule', async () => {
    const { client, calls } = mockClient();
    const input = campaignsUpdateScheduleCommand.inputSchema.parse({
      campaignId: '123',
      scheduleJson: JSON.stringify(SCHEDULE),
    });
    await campaignsUpdateScheduleCommand.handler(input, client);
    expect(calls[0]).toEqual({
      method: 'POST',
      path: '/campaign/UpdateSchedule',
      body: { campaignId: 123, schedule: SCHEDULE },
    });
  });
});

describe('campaigns get-sequence', () => {
  it('uses GET with campaignId as query (not body)', async () => {
    const { client, calls } = mockClient();
    const input = campaignsGetSequenceCommand.inputSchema.parse({ campaignId: '123' });
    await campaignsGetSequenceCommand.handler(input, client);
    expect(calls[0].method).toBe('GET');
    expect(calls[0].path).toBe('/campaign/GetCampaignSequence');
    expect(calls[0].query).toEqual({ campaignId: 123 });
    expect(calls[0].body).toBeUndefined();
  });
});

describe('command metadata', () => {
  it('all six new commands declare correct endpoint paths and methods', () => {
    expect(campaignsCreateCommand.endpoint).toEqual({ method: 'POST', path: '/campaign/Create' });
    expect(campaignsUpdateSettingsCommand.endpoint).toEqual({ method: 'POST', path: '/campaign/UpdateSettings' });
    expect(campaignsUpdateSequenceCommand.endpoint).toEqual({ method: 'POST', path: '/campaign/UpdateSequence' });
    expect(campaignsUpdateAccountsCommand.endpoint).toEqual({ method: 'POST', path: '/campaign/UpdateAccounts' });
    expect(campaignsUpdateScheduleCommand.endpoint).toEqual({ method: 'POST', path: '/campaign/UpdateSchedule' });
    expect(campaignsGetSequenceCommand.endpoint).toEqual({ method: 'GET', path: '/campaign/GetCampaignSequence' });
  });

  it('all six commands belong to the campaigns group', () => {
    for (const cmd of [
      campaignsCreateCommand,
      campaignsUpdateSettingsCommand,
      campaignsUpdateSequenceCommand,
      campaignsUpdateAccountsCommand,
      campaignsUpdateScheduleCommand,
      campaignsGetSequenceCommand,
    ]) {
      expect(cmd.group).toBe('campaigns');
    }
  });
});
