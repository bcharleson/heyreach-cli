import { Command } from 'commander';
import { registerAllCommands } from './commands/index.js';

const program = new Command();

program
  .name('heyreach')
  .description(
    'HeyReach CLI — manage LinkedIn campaigns, leads, lists, inbox, webhooks, and more from your terminal.',
  )
  .version('0.1.4')
  .option('--pretty', 'Pretty-print JSON output')
  .option('--quiet', 'Suppress output, exit codes only')
  .option('--fields <fields>', 'Comma-separated fields to include in output')
  .option('--api-key <key>', 'HeyReach workspace API key')
  .option('--org-key <key>', 'HeyReach Organization API key');

registerAllCommands(program);

program.parse();
