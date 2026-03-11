import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const orgCreateWorkspaceCommand: CommandDefinition = {
  name: 'org_create_workspace',
  group: 'org',
  subcommand: 'create-workspace',
  description: 'Create a new workspace in your organization.',
  examples: ['heyreach org create-workspace --name "Sales Team" --seats-limit 10'],
  inputSchema: z.object({
    workspaceName: z.string().describe('Workspace name'),
    seatsLimit: z.coerce.number().optional().describe('Seat limit (null = unlimited)'),
  }),
  cliMappings: {
    options: [
      { field: 'workspaceName', flags: '--name <name>', description: 'Workspace name' },
      { field: 'seatsLimit', flags: '--seats-limit <number>', description: 'Seat limit' },
    ],
  },
  endpoint: { method: 'POST', path: '/management/organizations/workspaces' },
  fieldMappings: { workspaceName: 'body', seatsLimit: 'body' },
  handler: (input, client) => executeCommand(orgCreateWorkspaceCommand, input, client),
};
