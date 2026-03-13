import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';
import { ValidationError } from '../../core/errors.js';

export const listsGetForLeadCommand: CommandDefinition = {
  name: 'lists_get_for_lead',
  group: 'lists',
  subcommand: 'get-for-lead',
  description: 'Get lists associated with a specific lead.',
  examples: ['heyreach lists get-for-lead --profile-url "https://linkedin.com/in/janedoe"'],
  inputSchema: z.object({
    offset: z.coerce.number().default(0).describe('Pagination offset'),
    limit: z.coerce.number().min(1).max(100).default(100).describe('Items per page'),
    email: z.string().optional().describe('Lead email'),
    linkedinId: z.string().optional().describe('Lead LinkedIn ID'),
    profileUrl: z.string().optional().describe('Lead LinkedIn profile URL'),
  }),
  cliMappings: {
    options: [
      { field: 'offset', flags: '--offset <number>', description: 'Pagination offset' },
      { field: 'limit', flags: '--limit <number>', description: 'Items per page' },
      { field: 'email', flags: '--email <email>', description: 'Lead email' },
      { field: 'linkedinId', flags: '--linkedin-id <id>', description: 'Lead LinkedIn ID' },
      { field: 'profileUrl', flags: '--profile-url <url>', description: 'Lead profile URL' },
    ],
  },
  endpoint: { method: 'POST', path: '/list/GetListsForLead' },
  fieldMappings: { offset: 'body', limit: 'body', email: 'body', linkedinId: 'body', profileUrl: 'body' },
  handler: (input, client) => {
    if (!input.email && !input.linkedinId && !input.profileUrl) {
      throw new ValidationError('At least one of --email, --linkedin-id, or --profile-url is required.');
    }
    return executeCommand(listsGetForLeadCommand, input, client);
  },
};
