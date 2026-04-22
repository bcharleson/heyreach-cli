import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const campaignsUpdateSequenceCommand: CommandDefinition = {
  name: 'campaigns_update_sequence',
  group: 'campaigns',
  subcommand: 'update-sequence',
  description: 'Create or fully replace the sequence (automation workflow) of a campaign. For PAUSED campaigns, existing lead states are preserved where possible. SCHEDULED campaigns revert to DRAFT. Not allowed on ACTIVE or COMPLETED.',
  examples: [
    'heyreach campaigns update-sequence --campaign-id 123 --sequence-json \'{"nodeType":"CONNECTION_REQUEST","payload":{"messages":["Hi {{firstName}}"]},"conditionalNode":{"nodeType":"END"},"unconditionalNode":{"nodeType":"END"}}\'',
  ],
  inputSchema: z.object({
    campaignId: z.coerce.number().describe('Campaign ID'),
    sequenceJson: z.string().describe('PublicSequenceNodeDto JSON — root of the sequence tree (omit the implicit START node)'),
  }),
  cliMappings: {
    options: [
      { field: 'campaignId', flags: '--campaign-id <id>', description: 'Campaign ID' },
      { field: 'sequenceJson', flags: '--sequence-json <json>', description: 'PublicSequenceNodeDto JSON (root of tree)' },
    ],
  },
  endpoint: { method: 'POST', path: '/campaign/UpdateSequence' },
  fieldMappings: { campaignId: 'body', sequenceJson: 'body' },
  handler: async (input, client) => {
    const body: Record<string, unknown> = {
      campaignId: input.campaignId,
      sequence: JSON.parse(input.sequenceJson as string),
    };
    return client.request({ method: 'POST', path: '/campaign/UpdateSequence', body });
  },
};

