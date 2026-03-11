import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const webhooksGetCommand: CommandDefinition = {
  name: 'webhooks_get',
  group: 'webhooks',
  subcommand: 'get',
  description: 'Get a webhook by ID.',
  examples: ['heyreach webhooks get --webhook-id 123 --pretty'],
  inputSchema: z.object({
    webhookId: z.coerce.number().describe('Webhook ID'),
  }),
  cliMappings: {
    options: [
      { field: 'webhookId', flags: '--webhook-id <id>', description: 'Webhook ID' },
    ],
  },
  endpoint: { method: 'GET', path: '/webhooks/GetWebhookById' },
  fieldMappings: { webhookId: 'query' },
  handler: (input, client) => executeCommand(webhooksGetCommand, input, client),
};
