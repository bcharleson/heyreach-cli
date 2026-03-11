import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const inboxGetCommand: CommandDefinition = {
  name: 'inbox_get',
  group: 'inbox',
  subcommand: 'get',
  description: 'Get a LinkedIn conversation with messages by account ID and conversation ID.',
  examples: ['heyreach inbox get --account-id 123 --conversation-id "abc-def"'],
  inputSchema: z.object({
    accountId: z.coerce.number().describe('LinkedIn account ID'),
    conversationId: z.string().describe('Conversation ID'),
  }),
  cliMappings: {
    options: [
      { field: 'accountId', flags: '--account-id <id>', description: 'LinkedIn account ID' },
      { field: 'conversationId', flags: '--conversation-id <id>', description: 'Conversation ID' },
    ],
  },
  endpoint: { method: 'GET', path: '/inbox/GetChatroom/{accountId}/{conversationId}' },
  fieldMappings: { accountId: 'path', conversationId: 'path' },
  handler: async (input, client) => {
    return client.request({
      method: 'GET',
      path: `/inbox/GetChatroom/${encodeURIComponent(String(input.accountId))}/${encodeURIComponent(String(input.conversationId))}`,
    });
  },
};
