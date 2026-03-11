import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const accountsListCommand: CommandDefinition = {
  name: 'accounts_list',
  group: 'accounts',
  subcommand: 'list',
  description: 'Get a paginated list of all LinkedIn accounts. Up to 100 per request.',
  examples: ['heyreach accounts list --pretty', 'heyreach accounts list --keyword "john"'],
  inputSchema: z.object({
    offset: z.coerce.number().default(0).describe('Pagination offset'),
    limit: z.coerce.number().min(1).max(100).default(100).describe('Items per page'),
    keyword: z.string().optional().describe('Search by account name'),
  }),
  cliMappings: {
    options: [
      { field: 'offset', flags: '--offset <number>', description: 'Pagination offset' },
      { field: 'limit', flags: '--limit <number>', description: 'Items per page' },
      { field: 'keyword', flags: '--keyword <text>', description: 'Search by account name' },
    ],
  },
  endpoint: { method: 'POST', path: '/li_account/GetAll' },
  fieldMappings: { offset: 'body', limit: 'body', keyword: 'body' },
  handler: (input, client) => executeCommand(accountsListCommand, input, client),
};
