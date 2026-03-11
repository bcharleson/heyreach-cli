import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const orgUsersCommand: CommandDefinition = {
  name: 'org_users',
  group: 'org',
  subcommand: 'users',
  description: 'Get all existing and invited users in your organization.',
  examples: ['heyreach org users --pretty', 'heyreach org users --role Admin'],
  inputSchema: z.object({
    offset: z.coerce.number().default(0).describe('Pagination offset'),
    limit: z.coerce.number().min(1).max(100).default(100).describe('Items per page'),
    role: z.string().optional().describe('Filter by role: Admin, Member, Manager'),
    invitationStatus: z.string().optional().describe('Comma-separated statuses: Accepted, Pending, Expired, Revoked'),
  }),
  cliMappings: {
    options: [
      { field: 'offset', flags: '--offset <number>', description: 'Pagination offset' },
      { field: 'limit', flags: '--limit <number>', description: 'Items per page' },
      { field: 'role', flags: '--role <role>', description: 'Filter by role' },
      { field: 'invitationStatus', flags: '--invitation-status <list>', description: 'Comma-separated invitation statuses' },
    ],
  },
  endpoint: { method: 'POST', path: '/management/organizations/users' },
  fieldMappings: {},
  handler: async (input, client) => {
    const body: Record<string, unknown> = { offset: input.offset, limit: input.limit };
    if (input.role) body.role = input.role;
    if (input.invitationStatus) body.invitationStatus = input.invitationStatus.split(',').map((s: string) => s.trim());
    return client.request({ method: 'POST', path: '/management/organizations/users', body });
  },
};
