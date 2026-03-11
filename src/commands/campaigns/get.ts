import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const campaignsGetCommand: CommandDefinition = {
  name: 'campaigns_get',
  group: 'campaigns',
  subcommand: 'get',
  description: 'Get a campaign by ID.',
  examples: ['heyreach campaigns get --campaign-id 12345 --pretty'],
  inputSchema: z.object({
    campaignId: z.coerce.number().describe('Campaign ID'),
  }),
  cliMappings: {
    options: [
      { field: 'campaignId', flags: '--campaign-id <id>', description: 'Campaign ID' },
    ],
  },
  endpoint: { method: 'GET', path: '/campaign/GetById' },
  fieldMappings: { campaignId: 'query' },
  handler: (input, client) => executeCommand(campaignsGetCommand, input, client),
};
