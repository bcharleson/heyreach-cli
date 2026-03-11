import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const listsGetLeadsCommand: CommandDefinition = {
  name: 'lists_get_leads',
  group: 'lists',
  subcommand: 'get-leads',
  description: 'Get a paginated list of leads from a lead list. Up to 1000 per request.',
  examples: ['heyreach lists get-leads --list-id 456 --pretty'],
  inputSchema: z.object({
    listId: z.coerce.number().describe('List ID'),
    offset: z.coerce.number().default(0).describe('Pagination offset'),
    limit: z.coerce.number().min(1).max(1000).default(100).describe('Items per page (max 1000)'),
    keyword: z.string().optional().describe('Search leads'),
    leadProfileUrl: z.string().optional().describe('Filter by profile URL'),
    leadLinkedInId: z.string().optional().describe('Filter by LinkedIn ID'),
    createdFrom: z.string().optional().describe('Created from (ISO 8601)'),
    createdTo: z.string().optional().describe('Created to (ISO 8601)'),
  }),
  cliMappings: {
    options: [
      { field: 'listId', flags: '--list-id <id>', description: 'List ID' },
      { field: 'offset', flags: '--offset <number>', description: 'Pagination offset' },
      { field: 'limit', flags: '--limit <number>', description: 'Items per page' },
      { field: 'keyword', flags: '--keyword <text>', description: 'Search leads' },
      { field: 'leadProfileUrl', flags: '--profile-url <url>', description: 'Filter by profile URL' },
      { field: 'leadLinkedInId', flags: '--linkedin-id <id>', description: 'Filter by LinkedIn ID' },
      { field: 'createdFrom', flags: '--created-from <iso>', description: 'Created from (ISO 8601)' },
      { field: 'createdTo', flags: '--created-to <iso>', description: 'Created to (ISO 8601)' },
    ],
  },
  endpoint: { method: 'POST', path: '/list/GetLeadsFromList' },
  fieldMappings: { listId: 'body', offset: 'body', limit: 'body', keyword: 'body', leadProfileUrl: 'body', leadLinkedInId: 'body', createdFrom: 'body', createdTo: 'body' },
  handler: (input, client) => executeCommand(listsGetLeadsCommand, input, client),
};
