import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const campaignsResumeCommand: CommandDefinition = {
  name: 'campaigns_resume',
  group: 'campaigns',
  subcommand: 'resume',
  description: 'Resume a paused campaign.',
  examples: ['heyreach campaigns resume --campaign-id 12345'],
  inputSchema: z.object({
    campaignId: z.coerce.number().describe('Campaign ID'),
  }),
  cliMappings: {
    options: [
      { field: 'campaignId', flags: '--campaign-id <id>', description: 'Campaign ID' },
    ],
  },
  endpoint: { method: 'POST', path: '/campaign/Resume' },
  fieldMappings: { campaignId: 'query' },
  handler: (input, client) => executeCommand(campaignsResumeCommand, input, client),
};
