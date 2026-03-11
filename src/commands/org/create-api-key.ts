import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const orgCreateApiKeyCommand: CommandDefinition = {
  name: 'org_create_api_key',
  group: 'org',
  subcommand: 'create-api-key',
  description: 'Generate a new API/integration key for a workspace. Types: PUBLIC, N8N, MAKE, ZAPIER, MCP.',
  examples: ['heyreach org create-api-key --workspace-id 123 --type PUBLIC'],
  inputSchema: z.object({
    workspaceId: z.coerce.number().describe('Workspace ID'),
    apiKeyType: z.string().describe('Key type: PUBLIC, N8N, MAKE, ZAPIER, MCP'),
  }),
  cliMappings: {
    options: [
      { field: 'workspaceId', flags: '--workspace-id <id>', description: 'Workspace ID' },
      { field: 'apiKeyType', flags: '--type <type>', description: 'Key type: PUBLIC, N8N, MAKE, ZAPIER, MCP' },
    ],
  },
  endpoint: { method: 'POST', path: '/management/organizations/api-keys/workspaces/{workspaceId}' },
  fieldMappings: {},
  handler: async (input, client) => {
    return client.request({
      method: 'POST',
      path: `/management/organizations/api-keys/workspaces/${encodeURIComponent(String(input.workspaceId))}`,
      body: { apiKeyType: input.apiKeyType },
    });
  },
};
