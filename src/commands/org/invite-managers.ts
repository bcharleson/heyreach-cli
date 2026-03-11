import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const orgInviteManagersCommand: CommandDefinition = {
  name: 'org_invite_managers',
  group: 'org',
  subcommand: 'invite-managers',
  description: 'Invite users as managers (external users with workspace access, auto-added without registration).',
  examples: ['heyreach org invite-managers --inviter-email "admin@co.com" --emails "manager@co.com" --workspace-ids "1,2"'],
  inputSchema: z.object({
    inviterEmail: z.string().describe('Email of the inviter'),
    emails: z.string().describe('Comma-separated emails to invite'),
    workspaceIds: z.string().describe('Comma-separated workspace IDs'),
  }),
  cliMappings: {
    options: [
      { field: 'inviterEmail', flags: '--inviter-email <email>', description: 'Inviter email' },
      { field: 'emails', flags: '--emails <list>', description: 'Comma-separated emails' },
      { field: 'workspaceIds', flags: '--workspace-ids <list>', description: 'Comma-separated workspace IDs' },
    ],
  },
  endpoint: { method: 'POST', path: '/management/organizations/users/invite/managers' },
  fieldMappings: {},
  handler: async (input, client) => {
    return client.request({
      method: 'POST',
      path: '/management/organizations/users/invite/managers',
      body: {
        inviterEmail: input.inviterEmail,
        emails: (input.emails as string).split(',').map((s) => s.trim()),
        workspaceIds: (input.workspaceIds as string).split(',').map((s) => Number(s.trim())),
      },
    });
  },
};
