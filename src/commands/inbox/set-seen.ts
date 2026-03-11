import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const inboxSetSeenCommand: CommandDefinition = {
  name: 'inbox_set_seen',
  group: 'inbox',
  subcommand: 'set-seen',
  description: 'Mark a conversation as seen or unseen.',
  examples: ['heyreach inbox set-seen --conversation-id "abc" --account-id 123 --seen true'],
  inputSchema: z.object({
    conversationId: z.string().describe('Conversation ID'),
    linkedInAccountId: z.coerce.number().describe('LinkedIn account ID'),
    seen: z.coerce.boolean().describe('Mark as seen (true) or unseen (false)'),
  }),
  cliMappings: {
    options: [
      { field: 'conversationId', flags: '--conversation-id <id>', description: 'Conversation ID' },
      { field: 'linkedInAccountId', flags: '--account-id <id>', description: 'LinkedIn account ID' },
      { field: 'seen', flags: '--seen <bool>', description: 'Seen status (true/false)' },
    ],
  },
  endpoint: { method: 'POST', path: '/inbox/SetSeenStatus' },
  fieldMappings: { conversationId: 'body', linkedInAccountId: 'body', seen: 'body' },
  handler: (input, client) => executeCommand(inboxSetSeenCommand, input, client),
};
