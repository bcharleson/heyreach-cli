import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const campaignsListCommand: CommandDefinition = {
  name: 'campaigns_list',
  group: 'campaigns',
  subcommand: 'list',
  description: 'Get a paginated list of all campaigns. Up to 100 per request.',
  examples: [
    'heyreach campaigns list',
    'heyreach campaigns list --keyword "outbound" --pretty',
    'heyreach campaigns list --statuses IN_PROGRESS,PAUSED',
  ],
  inputSchema: z.object({
    offset: z.coerce.number().default(0).describe('Pagination offset'),
    limit: z.coerce.number().min(1).max(100).default(100).describe('Items per page (max 100)'),
    keyword: z.string().optional().describe('Filter by campaign name'),
    statuses: z.string().optional().describe('Comma-separated statuses: DRAFT,IN_PROGRESS,PAUSED,FINISHED,CANCELED,FAILED,STARTING,SCHEDULED'),
    accountIds: z.string().optional().describe('Comma-separated LinkedIn account IDs'),
  }),
  cliMappings: {
    options: [
      { field: 'offset', flags: '--offset <number>', description: 'Pagination offset' },
      { field: 'limit', flags: '--limit <number>', description: 'Items per page (max 100)' },
      { field: 'keyword', flags: '--keyword <text>', description: 'Filter by campaign name' },
      { field: 'statuses', flags: '--statuses <list>', description: 'Comma-separated statuses' },
      { field: 'accountIds', flags: '--account-ids <list>', description: 'Comma-separated LinkedIn account IDs' },
    ],
  },
  endpoint: { method: 'POST', path: '/campaign/GetAll' },
  fieldMappings: { offset: 'body', limit: 'body', keyword: 'body', statuses: 'body', accountIds: 'body' },
  handler: async (input, client) => {
    const body: Record<string, unknown> = {
      offset: input.offset,
      limit: input.limit,
    };
    if (input.keyword) body.keyword = input.keyword;
    if (input.statuses) body.statuses = input.statuses.split(',').map((s: string) => s.trim());
    if (input.accountIds) body.accountIds = input.accountIds.split(',').map((s: string) => Number(s.trim()));
    return client.request({ method: 'POST', path: '/campaign/GetAll', body });
  },
};
