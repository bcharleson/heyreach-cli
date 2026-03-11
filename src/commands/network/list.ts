import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const networkListCommand: CommandDefinition = {
  name: 'network_list',
  group: 'network',
  subcommand: 'list',
  description: 'Get paginated network connections for a LinkedIn sender. Uses pageNumber/pageSize pagination.',
  examples: ['heyreach network list --sender-id 123 --pretty'],
  inputSchema: z.object({
    senderId: z.coerce.number().describe('LinkedIn sender account ID'),
    pageNumber: z.coerce.number().default(1).describe('Page number (starts at 1)'),
    pageSize: z.coerce.number().min(1).max(100).default(100).describe('Page size'),
  }),
  cliMappings: {
    options: [
      { field: 'senderId', flags: '--sender-id <id>', description: 'LinkedIn sender account ID' },
      { field: 'pageNumber', flags: '--page <number>', description: 'Page number' },
      { field: 'pageSize', flags: '--page-size <number>', description: 'Page size' },
    ],
  },
  endpoint: { method: 'POST', path: '/MyNetwork/GetMyNetworkForSender' },
  fieldMappings: { senderId: 'body', pageNumber: 'body', pageSize: 'body' },
  handler: (input, client) => executeCommand(networkListCommand, input, client),
};
