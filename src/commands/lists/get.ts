import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const listsGetCommand: CommandDefinition = {
  name: 'lists_get',
  group: 'lists',
  subcommand: 'get',
  description: 'Get a lead or company list by ID.',
  examples: ['heyreach lists get --list-id 456 --pretty'],
  inputSchema: z.object({
    listId: z.coerce.number().describe('List ID'),
  }),
  cliMappings: {
    options: [
      { field: 'listId', flags: '--list-id <id>', description: 'List ID' },
    ],
  },
  endpoint: { method: 'GET', path: '/list/GetById' },
  fieldMappings: { listId: 'query' },
  handler: (input, client) => executeCommand(listsGetCommand, input, client),
};
