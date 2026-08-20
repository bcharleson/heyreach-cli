import { Command } from 'commander';
import type { CommandDefinition, GlobalOptions } from '../core/types.js';
import { createCommandContext } from '../core/command-context.js';
import { isMutatingCommand } from '../core/mutating.js';
import { saveConfig, loadConfig, getConfigPath } from '../core/config.js';
import { output, outputError } from '../core/output.js';
import { formatError } from '../core/errors.js';

import { registerLoginCommand } from './auth/login.js';
import { registerLogoutCommand } from './auth/logout.js';
import { registerStatusCommand } from './auth/status.js';
import { registerProfileCommands } from './profile/index.js';

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
    profile: opts.profile,
    workspace: opts.workspace,
  };
}

function registerConfigCommand(program: Command): void {
  const configCmd = program.command('config').description('Manage CLI configuration');

  configCmd
    .command('set')
    .description('Set configuration values on ~/.heyreach/config.json (never a client profile)')
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
    .description('Show current configuration (never prints API keys or prefixes)')
    .action(async () => {
      const globalOpts = getGlobalOpts(program);
      const config = loadConfig();
      output(
        {
          api_key_set: Boolean(config.api_key),
          org_api_key_set: Boolean(config.org_api_key),
          workspace_id: config.workspace_id ?? null,
          workspace_name: config.workspace_name ?? null,
          config_path: getConfigPath(),
        },
        globalOpts,
      );
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
      const isOrgCommand = cmdDef.group === ORG_GROUP;
      const { client } = createCommandContext({
        apiKey: globalOpts.apiKey,
        orgKey: globalOpts.orgKey,
        profile: globalOpts.profile,
        workspace: globalOpts.workspace,
        mutating: isMutatingCommand(cmdDef),
        orgCommand: isOrgCommand,
      });

      const input: Record<string, unknown> = {};

      const cmdOpts = actionArgs[actionArgs.length - 2] as Record<string, unknown>;
      if (cmdOpts && typeof cmdOpts === 'object') {
        if (cmdDef.cliMappings.options) {
          for (const optDef of cmdDef.cliMappings.options) {
            const flagName = optDef.flags.match(/--([a-zA-Z0-9][a-zA-Z0-9-_]*)/)?.[1] ?? optDef.field;
            const commanderKey = flagName.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
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
  registerProfileCommands(program);
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
