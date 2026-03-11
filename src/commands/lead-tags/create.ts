import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const leadTagsCreateCommand: CommandDefinition = {
  name: 'lead_tags_create',
  group: 'lead-tags',
  subcommand: 'create',
  description: 'Create one or multiple tags for your workspace. Colors: Blue, Green, Purple, Pink, Red, Cyan, Yellow, Orange.',
  examples: ['heyreach lead-tags create --tags-json \'[{"displayName":"VIP","color":"Purple"}]\''],
  inputSchema: z.object({
    tagsJson: z.string().describe('JSON array of tag objects with displayName and color'),
  }),
  cliMappings: {
    options: [
      { field: 'tagsJson', flags: '--tags-json <json>', description: 'JSON array of {displayName, color} objects' },
    ],
  },
  endpoint: { method: 'POST', path: '/lead_tags/CreateTags' },
  fieldMappings: {},
  handler: async (input, client) => {
    const tags = JSON.parse(input.tagsJson as string);
    return client.request({
      method: 'POST',
      path: '/lead_tags/CreateTags',
      body: { tags },
    });
  },
};
