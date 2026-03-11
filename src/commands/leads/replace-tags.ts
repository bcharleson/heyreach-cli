import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const leadsReplaceTagsCommand: CommandDefinition = {
  name: 'leads_replace_tags',
  group: 'leads',
  subcommand: 'replace-tags',
  description: 'Remove existing tags and replace with new tags.',
  examples: ['heyreach leads replace-tags --profile-url "https://linkedin.com/in/jane" --tags "vip,enterprise"'],
  inputSchema: z.object({
    tags: z.string().describe('Comma-separated tag names'),
    createTagIfNotExisting: z.coerce.boolean().default(true).describe('Create tag if it does not exist'),
    leadProfileUrl: z.string().optional().describe('Lead LinkedIn profile URL'),
    leadLinkedInId: z.string().optional().describe('Lead LinkedIn member ID'),
  }),
  cliMappings: {
    options: [
      { field: 'tags', flags: '--tags <list>', description: 'Comma-separated tag names' },
      { field: 'createTagIfNotExisting', flags: '--create-if-missing', description: 'Create tag if it does not exist' },
      { field: 'leadProfileUrl', flags: '--profile-url <url>', description: 'Lead LinkedIn profile URL' },
      { field: 'leadLinkedInId', flags: '--linkedin-id <id>', description: 'Lead LinkedIn member ID' },
    ],
  },
  endpoint: { method: 'POST', path: '/lead/ReplaceTags' },
  fieldMappings: {},
  handler: async (input, client) => {
    const tagList = (input.tags as string).split(',').map((s) => s.trim());
    const body: Record<string, unknown> = {
      tags: tagList,
      createTagIfNotExisting: input.createTagIfNotExisting,
    };
    if (input.leadProfileUrl) body.leadProfileUrl = input.leadProfileUrl;
    if (input.leadLinkedInId) body.leadLinkedInId = input.leadLinkedInId;
    return client.request({ method: 'POST', path: '/lead/ReplaceTags', body });
  },
};
