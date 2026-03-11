import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const orgInviteAdminsCommand: CommandDefinition = {
  name: 'org_invite_admins',
  group: 'org',
  subcommand: 'invite-admins',
  description: 'Invite users as organization admins. Returns invitation URLs (no email sent).',
  examples: ['heyreach org invite-admins --inviter-email "admin@co.com" --emails "user1@co.com,user2@co.com"'],
  inputSchema: z.object({
    inviterEmail: z.string().describe('Email of the inviter'),
    emails: z.string().describe('Comma-separated emails to invite'),
  }),
  cliMappings: {
    options: [
      { field: 'inviterEmail', flags: '--inviter-email <email>', description: 'Inviter email' },
      { field: 'emails', flags: '--emails <list>', description: 'Comma-separated emails' },
    ],
  },
  endpoint: { method: 'POST', path: '/management/organizations/users/invite/admins' },
  fieldMappings: {},
  handler: async (input, client) => {
    return client.request({
      method: 'POST',
      path: '/management/organizations/users/invite/admins',
      body: {
        inviterEmail: input.inviterEmail,
        emails: (input.emails as string).split(',').map((s) => s.trim()),
      },
    });
  },
};
