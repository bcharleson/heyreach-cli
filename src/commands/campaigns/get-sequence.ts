import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const campaignsGetSequenceCommand: CommandDefinition = {
  name: 'campaigns_get_sequence',
  group: 'campaigns',
  subcommand: 'get-sequence',
  description: 'Get the current sequence (workflow) of a campaign as a PublicSequenceNodeDto. The result is directly compatible with the create and update-sequence endpoints.',
  examples: ['heyreach campaigns get-sequence --campaign-id 12345 --pretty'],
  inputSchema: z.object({
    campaignId: z.coerce.number().describe('Campaign ID'),
  }),
  cliMappings: {
    options: [
      { field: 'campaignId', flags: '--campaign-id <id>', description: 'Campaign ID' },
    ],
  },
  endpoint: { method: 'GET', path: '/campaign/GetCampaignSequence' },
  fieldMappings: { campaignId: 'query' },
  handler: (input, client) => executeCommand(campaignsGetSequenceCommand, input, client),
};

