import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { allCommands } from './commands/index.js';
import { buildAuthStatus } from './commands/auth/status.js';
import { resolveCredentials } from './core/auth.js';
import { createCommandContext } from './core/command-context.js';
import { isMutatingCommand } from './core/mutating.js';
import { formatError } from './core/errors.js';
import { getCliVersion } from './version.js';

const MCP_AGENCY_READ_HINT =
  ' Agency: pass profile (client slug). Confirm status (profile, workspace_id, workspace_name) first. One process, one profile.';
const MCP_AGENCY_WRITE_HINT =
  " Agency: pass profile (client slug) and workspace_id matching that profile's bound workspace. Confirm status first. One process, one profile.";

const isolationShape = {
  profile: z
    .string()
    .optional()
    .describe(
      'Named client profile slug. Agency: pass this on every tool (or set HEYREACH_PROFILE). ' +
        'One process, one profile. Do not pass multiple slugs.',
    ),
  workspace_id: z
    .union([z.string(), z.number()])
    .optional()
    .describe(
      'Numeric workspace id bound to that profile. Mutating tools require profile + workspace_id matching the bound pair. ' +
        'On the default single-key path, when passed must match the bound id if one was stamped at login.',
    ),
};

function isolationFromArgs(args: Record<string, unknown>): {
  profile?: string;
  workspace_id?: string | number;
  input: Record<string, unknown>;
} {
  const { profile, workspace_id, ...input } = args;
  return {
    profile: typeof profile === 'string' ? profile : undefined,
    workspace_id:
      typeof workspace_id === 'string' || typeof workspace_id === 'number' ? workspace_id : undefined,
    input,
  };
}

export async function startMcpFromCli(): Promise<void> {
  // Fail fast if no credential source exists. Per-call `profile` can still
  // select a named workspace; we never iterate profiles here.
  resolveCredentials({ profile: process.env.HEYREACH_PROFILE });

  const server = new McpServer({
    name: 'heyreach',
    version: getCliVersion(),
  });

  for (const cmdDef of allCommands) {
    const zodShape: Record<string, unknown> = {};
    const shape = cmdDef.inputSchema.shape as Record<string, unknown>;
    for (const [key, val] of Object.entries(shape)) {
      zodShape[key] = val;
    }
    Object.assign(zodShape, isolationShape);

    const mutating = isMutatingCommand(cmdDef);
    const isOrg = cmdDef.group === 'org';

    server.tool(
      cmdDef.name,
      `${cmdDef.description}${mutating ? MCP_AGENCY_WRITE_HINT : MCP_AGENCY_READ_HINT}`,
      zodShape,
      async (args: Record<string, unknown>) => {
        try {
          const { profile, workspace_id, input } = isolationFromArgs(args);
          const parsed = cmdDef.inputSchema.safeParse(input);
          if (!parsed.success) {
            return {
              content: [
                {
                  type: 'text' as const,
                  text: JSON.stringify({ error: parsed.error.message, code: 'VALIDATION_ERROR' }),
                },
              ],
              isError: true,
            };
          }
          const { client } = createCommandContext({
            profile,
            workspace: workspace_id,
            mutating,
            orgCommand: isOrg,
          });
          const result = await cmdDef.handler(parsed.data, client);
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          };
        } catch (error: unknown) {
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(formatError(error)) }],
            isError: true,
          };
        }
      },
    );
  }

  server.tool(
    'status',
    'Show source, profile slug (or default), workspace_id, and workspace_name. Confirm this bound pair before any other command. Never prints the API key. Agency: pass profile.',
    { profile: isolationShape.profile },
    async (args: Record<string, unknown>) => {
      try {
        const result = await buildAuthStatus({
          profile: typeof args.profile === 'string' ? args.profile : undefined,
        });
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
          isError: result.authenticated === false,
        };
      } catch (error: unknown) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(formatError(error)) }],
          isError: true,
        };
      }
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
