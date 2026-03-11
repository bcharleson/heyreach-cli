import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const listsDeleteLeadsCommand: CommandDefinition = {
  name: 'lists_delete_leads',
  group: 'lists',
  subcommand: 'delete-leads',
  description: 'Delete leads from a list by LinkedIn member IDs.',
  examples: ['heyreach lists delete-leads --list-id 456 --member-ids "id1,id2,id3"'],
  inputSchema: z.object({
    listId: z.coerce.number().describe('List ID'),
    memberIds: z.string().describe('Comma-separated LinkedIn member IDs'),
  }),
  cliMappings: {
    options: [
      { field: 'listId', flags: '--list-id <id>', description: 'List ID' },
      { field: 'memberIds', flags: '--member-ids <list>', description: 'Comma-separated LinkedIn member IDs' },
    ],
  },
  endpoint: { method: 'DELETE', path: '/list/DeleteLeadsFromList' },
  fieldMappings: {},
  handler: async (input, client) => {
    const leadMemberIds = (input.memberIds as string).split(',').map((s) => s.trim());
    return client.request({
      method: 'DELETE',
      path: '/list/DeleteLeadsFromList',
      body: { listId: input.listId, leadMemberIds },
    });
  },
};
