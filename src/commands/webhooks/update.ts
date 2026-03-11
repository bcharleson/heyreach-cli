import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const webhooksUpdateCommand: CommandDefinition = {
  name: 'webhooks_update',
  group: 'webhooks',
  subcommand: 'update',
  description: 'Update an existing webhook. Only provided fields are changed.',
  examples: ['heyreach webhooks update --webhook-id 123 --name "Updated Name" --active false'],
  inputSchema: z.object({
    webhookId: z.coerce.number().describe('Webhook ID'),
    webhookName: z.string().optional().describe('New webhook name'),
    webhookUrl: z.string().optional().describe('New webhook URL'),
    eventType: z.string().optional().describe('New event type'),
    campaignIds: z.string().optional().describe('Comma-separated campaign IDs'),
    isActive: z.string().optional().describe('Active status: true/false'),
  }),
  cliMappings: {
    options: [
      { field: 'webhookId', flags: '--webhook-id <id>', description: 'Webhook ID' },
      { field: 'webhookName', flags: '--name <name>', description: 'New webhook name' },
      { field: 'webhookUrl', flags: '--url <url>', description: 'New webhook URL' },
      { field: 'eventType', flags: '--event-type <type>', description: 'New event type' },
      { field: 'campaignIds', flags: '--campaign-ids <list>', description: 'Comma-separated campaign IDs' },
      { field: 'isActive', flags: '--active <bool>', description: 'Active status (true/false)' },
    ],
  },
  endpoint: { method: 'PATCH', path: '/webhooks/UpdateWebhook' },
  fieldMappings: {},
  handler: async (input, client) => {
    const body: Record<string, unknown> = {};
    if (input.webhookName !== undefined) body.webhookName = input.webhookName;
    if (input.webhookUrl !== undefined) body.webhookUrl = input.webhookUrl;
    if (input.eventType !== undefined) body.eventType = input.eventType;
    if (input.campaignIds !== undefined) body.campaignIds = input.campaignIds.split(',').map((s: string) => Number(s.trim()));
    if (input.isActive !== undefined) body.isActive = input.isActive === 'true';
    return client.request({
      method: 'PATCH',
      path: '/webhooks/UpdateWebhook',
      query: { webhookId: input.webhookId },
      body,
    });
  },
};
