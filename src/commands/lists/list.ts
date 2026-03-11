import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const listsListCommand: CommandDefinition = {
  name: 'lists_list',
  group: 'lists',
  subcommand: 'list',
  description: 'Get a paginated list of all lead and company lists. Up to 100 per request.',
  examples: [
    'heyreach lists list --pretty',
    'heyreach lists list --list-type USER_LIST',
  ],
  inputSchema: z.object({
    offset: z.coerce.number().default(0).describe('Pagination offset'),
    limit: z.coerce.number().min(1).max(100).default(100).describe('Items per page'),
    keyword: z.string().optional().describe('Search by list name'),
    listType: z.string().optional().describe('Filter by type: USER_LIST or COMPANY_LIST'),
    campaignIds: z.string().optional().describe('Comma-separated campaign IDs'),
  }),
  cliMappings: {
    options: [
      { field: 'offset', flags: '--offset <number>', description: 'Pagination offset' },
      { field: 'limit', flags: '--limit <number>', description: 'Items per page' },
      { field: 'keyword', flags: '--keyword <text>', description: 'Search by list name' },
      { field: 'listType', flags: '--list-type <type>', description: 'USER_LIST or COMPANY_LIST' },
      { field: 'campaignIds', flags: '--campaign-ids <list>', description: 'Comma-separated campaign IDs' },
    ],
  },
  endpoint: { method: 'POST', path: '/list/GetAll' },
  fieldMappings: {},
  handler: async (input, client) => {
    const body: Record<string, unknown> = { offset: input.offset, limit: input.limit };
    if (input.keyword) body.keyword = input.keyword;
    if (input.listType) body.listType = input.listType;
    if (input.campaignIds) body.campaignIds = input.campaignIds.split(',').map((s: string) => Number(s.trim()));
    return client.request({ method: 'POST', path: '/list/GetAll', body });
  },
};
