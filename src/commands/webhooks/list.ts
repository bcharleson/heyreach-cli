import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const webhooksListCommand: CommandDefinition = {
  name: 'webhooks_list',
  group: 'webhooks',
  subcommand: 'list',
  description: 'Get all webhooks.',
  examples: ['heyreach webhooks list --pretty'],
  inputSchema: z.object({
    offset: z.coerce.number().default(0).describe('Pagination offset'),
    limit: z.coerce.number().min(1).max(100).default(100).describe('Items per page'),
  }),
  cliMappings: {
    options: [
      { field: 'offset', flags: '--offset <number>', description: 'Pagination offset' },
      { field: 'limit', flags: '--limit <number>', description: 'Items per page' },
    ],
  },
  endpoint: { method: 'POST', path: '/webhooks/GetAllWebhooks' },
  fieldMappings: { offset: 'body', limit: 'body' },
  handler: (input, client) => executeCommand(webhooksListCommand, input, client),
};
