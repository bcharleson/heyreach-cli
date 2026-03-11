import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const campaignsPauseCommand: CommandDefinition = {
  name: 'campaigns_pause',
  group: 'campaigns',
  subcommand: 'pause',
  description: 'Pause a running campaign.',
  examples: ['heyreach campaigns pause --campaign-id 12345'],
  inputSchema: z.object({
    campaignId: z.coerce.number().describe('Campaign ID'),
  }),
  cliMappings: {
    options: [
      { field: 'campaignId', flags: '--campaign-id <id>', description: 'Campaign ID' },
    ],
  },
  endpoint: { method: 'POST', path: '/campaign/Pause' },
  fieldMappings: { campaignId: 'query' },
  handler: (input, client) => executeCommand(campaignsPauseCommand, input, client),
};
