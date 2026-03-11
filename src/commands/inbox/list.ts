import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const inboxListCommand: CommandDefinition = {
  name: 'inbox_list',
  group: 'inbox',
  subcommand: 'list',
  description: 'Get a paginated list of LinkedIn conversations. Up to 100 per request.',
  examples: [
    'heyreach inbox list --pretty',
    'heyreach inbox list --search "product demo" --seen false',
  ],
  inputSchema: z.object({
    offset: z.coerce.number().default(0).describe('Pagination offset'),
    limit: z.coerce.number().min(1).max(100).default(100).describe('Items per page'),
    linkedInAccountIds: z.string().optional().describe('Comma-separated LinkedIn account IDs'),
    campaignIds: z.string().optional().describe('Comma-separated campaign IDs'),
    searchString: z.string().optional().describe('Search conversations'),
    leadLinkedInId: z.string().optional().describe('Filter by lead LinkedIn ID'),
    leadProfileUrl: z.string().optional().describe('Filter by lead profile URL'),
    tags: z.string().optional().describe('Comma-separated lead tags'),
    seen: z.string().optional().describe('Filter by seen status: true/false'),
  }),
  cliMappings: {
    options: [
      { field: 'offset', flags: '--offset <number>', description: 'Pagination offset' },
      { field: 'limit', flags: '--limit <number>', description: 'Items per page' },
      { field: 'linkedInAccountIds', flags: '--account-ids <list>', description: 'Comma-separated LinkedIn account IDs' },
      { field: 'campaignIds', flags: '--campaign-ids <list>', description: 'Comma-separated campaign IDs' },
      { field: 'searchString', flags: '--search <text>', description: 'Search conversations' },
      { field: 'leadLinkedInId', flags: '--lead-linkedin-id <id>', description: 'Filter by lead LinkedIn ID' },
      { field: 'leadProfileUrl', flags: '--lead-profile-url <url>', description: 'Filter by lead profile URL' },
      { field: 'tags', flags: '--tags <list>', description: 'Comma-separated lead tags' },
      { field: 'seen', flags: '--seen <bool>', description: 'Filter by seen status' },
    ],
  },
  endpoint: { method: 'POST', path: '/inbox/GetConversationsV2' },
  fieldMappings: {},
  handler: async (input, client) => {
    const filters: Record<string, unknown> = {};
    if (input.linkedInAccountIds) filters.linkedInAccountIds = input.linkedInAccountIds.split(',').map((s: string) => Number(s.trim()));
    if (input.campaignIds) filters.campaignIds = input.campaignIds.split(',').map((s: string) => Number(s.trim()));
    if (input.searchString) filters.searchString = input.searchString;
    if (input.leadLinkedInId) filters.leadLinkedInId = input.leadLinkedInId;
    if (input.leadProfileUrl) filters.leadProfileUrl = input.leadProfileUrl;
    if (input.tags) filters.tags = input.tags.split(',').map((s: string) => s.trim());
    if (input.seen !== undefined) filters.seen = input.seen === 'true';
    return client.request({
      method: 'POST',
      path: '/inbox/GetConversationsV2',
      body: { offset: input.offset, limit: input.limit, filters },
    });
  },
};
