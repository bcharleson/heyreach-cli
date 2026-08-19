import { Command } from 'commander';
import { resolveProvidedApiKey } from '../../core/auth.js';
import { persistLoginSession, defaultProfileHintPath } from '../../core/login-store.js';
import { deleteProfile, listProfiles, loadProfile } from '../../core/profiles.js';
import { requireWorkspaceId } from '../../core/workspace.js';
import { createClient } from '../../core/client.js';
import { output, outputError } from '../../core/output.js';
import { formatError } from '../../core/errors.js';
import { buildAuthStatus } from '../auth/status.js';
import type { GlobalOptions } from '../../core/types.js';

const PUBLIC_BASE = 'https://api.heyreach.io/api/public';

export function registerProfileCommands(program: Command): void {
  const profileCmd = program
    .command('profile')
    .description('Manage opt-in named workspace profiles (one API key, one workspace each)');

  profileCmd
    .command('add')
    .description(
      'Validate an API key and bind it to ~/.heyreach/profiles/<slug>.json (does not write config.json). ' +
        'Requires --workspace <id> because CheckApiKey cannot whoami.',
    )
    .argument('<slug>', 'Profile slug (e.g. acme, client-a)')
    .option('--api-key <key>', 'API key (defaults to HEYREACH_API_KEY)')
    .option('--workspace <id>', 'Numeric HeyReach workspace id to bind')
    .option('--workspace-name <name>', 'Optional workspace display name')
    .action(async (slug: string, opts: { apiKey?: string; workspace?: string; workspaceName?: string }) => {
      const globalOpts = program.opts() as GlobalOptions;
      try {
        const apiKey = resolveProvidedApiKey(opts.apiKey, globalOpts.apiKey);
        if (!apiKey) {
          throw new Error('No API key provided. Use --api-key or set HEYREACH_API_KEY');
        }
        const workspaceId = requireWorkspaceId(opts.workspace ?? globalOpts.workspace);
        const client = createClient({ apiKey, baseUrl: PUBLIC_BASE });
        await client.request({ method: 'GET', path: '/auth/CheckApiKey' });
        const persisted = persistLoginSession({
          apiKey,
          profileSlug: slug,
          workspaceId,
          workspaceName: opts.workspaceName,
        });
        output(
          {
            status: 'profile_saved',
            profile: slug,
            workspace_id: workspaceId,
            workspace_name: persisted.workspace_name ?? '',
            stored_at: persisted.stored_at,
            path: defaultProfileHintPath(slug),
            default_config_written: false,
          },
          globalOpts,
        );
      } catch (error) {
        outputError(formatError(error), globalOpts);
      }
    });

  profileCmd
    .command('list')
    .description(
      'List bound workspaces: profile slug (or default), workspace_id, workspace_name, source. Never prints API keys.',
    )
    .action(async () => {
      const globalOpts = program.opts() as GlobalOptions;
      try {
        output(listProfiles(), globalOpts);
      } catch (error) {
        outputError(formatError(error), globalOpts);
      }
    });

  profileCmd
    .command('remove')
    .alias('rm')
    .description('Delete a named profile file. Does not touch ~/.heyreach/config.json')
    .argument('<slug>', 'Profile slug to remove')
    .action(async (slug: string) => {
      const globalOpts = program.opts() as GlobalOptions;
      try {
        const existed = loadProfile(slug);
        const removed = deleteProfile(slug);
        output(
          {
            status: removed ? 'removed' : 'not_found',
            profile: slug,
            existed: Boolean(existed),
            default_config_written: false,
          },
          globalOpts,
        );
        if (!removed) process.exitCode = 1;
      } catch (error) {
        outputError(formatError(error), globalOpts);
      }
    });

  profileCmd
    .command('whoami')
    .description('Show the active credential source, profile slug, and bound workspace. Never prints the API key.')
    .action(async () => {
      const globalOpts = program.opts() as GlobalOptions;
      try {
        const result = await buildAuthStatus({
          apiKey: globalOpts.apiKey,
          profile: globalOpts.profile,
        });
        output(result, globalOpts);
        if (!result.authenticated) process.exitCode = 1;
      } catch (error) {
        outputError(formatError(error), globalOpts);
      }
    });
}
