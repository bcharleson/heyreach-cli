import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const campaignsAddLeadsCommand: CommandDefinition = {
  name: 'campaigns_add_leads',
  group: 'campaigns',
  subcommand: 'add-leads',
  description: 'Add leads to a campaign (V2 — returns detailed counts). Up to 100 leads per request. Accepts JSON array via --leads-json.',
  examples: [
    'heyreach campaigns add-leads --campaign-id 123 --leads-json \'[{"lead":{"firstName":"Jane","lastName":"Doe","profileUrl":"https://linkedin.com/in/janedoe"}}]\'',
  ],
  inputSchema: z.object({
    campaignId: z.coerce.number().describe('Campaign ID'),
    leadsJson: z.string().describe('JSON array of accountLeadPairs'),
    resumeFinishedCampaign: z.coerce.boolean().optional().describe('Resume if campaign finished'),
    resumePausedCampaign: z.coerce.boolean().optional().describe('Resume if campaign paused'),
  }),
  cliMappings: {
    options: [
      { field: 'campaignId', flags: '--campaign-id <id>', description: 'Campaign ID' },
      { field: 'leadsJson', flags: '--leads-json <json>', description: 'JSON array of accountLeadPairs' },
      { field: 'resumeFinishedCampaign', flags: '--resume-finished', description: 'Resume if campaign finished' },
      { field: 'resumePausedCampaign', flags: '--resume-paused', description: 'Resume if campaign paused' },
    ],
  },
  endpoint: { method: 'POST', path: '/campaign/AddLeadsToCampaignV2' },
  fieldMappings: { campaignId: 'body', leadsJson: 'body', resumeFinishedCampaign: 'body', resumePausedCampaign: 'body' },
  handler: async (input, client) => {
    const accountLeadPairs = JSON.parse(input.leadsJson as string);
    const body: Record<string, unknown> = {
      campaignId: input.campaignId,
      accountLeadPairs,
    };
    if (input.resumeFinishedCampaign !== undefined) body.resumeFinishedCampaign = input.resumeFinishedCampaign;
    if (input.resumePausedCampaign !== undefined) body.resumePausedCampaign = input.resumePausedCampaign;
    return client.request({ method: 'POST', path: '/campaign/AddLeadsToCampaignV2', body });
  },
};
