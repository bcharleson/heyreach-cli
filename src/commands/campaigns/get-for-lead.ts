import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const campaignsGetForLeadCommand: CommandDefinition = {
  name: 'campaigns_get_for_lead',
  group: 'campaigns',
  subcommand: 'get-for-lead',
  description: 'Get campaigns where a specific lead is enrolled.',
  examples: [
    'heyreach campaigns get-for-lead --profile-url "https://linkedin.com/in/janedoe" --pretty',
    'heyreach campaigns get-for-lead --email "jane@example.com"',
  ],
  inputSchema: z.object({
    offset: z.coerce.number().default(0).describe('Pagination offset'),
    limit: z.coerce.number().min(1).max(100).default(100).describe('Items per page'),
    email: z.string().optional().describe('Lead email address'),
    linkedinId: z.string().optional().describe('Lead LinkedIn ID'),
    profileUrl: z.string().optional().describe('Lead LinkedIn profile URL'),
  }),
  cliMappings: {
    options: [
      { field: 'offset', flags: '--offset <number>', description: 'Pagination offset' },
      { field: 'limit', flags: '--limit <number>', description: 'Items per page' },
      { field: 'email', flags: '--email <email>', description: 'Lead email address' },
      { field: 'linkedinId', flags: '--linkedin-id <id>', description: 'Lead LinkedIn ID' },
      { field: 'profileUrl', flags: '--profile-url <url>', description: 'Lead LinkedIn profile URL' },
    ],
  },
  endpoint: { method: 'POST', path: '/campaign/GetCampaignsForLead' },
  fieldMappings: { offset: 'body', limit: 'body', email: 'body', linkedinId: 'body', profileUrl: 'body' },
  handler: (input, client) => executeCommand(campaignsGetForLeadCommand, input, client),
};
