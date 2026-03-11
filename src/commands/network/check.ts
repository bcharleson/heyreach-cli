import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const networkCheckCommand: CommandDefinition = {
  name: 'network_check',
  group: 'network',
  subcommand: 'check',
  description: 'Check if a lead is a connection of a sender. Provide exactly one of --profile-url or --linkedin-id.',
  examples: [
    'heyreach network check --sender-id 123 --profile-url "https://linkedin.com/in/janedoe"',
    'heyreach network check --sender-id 123 --linkedin-id "ABC123"',
  ],
  inputSchema: z.object({
    senderAccountId: z.coerce.number().describe('LinkedIn sender account ID'),
    leadProfileUrl: z.string().optional().describe('Lead LinkedIn profile URL'),
    leadLinkedInId: z.string().optional().describe('Lead LinkedIn member ID'),
  }),
  cliMappings: {
    options: [
      { field: 'senderAccountId', flags: '--sender-id <id>', description: 'LinkedIn sender account ID' },
      { field: 'leadProfileUrl', flags: '--profile-url <url>', description: 'Lead LinkedIn profile URL' },
      { field: 'leadLinkedInId', flags: '--linkedin-id <id>', description: 'Lead LinkedIn member ID' },
    ],
  },
  endpoint: { method: 'POST', path: '/MyNetwork/IsConnection' },
  fieldMappings: { senderAccountId: 'body', leadProfileUrl: 'body', leadLinkedInId: 'body' },
  handler: async (input, client) => {
    const body: Record<string, unknown> = { senderAccountId: input.senderAccountId };
    if (input.leadProfileUrl) body.leadProfileUrl = input.leadProfileUrl;
    if (input.leadLinkedInId) body.leadLinkedInId = input.leadLinkedInId;
    return client.request({ method: 'POST', path: '/MyNetwork/IsConnection', body });
  },
};
