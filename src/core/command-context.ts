import { createClient } from './client.js';
import { BASE_URL, resolveCredentials, resolveOrgAuth, type ResolvedCredentials } from './auth.js';
import {
  assertWriteWorkspace,
  assertWorkspaceMatchesBound,
  parseWorkspaceId,
  requireWorkspaceId,
} from './workspace.js';
import type { HeyReachClient } from './types.js';

export interface CommandContextOptions {
  apiKey?: string;
  orgKey?: string;
  profile?: string;
  workspace?: string | number;
  mutating: boolean;
  orgCommand?: boolean;
}

export interface CommandContext {
  client: HeyReachClient;
  credentials: ResolvedCredentials;
}

/**
 * Build the HTTP client for a single command invocation.
 * One process, one workspace. CheckApiKey cannot whoami — gates use the bound id only.
 * Writes under a profile require `--workspace` matching that bound numeric id, before HTTP.
 */
export function createCommandContext(opts: CommandContextOptions): CommandContext {
  if (opts.orgCommand) {
    const auth = resolveOrgAuth({ orgKey: opts.orgKey });
    return {
      client: createClient(auth),
      credentials: { apiKey: auth.apiKey, source: 'organization API key' },
    };
  }

  const credentials = resolveCredentials({
    apiKey: opts.apiKey,
    profile: opts.profile,
  });
  const client = createClient({ apiKey: credentials.apiKey, baseUrl: BASE_URL });
  const rawFlag = opts.workspace;
  const workspaceFlag =
    rawFlag === undefined || rawFlag === ''
      ? undefined
      : requireWorkspaceId(rawFlag);

  if (credentials.profile) {
    if (opts.mutating) {
      assertWriteWorkspace(credentials.profile, workspaceFlag);
    } else if (workspaceFlag !== undefined) {
      assertWorkspaceMatchesBound(
        credentials.profile.workspace_id,
        workspaceFlag,
        credentials.profile.workspace_name,
      );
    }
    return { client, credentials };
  }

  // Default single-key path: --workspace is optional. Omitted = today's behavior.
  // If a bound id was stamped on default login and --workspace is passed, they must match.
  if (workspaceFlag !== undefined && credentials.boundWorkspace) {
    assertWorkspaceMatchesBound(
      credentials.boundWorkspace.id,
      workspaceFlag,
      credentials.boundWorkspace.name,
    );
  }

  return { client, credentials };
}

export function parseOptionalWorkspaceFlag(value: unknown): number | undefined {
  return parseWorkspaceId(value);
}
