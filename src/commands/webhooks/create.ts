import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const webhooksCreateCommand: CommandDefinition = {
  name: 'webhooks_create',
  group: 'webhooks',
  subcommand: 'create',
  description: 'Create a webhook. Event types: CONNECTION_REQUEST_SENT, CONNECTION_REQUEST_ACCEPTED, MESSAGE_SENT, MESSAGE_REPLY_RECEIVED, INMAIL_SENT, INMAIL_REPLY_RECEIVED, EVERY_MESSAGE_REPLY_RECEIVED, FOLLOW_SENT, LIKED_POST, VIEWED_PROFILE, CAMPAIGN_COMPLETED, LEAD_TAG_UPDATED.',
  examples: ['heyreach webhooks create --name "Replies" --url "https://example.com/hook" --event-type MESSAGE_REPLY_RECEIVED'],
  inputSchema: z.object({
    webhookName: z.string().describe('Webhook name'),
    webhookUrl: z.string().describe('Webhook URL'),
    eventType: z.string().describe('Event type'),
    campaignIds: z.string().optional().describe('Comma-separated campaign IDs (empty = all)'),
  }),
  cliMappings: {
    options: [
      { field: 'webhookName', flags: '--name <name>', description: 'Webhook name' },
      { field: 'webhookUrl', flags: '--url <url>', description: 'Webhook URL' },
      { field: 'eventType', flags: '--event-type <type>', description: 'Event type' },
      { field: 'campaignIds', flags: '--campaign-ids <list>', description: 'Comma-separated campaign IDs' },
    ],
  },
  endpoint: { method: 'POST', path: '/webhooks/CreateWebhook' },
  fieldMappings: {},
  handler: async (input, client) => {
    const body: Record<string, unknown> = {
      webhookName: input.webhookName,
      webhookUrl: input.webhookUrl,
      eventType: input.eventType,
    };
    if (input.campaignIds) body.campaignIds = input.campaignIds.split(',').map((s: string) => Number(s.trim()));
    return client.request({ method: 'POST', path: '/webhooks/CreateWebhook', body });
  },
};
