import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const inboxSendCommand: CommandDefinition = {
  name: 'inbox_send',
  group: 'inbox',
  subcommand: 'send',
  description: 'Send a message to a LinkedIn conversation.',
  examples: ['heyreach inbox send --conversation-id "abc" --account-id 123 --message "Hello!"'],
  inputSchema: z.object({
    message: z.string().describe('Message text'),
    conversationId: z.string().describe('Conversation ID'),
    linkedInAccountId: z.coerce.number().describe('LinkedIn account ID'),
    subject: z.string().optional().describe('Message subject'),
  }),
  cliMappings: {
    options: [
      { field: 'message', flags: '--message <text>', description: 'Message text' },
      { field: 'conversationId', flags: '--conversation-id <id>', description: 'Conversation ID' },
      { field: 'linkedInAccountId', flags: '--account-id <id>', description: 'LinkedIn account ID' },
      { field: 'subject', flags: '--subject <text>', description: 'Message subject' },
    ],
  },
  endpoint: { method: 'POST', path: '/inbox/SendMessage' },
  fieldMappings: { message: 'body', conversationId: 'body', linkedInAccountId: 'body', subject: 'body' },
  handler: (input, client) => executeCommand(inboxSendCommand, input, client),
};
