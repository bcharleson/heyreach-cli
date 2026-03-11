import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const orgUpdateWorkspaceCommand: CommandDefinition = {
  name: 'org_update_workspace',
  group: 'org',
  subcommand: 'update-workspace',
  description: 'Update a workspace in your organization.',
  examples: ['heyreach org update-workspace --workspace-id 123 --name "New Name" --seats-limit 20'],
  inputSchema: z.object({
    workspaceId: z.coerce.number().describe('Workspace ID'),
    workspaceName: z.string().optional().describe('New workspace name'),
    seatsLimit: z.coerce.number().optional().describe('New seat limit'),
  }),
  cliMappings: {
    options: [
      { field: 'workspaceId', flags: '--workspace-id <id>', description: 'Workspace ID' },
      { field: 'workspaceName', flags: '--name <name>', description: 'New workspace name' },
      { field: 'seatsLimit', flags: '--seats-limit <number>', description: 'New seat limit' },
    ],
  },
  endpoint: { method: 'PATCH', path: '/management/organizations/workspaces/{workspaceId}' },
  fieldMappings: {},
  handler: async (input, client) => {
    const body: Record<string, unknown> = {};
    if (input.workspaceName !== undefined) body.workspaceName = input.workspaceName;
    if (input.seatsLimit !== undefined) body.seatsLimit = { value: input.seatsLimit };
    return client.request({
      method: 'PATCH',
      path: `/management/organizations/workspaces/${encodeURIComponent(String(input.workspaceId))}`,
      body,
    });
  },
};
