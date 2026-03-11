import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const listsGetCompaniesCommand: CommandDefinition = {
  name: 'lists_get_companies',
  group: 'lists',
  subcommand: 'get-companies',
  description: 'Get a paginated list of companies from a company list. Up to 1000 per request.',
  examples: ['heyreach lists get-companies --list-id 789 --pretty'],
  inputSchema: z.object({
    listId: z.coerce.number().describe('List ID'),
    offset: z.coerce.number().default(0).describe('Pagination offset'),
    limit: z.coerce.number().min(1).max(1000).default(100).describe('Items per page (max 1000)'),
    keyword: z.string().optional().describe('Search companies'),
  }),
  cliMappings: {
    options: [
      { field: 'listId', flags: '--list-id <id>', description: 'List ID' },
      { field: 'offset', flags: '--offset <number>', description: 'Pagination offset' },
      { field: 'limit', flags: '--limit <number>', description: 'Items per page' },
      { field: 'keyword', flags: '--keyword <text>', description: 'Search companies' },
    ],
  },
  endpoint: { method: 'POST', path: '/list/GetCompaniesFromList' },
  fieldMappings: { listId: 'body', offset: 'body', limit: 'body', keyword: 'body' },
  handler: (input, client) => executeCommand(listsGetCompaniesCommand, input, client),
};
