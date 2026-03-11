import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const orgWorkspacesCommand: CommandDefinition = {
  name: 'org_workspaces',
  group: 'org',
  subcommand: 'workspaces',
  description: 'List all workspaces in your organization (requires Organization API key).',
  examples: ['heyreach org workspaces --pretty'],
  inputSchema: z.object({
    Offset: z.coerce.number().default(0).describe('Pagination offset'),
    Limit: z.coerce.number().min(1).max(100).default(100).describe('Items per page'),
  }),
  cliMappings: {
    options: [
      { field: 'Offset', flags: '--offset <number>', description: 'Pagination offset' },
      { field: 'Limit', flags: '--limit <number>', description: 'Items per page' },
    ],
  },
  endpoint: { method: 'GET', path: '/management/organizations/workspaces' },
  fieldMappings: { Offset: 'query', Limit: 'query' },
  handler: async (input, client) => {
    return client.request({
      method: 'GET',
      path: '/management/organizations/workspaces',
      query: { Offset: input.Offset, Limit: input.Limit },
    });
  },
};
