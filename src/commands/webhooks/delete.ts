import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const webhooksDeleteCommand: CommandDefinition = {
  name: 'webhooks_delete',
  group: 'webhooks',
  subcommand: 'delete',
  description: 'Delete a webhook.',
  examples: ['heyreach webhooks delete --webhook-id 123'],
  inputSchema: z.object({
    webhookId: z.coerce.number().describe('Webhook ID'),
  }),
  cliMappings: {
    options: [
      { field: 'webhookId', flags: '--webhook-id <id>', description: 'Webhook ID' },
    ],
  },
  endpoint: { method: 'DELETE', path: '/webhooks/DeleteWebhook' },
  fieldMappings: { webhookId: 'query' },
  handler: (input, client) => executeCommand(webhooksDeleteCommand, input, client),
};
