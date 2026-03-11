import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const orgWorkspaceUsersCommand: CommandDefinition = {
  name: 'org_workspace_users',
  group: 'org',
  subcommand: 'workspace-users',
  description: 'Get all users in a given workspace with role and permissions.',
  examples: ['heyreach org workspace-users --workspace-id 123 --pretty'],
  inputSchema: z.object({
    workspaceId: z.coerce.number().describe('Workspace ID'),
    offset: z.coerce.number().default(0).describe('Pagination offset'),
    limit: z.coerce.number().min(1).max(100).default(100).describe('Items per page'),
    role: z.string().optional().describe('Filter by role'),
    invitationStatus: z.string().optional().describe('Comma-separated invitation statuses'),
  }),
  cliMappings: {
    options: [
      { field: 'workspaceId', flags: '--workspace-id <id>', description: 'Workspace ID' },
      { field: 'offset', flags: '--offset <number>', description: 'Pagination offset' },
      { field: 'limit', flags: '--limit <number>', description: 'Items per page' },
      { field: 'role', flags: '--role <role>', description: 'Filter by role' },
      { field: 'invitationStatus', flags: '--invitation-status <list>', description: 'Comma-separated invitation statuses' },
    ],
  },
  endpoint: { method: 'POST', path: '/management/organizations/users/workspaces/{workspaceId}' },
  fieldMappings: {},
  handler: async (input, client) => {
    const body: Record<string, unknown> = { offset: input.offset, limit: input.limit };
    if (input.role) body.role = input.role;
    if (input.invitationStatus) body.invitationStatus = input.invitationStatus.split(',').map((s: string) => s.trim());
    return client.request({
      method: 'POST',
      path: `/management/organizations/users/workspaces/${encodeURIComponent(String(input.workspaceId))}`,
      body,
    });
  },
};
