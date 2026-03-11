import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const orgGetUserCommand: CommandDefinition = {
  name: 'org_get_user',
  group: 'org',
  subcommand: 'get-user',
  description: 'Get information about a user by ID.',
  examples: ['heyreach org get-user --user-id 456 --pretty'],
  inputSchema: z.object({
    userId: z.coerce.number().describe('User ID'),
  }),
  cliMappings: {
    options: [
      { field: 'userId', flags: '--user-id <id>', description: 'User ID' },
    ],
  },
  endpoint: { method: 'GET', path: '/management/organizations/users/{userId}' },
  fieldMappings: { userId: 'path' },
  handler: async (input, client) => {
    return client.request({
      method: 'GET',
      path: `/management/organizations/users/${encodeURIComponent(String(input.userId))}`,
    });
  },
};
