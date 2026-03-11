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
    startDate: z.string().describe('Start date (ISO 8601)'),
    endDate: z.string().describe('End date (ISO 8601)'),
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
    const body: Record<string, unknown> = {
      startDate: input.startDate,
      endDate: input.endDate,
    };
    if (input.accountIds) body.accountIds = input.accountIds.split(',').map((s: string) => Number(s.trim()));
    if (input.campaignIds) body.campaignIds = input.campaignIds.split(',').map((s: string) => Number(s.trim()));
    return client.request({ method: 'POST', path: '/stats/GetOverallStats', body });
  },
};
