import { createInterface } from 'node:readline/promises';
import { Command } from 'commander';
import type { CommandDefinition, GlobalOptions } from '../core/types.js';
import { resolveAuth, resolveOrgAuth } from '../core/auth.js';
import { createClient } from '../core/client.js';
import { saveConfig, deleteConfig, loadConfig, getConfigPath } from '../core/config.js';
import { output, outputError } from '../core/output.js';
import { formatError } from '../core/errors.js';

import { campaignCommands } from './campaigns/index.js';
import { inboxCommands } from './inbox/index.js';
import { accountCommands } from './accounts/index.js';
import { listCommands } from './lists/index.js';
import { statsCommands } from './stats/index.js';
import { leadCommands } from './leads/index.js';
import { leadTagCommands } from './lead-tags/index.js';
import { webhookCommands } from './webhooks/index.js';
import { networkCommands } from './network/index.js';
import { orgCommands } from './org/index.js';

const ORG_GROUP = 'org';

export const allCommands: CommandDefinition[] = [
  ...campaignCommands,
  ...inboxCommands,
  ...accountCommands,
  ...listCommands,
  ...statsCommands,
  ...leadCommands,
  ...leadTagCommands,
  ...webhookCommands,
  ...networkCommands,
  ...orgCommands,
];

function getGlobalOpts(program: Command): GlobalOptions {
  const opts = program.opts();
  return {
    pretty: opts.pretty,
    quiet: opts.quiet,
    fields: opts.fields,
    apiKey: opts.apiKey,
    orgKey: opts.orgKey,
  };
}

function registerLoginCommand(program: Command): void {
  program
    .command('login')
    .description('Save your API key to ~/.heyreach/config.json')
    .option('--org', 'Store Organization API key instead of workspace key')
    .addHelpText('after', '\nExamples:\n  $ heyreach login --api-key <key>\n  $ heyreach login --org --org-key <key>\n  $ heyreach login  # interactive prompt')
    .action(async (opts) => {
      const globalOpts = getGlobalOpts(program);
      const isOrg = opts.org;

      let apiKey = isOrg
        ? (globalOpts.orgKey ?? process.env.HEYREACH_ORG_API_KEY)
        : (globalOpts.apiKey ?? process.env.HEYREACH_API_KEY);

      if (!apiKey) {
        const rl = createInterface({ input: process.stdin, output: process.stderr });
        const label = isOrg ? 'Organization API key' : 'HeyReach API key';
        apiKey = (await rl.question(`${label}: `)).trim();
        rl.close();
      }

      if (!apiKey) {
        outputError({ error: 'API key is required.', code: 'VALIDATION_ERROR' }, globalOpts);
        return;
      }

      // Validate the key before saving
      try {
        const checkPath = isOrg ? '/organization/GetWorkspaces' : '/auth/CheckApiKey';
        const client = createClient({ apiKey, baseUrl: 'https://api.heyreach.io/api/public' });
        await client.request({ method: 'GET', path: checkPath });
      } catch {
        outputError({ error: `Invalid ${isOrg ? 'Organization' : ''} API key. Check your key and try again.`, code: 'AUTH_ERROR' }, globalOpts);
        return;
      }

      const config = isOrg ? { org_api_key: apiKey } : { api_key: apiKey };
      saveConfig(config);
      output({ success: true, message: 'Credentials saved and verified.', config_path: getConfigPath() }, globalOpts);
    });
}

function registerLogoutCommand(program: Command): void {
  program
    .command('logout')
    .description('Remove stored credentials from ~/.heyreach/config.json')
    .action(async () => {
      const globalOpts = getGlobalOpts(program);
      deleteConfig();
      output({ success: true, message: 'Credentials removed.' }, globalOpts);
    });
}

function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Check API key validity and show config')
    .action(async () => {
      const globalOpts = getGlobalOpts(program);
      try {
        const auth = resolveAuth({ apiKey: globalOpts.apiKey });
        const client = createClient(auth);
        await client.request({ method: 'GET', path: '/auth/CheckApiKey' });
        output({
          authenticated: true,
          api_key: '***' + auth.apiKey.slice(-4),
          config_path: getConfigPath(),
        }, globalOpts);
      } catch (err) {
        const config = loadConfig();
        const usedKey = globalOpts.apiKey ?? process.env.HEYREACH_API_KEY ?? config.api_key;
        output({
          authenticated: false,
          api_key: usedKey ? '***' + usedKey.slice(-4) : '(not set)',
          api_key_source: globalOpts.apiKey ? '--api-key flag' : process.env.HEYREACH_API_KEY ? 'HEYREACH_API_KEY env' : config.api_key ? 'config file' : 'none',
          config_path: getConfigPath(),
          error: err instanceof Error ? err.message : String(err),
        }, globalOpts);
      }
    });
}

function registerConfigCommand(program: Command): void {
  const configCmd = program.command('config').description('Manage CLI configuration');

  configCmd
    .command('set')
    .description('Set configuration values')
    .option('--api-key <key>', 'HeyReach workspace API key')
    .option('--org-key <key>', 'HeyReach Organization API key')
    .action(async (opts) => {
      const globalOpts = getGlobalOpts(program);
      const updates: Record<string, string> = {};
      if (opts.apiKey) updates.api_key = opts.apiKey;
      if (opts.orgKey) updates.org_api_key = opts.orgKey;
      if (Object.keys(updates).length === 0) {
        outputError({ error: 'Provide at least --api-key or --org-key', code: 'VALIDATION_ERROR' }, globalOpts);
        return;
      }
      saveConfig(updates);
      output({ success: true, message: 'Config updated.', config_path: getConfigPath() }, globalOpts);
    });

  configCmd
    .command('get')
    .description('Show current configuration')
    .action(async () => {
      const globalOpts = getGlobalOpts(program);
      const config = loadConfig();
      output({
        api_key: config.api_key ? '***' + config.api_key.slice(-4) : '(not set)',
        org_api_key: config.org_api_key ? '***' + config.org_api_key.slice(-4) : '(not set)',
        config_path: getConfigPath(),
      }, globalOpts);
    });
}

function registerMcpCommand(program: Command): void {
  program
    .command('mcp')
    .description('Start the MCP (Model Context Protocol) server over stdio')
    .action(async () => {
      const { startMcpFromCli } = await import('../mcp-entry.js');
      await startMcpFromCli();
    });
}

function registerCommand(parent: Command, cmdDef: CommandDefinition, program: Command): void {
  const cmd = parent.command(cmdDef.subcommand).description(cmdDef.description);

  if (cmdDef.cliMappings.args) {
    for (const arg of cmdDef.cliMappings.args) {
      cmd.argument(arg.required !== false ? `<${arg.name}>` : `[${arg.name}]`, arg.field);
    }
  }

  if (cmdDef.cliMappings.options) {
    for (const opt of cmdDef.cliMappings.options) {
      cmd.option(opt.flags, opt.description ?? '');
    }
  }

  if (cmdDef.examples?.length) {
    cmd.addHelpText(
      'after',
      '\nExamples:\n' + cmdDef.examples.map((e) => `  $ ${e}`).join('\n'),
    );
  }

  cmd.action(async (...actionArgs: unknown[]) => {
    const globalOpts = getGlobalOpts(program);

    try {
      // Org commands use org API key
      const isOrgCommand = cmdDef.group === ORG_GROUP;
      const auth = isOrgCommand
        ? resolveOrgAuth({ orgKey: globalOpts.orgKey })
        : resolveAuth({ apiKey: globalOpts.apiKey });
      const client = createClient(auth);

      const input: Record<string, unknown> = {};

      const cmdOpts = actionArgs[actionArgs.length - 2] as Record<string, unknown>;
      if (cmdOpts && typeof cmdOpts === 'object') {
        if (cmdDef.cliMappings.options) {
          for (const optDef of cmdDef.cliMappings.options) {
            const flagName = optDef.flags.match(/--([a-zA-Z0-9][a-zA-Z0-9-_]*)/)?.[1] ?? optDef.field;
            const commanderKey = flagName.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
            const value = cmdOpts[commanderKey] ?? cmdOpts[flagName] ?? cmdOpts[optDef.field];
            if (value !== undefined) input[optDef.field] = value;
          }
        } else {
          for (const [key, val] of Object.entries(cmdOpts)) {
            if (val !== undefined) input[key] = val;
          }
        }
      }

      if (cmdDef.cliMappings.args) {
        for (let i = 0; i < cmdDef.cliMappings.args.length; i++) {
          const argDef = cmdDef.cliMappings.args[i];
          const argVal = actionArgs[i];
          if (argVal !== undefined) input[argDef.field] = argVal;
        }
      }

      const parsed = cmdDef.inputSchema.safeParse(input);
      if (!parsed.success) {
        outputError(
          { error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '), code: 'VALIDATION_ERROR' },
          globalOpts,
        );
        return;
      }

      const result = await cmdDef.handler(parsed.data, client);
      output(result, globalOpts);
    } catch (err) {
      outputError(formatError(err), globalOpts);
    }
  });
}

export function registerAllCommands(program: Command): void {
  registerLoginCommand(program);
  registerLogoutCommand(program);
  registerStatusCommand(program);
  registerConfigCommand(program);
  registerMcpCommand(program);

  const groups = new Map<string, CommandDefinition[]>();
  for (const cmd of allCommands) {
    if (!groups.has(cmd.group)) groups.set(cmd.group, []);
    groups.get(cmd.group)!.push(cmd);
  }

  for (const [groupName, commands] of groups) {
    const groupCmd = program.command(groupName).description(`Manage ${groupName}`);
    for (const cmdDef of commands) {
      registerCommand(groupCmd, cmdDef, program);
    }
  }
}
