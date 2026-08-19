import { createInterface } from 'node:readline/promises';
import { Command } from 'commander';
import { createClient } from '../../core/client.js';
import { resolveOrgAuth, resolveProvidedApiKey, resolveProvidedOrgKey } from '../../core/auth.js';
import { persistLoginSession, defaultConfigHintPath, defaultProfileHintPath } from '../../core/login-store.js';
import { findOrgWorkspaceName, parseWorkspaceId, requireWorkspaceId } from '../../core/workspace.js';
import { getConfigPath, saveConfig } from '../../core/config.js';
import { output, outputError } from '../../core/output.js';
import { formatError } from '../../core/errors.js';
import type { GlobalOptions } from '../../core/types.js';

const PUBLIC_BASE = 'https://api.heyreach.io/api/public';

async function resolveWorkspaceName(options: {
  workspaceId: number;
  workspaceName?: string;
  orgKey?: string;
}): Promise<string> {
  if (options.workspaceName?.trim()) return options.workspaceName.trim();
  try {
    const orgAuth = resolveOrgAuth({ orgKey: options.orgKey });
    const client = createClient(orgAuth);
    const raw = await client.request({
      method: 'GET',
      path: '/management/organizations/workspaces',
      query: { Offset: 0, Limit: 100 },
    });
    return findOrgWorkspaceName(raw, options.workspaceId) ?? '';
  } catch {
    return '';
  }
}

export function registerLoginCommand(program: Command): void {
  program
    .command('login')
    .description(
      'Validate a workspace key (CheckApiKey) and store it. Default writes ~/.heyreach/config.json. ' +
        '--profile writes only ~/.heyreach/profiles/<slug>.json and requires --workspace <id>.',
    )
    .option('--org', 'Store Organization API key instead of workspace key')
    .option('--api-key <key>', 'HeyReach workspace API key')
    .option('--org-key <key>', 'HeyReach Organization API key')
    .option('--profile <slug>', 'Save as a named workspace profile (does not write config.json)')
    .option('--workspace <id>', 'Numeric HeyReach workspace id to bind (required with --profile)')
    .option('--workspace-name <name>', 'Optional workspace display name (CheckApiKey cannot whoami)')
    .addHelpText(
      'after',
      '\nExamples:\n' +
        '  $ heyreach login --api-key <key>\n' +
        '  $ heyreach login --api-key <key> --workspace 123 --workspace-name "House org"\n' +
        '  $ heyreach login --profile client-a --api-key <key> --workspace 123\n' +
        '  $ heyreach login --org --org-key <key>\n' +
        '  $ heyreach login  # interactive prompt',
    )
    .action(async (opts) => {
      const globalOpts = program.opts() as GlobalOptions;
      const isOrg = Boolean(opts.org);
      const profileSlug = (opts.profile || globalOpts.profile) as string | undefined;

      try {
        if (isOrg) {
          if (profileSlug) {
            outputError(
              { error: 'Organization keys cannot be stored in a client profile.', code: 'VALIDATION_ERROR' },
              globalOpts,
            );
            return;
          }
          let orgKey = resolveProvidedOrgKey(opts.orgKey, globalOpts.orgKey);
          if (!orgKey) {
            const rl = createInterface({ input: process.stdin, output: process.stderr });
            orgKey = (await rl.question('Organization API key: ')).trim();
            rl.close();
          }
          if (!orgKey) {
            outputError({ error: 'API key is required.', code: 'VALIDATION_ERROR' }, globalOpts);
            return;
          }
          try {
            const client = createClient({ apiKey: orgKey, baseUrl: PUBLIC_BASE });
            await client.request({ method: 'GET', path: '/organization/GetWorkspaces' });
          } catch {
            outputError(
              { error: 'Invalid Organization API key. Check your key and try again.', code: 'AUTH_ERROR' },
              globalOpts,
            );
            return;
          }
          saveConfig({ org_api_key: orgKey });
          output(
            { success: true, message: 'Credentials saved and verified.', config_path: getConfigPath() },
            globalOpts,
          );
          return;
        }

        let apiKey = resolveProvidedApiKey(opts.apiKey, globalOpts.apiKey);
        if (!apiKey) {
          const rl = createInterface({ input: process.stdin, output: process.stderr });
          apiKey = (await rl.question('HeyReach API key: ')).trim();
          rl.close();
        }
        if (!apiKey) {
          outputError({ error: 'API key is required.', code: 'VALIDATION_ERROR' }, globalOpts);
          return;
        }

        const rawWorkspace = opts.workspace ?? globalOpts.workspace;
        let workspaceId: number | undefined;
        if (profileSlug) {
          workspaceId = requireWorkspaceId(rawWorkspace);
        } else if (rawWorkspace !== undefined && rawWorkspace !== '') {
          workspaceId = requireWorkspaceId(rawWorkspace);
        } else {
          workspaceId = parseWorkspaceId(rawWorkspace);
        }

        try {
          const client = createClient({ apiKey, baseUrl: PUBLIC_BASE });
          await client.request({ method: 'GET', path: '/auth/CheckApiKey' });
        } catch {
          outputError(
            { error: 'Invalid API key. Check your key and try again.', code: 'AUTH_ERROR' },
            globalOpts,
          );
          return;
        }

        const workspaceName =
          workspaceId !== undefined
            ? await resolveWorkspaceName({
                workspaceId,
                workspaceName: opts.workspaceName,
                orgKey: resolveProvidedOrgKey(opts.orgKey, globalOpts.orgKey),
              })
            : opts.workspaceName?.trim();

        const persisted = persistLoginSession({
          apiKey,
          profileSlug,
          workspaceId,
          workspaceName,
        });

        const hintPath = profileSlug ? defaultProfileHintPath(profileSlug) : defaultConfigHintPath();
        output(
          {
            success: true,
            message: 'Credentials saved and verified.',
            profile: profileSlug ?? 'default',
            workspace_id: persisted.workspace_id ?? null,
            workspace_name: persisted.workspace_name ?? null,
            config_path: hintPath,
            stored_at: persisted.stored_at,
            default_config_written: !profileSlug,
          },
          globalOpts,
        );
      } catch (err) {
        outputError(formatError(err), globalOpts);
      }
    });
}
