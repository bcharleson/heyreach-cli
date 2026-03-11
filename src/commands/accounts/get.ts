import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const accountsGetCommand: CommandDefinition = {
  name: 'accounts_get',
  group: 'accounts',
  subcommand: 'get',
  description: 'Get a LinkedIn account by ID.',
  examples: ['heyreach accounts get --account-id 123 --pretty'],
  inputSchema: z.object({
    accountId: z.coerce.number().describe('LinkedIn account ID'),
  }),
  cliMappings: {
    options: [
      { field: 'accountId', flags: '--account-id <id>', description: 'LinkedIn account ID' },
    ],
  },
  endpoint: { method: 'GET', path: '/li_account/GetById' },
  fieldMappings: { accountId: 'query' },
  handler: (input, client) => executeCommand(accountsGetCommand, input, client),
};
