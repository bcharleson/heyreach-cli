import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const leadsGetTagsCommand: CommandDefinition = {
  name: 'leads_get_tags',
  group: 'leads',
  subcommand: 'get-tags',
  description: 'Get tags for a lead, alphabetically sorted.',
  examples: ['heyreach leads get-tags --profile-url "https://linkedin.com/in/janedoe"'],
  inputSchema: z.object({
    profileUrl: z.string().describe('LinkedIn profile URL'),
  }),
  cliMappings: {
    options: [
      { field: 'profileUrl', flags: '--profile-url <url>', description: 'LinkedIn profile URL' },
    ],
  },
  endpoint: { method: 'POST', path: '/lead/GetTags' },
  fieldMappings: { profileUrl: 'body' },
  handler: (input, client) => executeCommand(leadsGetTagsCommand, input, client),
};
