import { Command } from 'commander';
import { registerAllCommands } from './commands/index.js';
import { getCliVersion } from './version.js';

/**
 * Build the public CLI. Tests import this instead of src/index.ts so they
 * exercise the same global flags and command registration as production.
 */
export function createProgram(): Command {
  const program = new Command();

  program
    .name('heyreach')
    .description(
      'HeyReach CLI — manage LinkedIn campaigns, leads, lists, inbox, webhooks, and more from your terminal. ' +
        'Default: one workspace via login/config. Agency: --profile selects one named workspace; ' +
        'writes also require --workspace. One process, one workspace.',
    )
    .version(getCliVersion())
    .option('--pretty', 'Pretty-print JSON output')
    .option('--quiet', 'Suppress output, exit codes only')
    .option('--fields <fields>', 'Comma-separated fields to include in output')
    .option('--api-key <key>', 'HeyReach workspace API key')
    .option('--org-key <key>', 'HeyReach Organization API key')
    .option(
      '--profile <slug>',
      'Use a named workspace profile from ~/.heyreach/profiles/<slug>.json (or set HEYREACH_PROFILE)',
    )
    .option(
      '--workspace <id>',
      'Confirm the target numeric workspace id. Required for writes when using a profile. ' +
        'When passed on a path with a bound id, must match that id.',
    );

  registerAllCommands(program);
  return program;
}
