import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const campaignsCreateCommand: CommandDefinition = {
  name: 'campaigns_create',
  group: 'campaigns',
  subcommand: 'create',
  description: 'Create a fully configured campaign in DRAFT status. Call StartCampaign separately to activate.',
  examples: [
    'heyreach campaigns create --name "Q1 Outreach" --list-id 789 --account-ids "123,456"',
    'heyreach campaigns create --name "Founders" --list-id 789 --account-ids 123 --schedule-json \'{"dailyStartTime":"09:00:00","dailyEndTime":"17:00:00","timeZoneId":"America/New_York"}\' --sequence-json \'{"nodeType":"CONNECTION_REQUEST","payload":{"messages":["Hi {{firstName}}"]},"conditionalNode":{"nodeType":"END"},"unconditionalNode":{"nodeType":"END"}}\'',
  ],
  inputSchema: z.object({
    name: z.string().min(1).max(50).describe('Campaign name (1-50 chars)'),
    linkedInUserListId: z.coerce.number().describe('Lead list ID (must be type USER_LIST)'),
    accountIds: z.string().describe('Comma-separated LinkedIn sender account IDs (1-100)'),
    excludeContactedFromOtherCampaigns: z.coerce.boolean().optional().describe('Skip leads already in other campaigns'),
    excludeHasOtherAccConversations: z.coerce.boolean().optional().describe('Skip leads with existing conversations from other accounts'),
    excludeContactedFromSenderInOtherCampaign: z.coerce.boolean().optional().describe('Skip leads the sender accounts have touched'),
    excludeListId: z.coerce.number().optional().describe('Lead list ID to always exclude'),
    scheduleJson: z.string().optional().describe('CampaignScheduleApiDto JSON (defaults to Mon-Fri 09:00-17:00 UTC)'),
    sequenceJson: z.string().optional().describe('PublicSequenceNodeDto JSON — root automation tree (omit the implicit START node)'),
  }),
  cliMappings: {
    options: [
      { field: 'name', flags: '--name <text>', description: 'Campaign name (1-50 chars)' },
      { field: 'linkedInUserListId', flags: '--list-id <id>', description: 'Lead list ID (USER_LIST)' },
      { field: 'accountIds', flags: '--account-ids <list>', description: 'Comma-separated LinkedIn sender account IDs' },
      { field: 'excludeContactedFromOtherCampaigns', flags: '--exclude-contacted-other-campaigns', description: 'Skip leads already in other campaigns' },
      { field: 'excludeHasOtherAccConversations', flags: '--exclude-other-conversations', description: 'Skip leads with existing conversations from other accounts' },
      { field: 'excludeContactedFromSenderInOtherCampaign', flags: '--exclude-sender-contacted', description: 'Skip leads the sender accounts have touched' },
      { field: 'excludeListId', flags: '--exclude-list-id <id>', description: 'Lead list ID to always exclude' },
      { field: 'scheduleJson', flags: '--schedule-json <json>', description: 'CampaignScheduleApiDto JSON' },
      { field: 'sequenceJson', flags: '--sequence-json <json>', description: 'PublicSequenceNodeDto JSON (root of tree)' },
    ],
  },
  endpoint: { method: 'POST', path: '/campaign/Create' },
  fieldMappings: {
    name: 'body',
    linkedInUserListId: 'body',
    accountIds: 'body',
    excludeContactedFromOtherCampaigns: 'body',
    excludeHasOtherAccConversations: 'body',
    excludeContactedFromSenderInOtherCampaign: 'body',
    excludeListId: 'body',
    scheduleJson: 'body',
    sequenceJson: 'body',
  },
  handler: async (input, client) => {
    const body: Record<string, unknown> = {
      name: input.name,
      linkedInUserListId: input.linkedInUserListId,
      linkedInAccountIds: (input.accountIds as string).split(',').map((s: string) => Number(s.trim())),
    };
    if (input.excludeContactedFromOtherCampaigns !== undefined) body.excludeContactedFromOtherCampaigns = input.excludeContactedFromOtherCampaigns;
    if (input.excludeHasOtherAccConversations !== undefined) body.excludeHasOtherAccConversations = input.excludeHasOtherAccConversations;
    if (input.excludeContactedFromSenderInOtherCampaign !== undefined) body.excludeContactedFromSenderInOtherCampaign = input.excludeContactedFromSenderInOtherCampaign;
    if (input.excludeListId !== undefined) body.excludeListId = input.excludeListId;
    if (input.scheduleJson) body.schedule = JSON.parse(input.scheduleJson as string);
    if (input.sequenceJson) body.sequence = JSON.parse(input.sequenceJson as string);
    return client.request({ method: 'POST', path: '/campaign/Create', body });
  },
};

