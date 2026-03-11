import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const listsDeleteLeadsByUrlCommand: CommandDefinition = {
  name: 'lists_delete_leads_by_url',
  group: 'lists',
  subcommand: 'delete-leads-by-url',
  description: 'Delete leads from a list by LinkedIn profile URLs.',
  examples: ['heyreach lists delete-leads-by-url --list-id 456 --urls "https://linkedin.com/in/jane,https://linkedin.com/in/john"'],
  inputSchema: z.object({
    listId: z.coerce.number().describe('List ID'),
    urls: z.string().describe('Comma-separated LinkedIn profile URLs'),
  }),
  cliMappings: {
    options: [
      { field: 'listId', flags: '--list-id <id>', description: 'List ID' },
      { field: 'urls', flags: '--urls <list>', description: 'Comma-separated LinkedIn profile URLs' },
    ],
  },
  endpoint: { method: 'DELETE', path: '/list/DeleteLeadsFromListByProfileUrl' },
  fieldMappings: {},
  handler: async (input, client) => {
    const profileUrls = (input.urls as string).split(',').map((s) => s.trim());
    return client.request({
      method: 'DELETE',
      path: '/list/DeleteLeadsFromListByProfileUrl',
      body: { listId: input.listId, profileUrls },
    });
  },
};
