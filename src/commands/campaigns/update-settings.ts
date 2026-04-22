import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const campaignsUpdateSettingsCommand: CommandDefinition = {
  name: 'campaigns_update_settings',
  group: 'campaigns',
  subcommand: 'update-settings',
  description: 'Update campaign name, lead list, and exclusion options. Not allowed on ACTIVE or COMPLETED campaigns. SCHEDULED campaigns revert to DRAFT.',
  examples: [
    'heyreach campaigns update-settings --campaign-id 123 --name "New Name" --list-id 789',
    'heyreach campaigns update-settings --campaign-id 123 --name "Q2" --list-id 789 --exclude-list-id 456',
  ],
  inputSchema: z.object({
    campaignId: z.coerce.number().describe('Campaign ID'),
    name: z.string().min(1).max(50).describe('New campaign name (1-50 chars)'),
    linkedInUserListId: z.coerce.number().describe('Replacement lead list ID (USER_LIST, locked after campaign has started)'),
    excludeContactedFromOtherCampaigns: z.coerce.boolean().optional(),
    excludeHasOtherAccConversations: z.coerce.boolean().optional(),
    excludeContactedFromSenderInOtherCampaign: z.coerce.boolean().optional(),
    excludeListId: z.coerce.number().optional().describe('Lead list ID to always exclude'),
  }),
  cliMappings: {
    options: [
      { field: 'campaignId', flags: '--campaign-id <id>', description: 'Campaign ID' },
      { field: 'name', flags: '--name <text>', description: 'New campaign name (1-50 chars)' },
      { field: 'linkedInUserListId', flags: '--list-id <id>', description: 'Replacement lead list ID (USER_LIST)' },
      { field: 'excludeContactedFromOtherCampaigns', flags: '--exclude-contacted-other-campaigns', description: 'Skip leads already in other campaigns' },
      { field: 'excludeHasOtherAccConversations', flags: '--exclude-other-conversations', description: 'Skip leads with existing conversations from other accounts' },
      { field: 'excludeContactedFromSenderInOtherCampaign', flags: '--exclude-sender-contacted', description: 'Skip leads the sender accounts have touched' },
      { field: 'excludeListId', flags: '--exclude-list-id <id>', description: 'Lead list ID to always exclude' },
    ],
  },
  endpoint: { method: 'POST', path: '/campaign/UpdateSettings' },
  fieldMappings: {
    campaignId: 'body',
    name: 'body',
    linkedInUserListId: 'body',
    excludeContactedFromOtherCampaigns: 'body',
    excludeHasOtherAccConversations: 'body',
    excludeContactedFromSenderInOtherCampaign: 'body',
    excludeListId: 'body',
  },
  handler: async (input, client) => {
    const body: Record<string, unknown> = {
      campaignId: input.campaignId,
      name: input.name,
      linkedInUserListId: input.linkedInUserListId,
    };
    if (input.excludeContactedFromOtherCampaigns !== undefined) body.excludeContactedFromOtherCampaigns = input.excludeContactedFromOtherCampaigns;
    if (input.excludeHasOtherAccConversations !== undefined) body.excludeHasOtherAccConversations = input.excludeHasOtherAccConversations;
    if (input.excludeContactedFromSenderInOtherCampaign !== undefined) body.excludeContactedFromSenderInOtherCampaign = input.excludeContactedFromSenderInOtherCampaign;
    if (input.excludeListId !== undefined) body.excludeListId = input.excludeListId;
    return client.request({ method: 'POST', path: '/campaign/UpdateSettings', body });
  },
};

