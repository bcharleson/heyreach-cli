import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const leadsGetCommand: CommandDefinition = {
  name: 'leads_get',
  group: 'leads',
  subcommand: 'get',
  description: 'Get lead details by LinkedIn profile URL.',
  examples: ['heyreach leads get --profile-url "https://linkedin.com/in/janedoe" --pretty'],
  inputSchema: z.object({
    profileUrl: z.string().describe('LinkedIn profile URL'),
  }),
  cliMappings: {
    options: [
      { field: 'profileUrl', flags: '--profile-url <url>', description: 'LinkedIn profile URL' },
    ],
  },
  endpoint: { method: 'POST', path: '/lead/GetLead' },
  fieldMappings: { profileUrl: 'body' },
  handler: (input, client) => executeCommand(leadsGetCommand, input, client),
};
