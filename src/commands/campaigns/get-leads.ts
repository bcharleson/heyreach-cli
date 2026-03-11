import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const campaignsGetLeadsCommand: CommandDefinition = {
  name: 'campaigns_get_leads',
  group: 'campaigns',
  subcommand: 'get-leads',
  description: 'Get leads from a campaign (Lead Analytics). Shows pending leads about to start executing.',
  examples: ['heyreach campaigns get-leads --campaign-id 123 --pretty'],
  inputSchema: z.object({
    campaignId: z.coerce.number().describe('Campaign ID'),
    offset: z.coerce.number().default(0).describe('Pagination offset'),
    limit: z.coerce.number().min(1).max(100).default(100).describe('Items per page'),
    timeFrom: z.string().optional().describe('Start time (ISO 8601)'),
    timeTo: z.string().optional().describe('End time (ISO 8601)'),
    timeFilter: z.string().optional().describe('Time filter: CreationTime|Everywhere|LastActionTakenTime|FailedTime|LastActionTakenOrFailedTime'),
  }),
  cliMappings: {
    options: [
      { field: 'campaignId', flags: '--campaign-id <id>', description: 'Campaign ID' },
      { field: 'offset', flags: '--offset <number>', description: 'Pagination offset' },
      { field: 'limit', flags: '--limit <number>', description: 'Items per page' },
      { field: 'timeFrom', flags: '--time-from <iso>', description: 'Start time (ISO 8601)' },
      { field: 'timeTo', flags: '--time-to <iso>', description: 'End time (ISO 8601)' },
      { field: 'timeFilter', flags: '--time-filter <type>', description: 'Time filter type' },
    ],
  },
  endpoint: { method: 'POST', path: '/campaign/GetLeadsFromCampaign' },
  fieldMappings: { campaignId: 'body', offset: 'body', limit: 'body', timeFrom: 'body', timeTo: 'body', timeFilter: 'body' },
  handler: (input, client) => executeCommand(campaignsGetLeadsCommand, input, client),
};
