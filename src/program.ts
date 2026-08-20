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
      'HeyReach CLI 0.2.2 — May public-API surface plus fail-closed agency profiles. ' +
        'Not full Postman coverage (82 endpoints). --profile loads one workspace key; ' +
        '--workspace confirms writes only (numeric id). POST list endpoints are not writes. ' +
        'No --all-profiles. CheckApiKey cannot whoami: login --profile requires --workspace.',
    )
    .version(getCliVersion())
    .option('--pretty', 'Pretty-print JSON output')
    .option('--quiet', 'Suppress output, exit codes only')
    .option('--fields <fields>', 'Comma-separated fields to include in output')
    .option('--api-key <key>', 'HeyReach workspace API key')
    .option('--org-key <key>', 'HeyReach Organization API key')
    .option(
      '--profile <slug>',
      'Load the workspace key from ~/.heyreach/profiles/<slug>.json (or set HEYREACH_PROFILE). One process, one profile.',
    )
    .option(
      '--workspace <id>',
      'Confirm the bound numeric workspace id. Required for writes when a profile is selected; not required for POST list/read.',
    );

  registerAllCommands(program);
  return program;
}
