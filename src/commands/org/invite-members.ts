import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const orgInviteMembersCommand: CommandDefinition = {
  name: 'org_invite_members',
  group: 'org',
  subcommand: 'invite-members',
  description: 'Invite users as members with specified workspace permissions. Returns invitation URLs (no email sent).',
  examples: ['heyreach org invite-members --inviter-email "admin@co.com" --emails "user@co.com" --workspace-ids "1,2" --permissions-json \'{"viewCampaigns":true}\''],
  inputSchema: z.object({
    inviterEmail: z.string().describe('Email of the inviter'),
    emails: z.string().describe('Comma-separated emails to invite'),
    workspaceIds: z.string().describe('Comma-separated workspace IDs'),
    permissionsJson: z.string().describe('JSON object of permission booleans'),
  }),
  cliMappings: {
    options: [
      { field: 'inviterEmail', flags: '--inviter-email <email>', description: 'Inviter email' },
      { field: 'emails', flags: '--emails <list>', description: 'Comma-separated emails' },
      { field: 'workspaceIds', flags: '--workspace-ids <list>', description: 'Comma-separated workspace IDs' },
      { field: 'permissionsJson', flags: '--permissions-json <json>', description: 'JSON permissions object' },
    ],
  },
  endpoint: { method: 'POST', path: '/management/organizations/users/invite/members' },
  fieldMappings: {},
  handler: async (input, client) => {
    return client.request({
      method: 'POST',
      path: '/management/organizations/users/invite/members',
      body: {
        inviterEmail: input.inviterEmail,
        emails: (input.emails as string).split(',').map((s) => s.trim()),
        workspaceIds: (input.workspaceIds as string).split(',').map((s) => Number(s.trim())),
        permissions: JSON.parse(input.permissionsJson as string),
      },
    });
  },
};
