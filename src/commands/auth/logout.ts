import { Command } from 'commander';
import { deleteConfig, getConfigPath } from '../../core/config.js';
import { loadDotEnv } from '../../core/auth.js';
import { deleteProfile, getProfilePath, loadProfile } from '../../core/profiles.js';
import { output, outputError } from '../../core/output.js';
import { formatError } from '../../core/errors.js';
import type { GlobalOptions } from '../../core/types.js';

export function registerLogoutCommand(program: Command): void {
  program
    .command('logout')
    .description(
      'Remove stored default config, or a single --profile file. Never deletes every profile at once.',
    )
    .option('--profile <slug>', 'Remove only ~/.heyreach/profiles/<slug>.json (does not touch config.json)')
    .action(async (opts: { profile?: string }) => {
      const globalOpts = program.opts() as GlobalOptions;
      const slug = opts.profile || globalOpts.profile;

      try {
        if (slug) {
          const existed = Boolean(loadProfile(slug));
          const removed = deleteProfile(slug);
          output(
            {
              success: removed,
              status: removed ? 'profile_logged_out' : 'not_found',
              profile: slug,
              existed,
              path: getProfilePath(slug),
              default_config_written: false,
            },
            globalOpts,
          );
          if (!removed) process.exitCode = 1;
          return;
        }

        deleteConfig();

        const dotEnv = loadDotEnv(process.cwd());
        const dotEnvHasKey = Boolean(dotEnv['HEYREACH_API_KEY']);
        const result: Record<string, unknown> = {
          success: true,
          status: 'logged_out',
          message: 'Credentials removed.',
          config_path: getConfigPath(),
        };
        if (dotEnvHasKey) {
          result.warning =
            `Stored config cleared at ${getConfigPath()}, but HEYREACH_API_KEY is still set in .env.`;
        }
        output(result, globalOpts);
      } catch (err) {
        outputError(formatError(err), globalOpts);
      }
    });
}
