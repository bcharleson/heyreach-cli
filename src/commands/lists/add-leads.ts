import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const listsAddLeadsCommand: CommandDefinition = {
  name: 'lists_add_leads',
  group: 'lists',
  subcommand: 'add-leads',
  description: 'Add leads to a lead list (V2 — returns detailed counts). Up to 100 per request. Accepts JSON array via --leads-json.',
  examples: [
    'heyreach lists add-leads --list-id 456 --leads-json \'[{"firstName":"Jane","lastName":"Doe","profileUrl":"https://linkedin.com/in/janedoe"}]\'',
  ],
  inputSchema: z.object({
    listId: z.coerce.number().describe('List ID'),
    leadsJson: z.string().describe('JSON array of lead objects'),
  }),
  cliMappings: {
    options: [
      { field: 'listId', flags: '--list-id <id>', description: 'List ID' },
      { field: 'leadsJson', flags: '--leads-json <json>', description: 'JSON array of lead objects' },
    ],
  },
  endpoint: { method: 'POST', path: '/list/AddLeadsToListV2' },
  fieldMappings: {},
  handler: async (input, client) => {
    const leads = JSON.parse(input.leadsJson as string);
    return client.request({
      method: 'POST',
      path: '/list/AddLeadsToListV2',
      body: { listId: input.listId, leads },
    });
  },
};
