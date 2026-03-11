import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const campaignsStopLeadCommand: CommandDefinition = {
  name: 'campaigns_stop_lead',
  group: 'campaigns',
  subcommand: 'stop-lead',
  description: 'Stop the progression of a lead in a campaign.',
  examples: [
    'heyreach campaigns stop-lead --campaign-id 123 --lead-url "https://linkedin.com/in/janedoe"',
    'heyreach campaigns stop-lead --campaign-id 123 --lead-member-id "ABC123"',
  ],
  inputSchema: z.object({
    campaignId: z.coerce.number().describe('Campaign ID'),
    leadMemberId: z.string().optional().describe('LinkedIn member ID'),
    leadUrl: z.string().optional().describe('LinkedIn profile URL'),
  }),
  cliMappings: {
    options: [
      { field: 'campaignId', flags: '--campaign-id <id>', description: 'Campaign ID' },
      { field: 'leadMemberId', flags: '--lead-member-id <id>', description: 'LinkedIn member ID' },
      { field: 'leadUrl', flags: '--lead-url <url>', description: 'LinkedIn profile URL' },
    ],
  },
  endpoint: { method: 'POST', path: '/campaign/StopLeadInCampaign' },
  fieldMappings: { campaignId: 'body', leadMemberId: 'body', leadUrl: 'body' },
  handler: (input, client) => executeCommand(campaignsStopLeadCommand, input, client),
};
