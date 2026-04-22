import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const campaignsUpdateAccountsCommand: CommandDefinition = {
  name: 'campaigns_update_accounts',
  group: 'campaigns',
  subcommand: 'update-accounts',
  description: 'Replace the entire list of LinkedIn sender accounts on a campaign (full replacement, not merge). SCHEDULED campaigns revert to DRAFT. Not allowed on ACTIVE or COMPLETED.',
  examples: [
    'heyreach campaigns update-accounts --campaign-id 123 --account-ids "456,789"',
  ],
  inputSchema: z.object({
    campaignId: z.coerce.number().describe('Campaign ID'),
    accountIds: z.string().describe('Comma-separated LinkedIn sender account IDs (1-100, full replacement)'),
  }),
  cliMappings: {
    options: [
      { field: 'campaignId', flags: '--campaign-id <id>', description: 'Campaign ID' },
      { field: 'accountIds', flags: '--account-ids <list>', description: 'Comma-separated LinkedIn sender account IDs (full replacement)' },
    ],
  },
  endpoint: { method: 'POST', path: '/campaign/UpdateAccounts' },
  fieldMappings: { campaignId: 'body', accountIds: 'body' },
  handler: async (input, client) => {
    const body: Record<string, unknown> = {
      campaignId: input.campaignId,
      linkedInAccountIds: (input.accountIds as string).split(',').map((s: string) => Number(s.trim())),
    };
    return client.request({ method: 'POST', path: '/campaign/UpdateAccounts', body });
  },
};

