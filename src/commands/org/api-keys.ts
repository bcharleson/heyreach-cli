import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const orgApiKeysCommand: CommandDefinition = {
  name: 'org_api_keys',
  group: 'org',
  subcommand: 'api-keys',
  description: 'Get API/integration keys for a workspace (requires Organization API key).',
  examples: ['heyreach org api-keys --workspace-id 123 --pretty'],
  inputSchema: z.object({
    workspaceId: z.coerce.number().describe('Workspace ID'),
  }),
  cliMappings: {
    options: [
      { field: 'workspaceId', flags: '--workspace-id <id>', description: 'Workspace ID' },
    ],
  },
  endpoint: { method: 'GET', path: '/management/organizations/api-keys/workspaces/{workspaceId}' },
  fieldMappings: { workspaceId: 'path' },
  handler: async (input, client) => {
    return client.request({
      method: 'GET',
      path: `/management/organizations/api-keys/workspaces/${encodeURIComponent(String(input.workspaceId))}`,
    });
  },
};
