import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const statsOverviewCommand: CommandDefinition = {
  name: 'stats_overview',
  group: 'stats',
  subcommand: 'overview',
  description: 'Get overall stats with day-by-day breakdown for specified date range.',
  examples: [
    'heyreach stats overview --start-date 2025-01-01 --end-date 2025-01-31 --pretty',
    'heyreach stats overview --start-date 2025-01-01 --end-date 2025-01-31 --campaign-ids "1,2,3"',
  ],
  inputSchema: z.object({
    startDate: z.string().optional().describe('Start date (ISO 8601). Defaults to 30 days ago.'),
    endDate: z.string().optional().describe('End date (ISO 8601). Defaults to today.'),
    accountIds: z.string().optional().describe('Comma-separated LinkedIn account IDs (empty = all)'),
    campaignIds: z.string().optional().describe('Comma-separated campaign IDs (empty = all)'),
  }),
  cliMappings: {
    options: [
      { field: 'startDate', flags: '--start-date <iso>', description: 'Start date (ISO 8601)' },
      { field: 'endDate', flags: '--end-date <iso>', description: 'End date (ISO 8601)' },
      { field: 'accountIds', flags: '--account-ids <list>', description: 'Comma-separated LinkedIn account IDs' },
      { field: 'campaignIds', flags: '--campaign-ids <list>', description: 'Comma-separated campaign IDs' },
    ],
  },
  endpoint: { method: 'POST', path: '/stats/GetOverallStats' },
  fieldMappings: {},
  handler: async (input, client) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const body: Record<string, unknown> = {
      startDate: input.startDate ?? thirtyDaysAgo.toISOString(),
      endDate: input.endDate ?? now.toISOString(),
      accountIds: input.accountIds ? input.accountIds.split(',').map((s: string) => Number(s.trim())) : [],
      campaignIds: input.campaignIds ? input.campaignIds.split(',').map((s: string) => Number(s.trim())) : [],
    };
    return client.request({ method: 'POST', path: '/stats/GetOverallStats', body });
  },
};
