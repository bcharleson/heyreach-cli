import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const campaignsStartCommand: CommandDefinition = {
  name: 'campaigns_start',
  group: 'campaigns',
  subcommand: 'start',
  description: 'Activate a DRAFT campaign (DRAFT → IN_PROGRESS). Use resume for PAUSED campaigns.',
  examples: ['heyreach campaigns start --campaign-id 12345'],
  inputSchema: z.object({
    campaignId: z.coerce.number().describe('Campaign ID (must be in DRAFT status)'),
  }),
  cliMappings: {
    options: [
      { field: 'campaignId', flags: '--campaign-id <id>', description: 'Campaign ID (must be in DRAFT status)' },
    ],
  },
  endpoint: { method: 'POST', path: '/campaign/StartCampaign' },
  fieldMappings: { campaignId: 'query' },
  handler: (input, client) => executeCommand(campaignsStartCommand, input, client),
};

