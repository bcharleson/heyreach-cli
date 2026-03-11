import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const listsCreateCommand: CommandDefinition = {
  name: 'lists_create',
  group: 'lists',
  subcommand: 'create',
  description: 'Create an empty lead or company list.',
  examples: [
    'heyreach lists create --name "Q1 Prospects"',
    'heyreach lists create --name "Target Companies" --type COMPANY_LIST',
  ],
  inputSchema: z.object({
    name: z.string().describe('List name'),
    type: z.string().optional().describe('List type: USER_LIST (default) or COMPANY_LIST'),
  }),
  cliMappings: {
    options: [
      { field: 'name', flags: '--name <name>', description: 'List name' },
      { field: 'type', flags: '--type <type>', description: 'USER_LIST or COMPANY_LIST' },
    ],
  },
  endpoint: { method: 'POST', path: '/list/CreateEmptyList' },
  fieldMappings: { name: 'body', type: 'body' },
  handler: (input, client) => executeCommand(listsCreateCommand, input, client),
};
