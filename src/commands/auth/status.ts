import { Command } from 'commander';
import { createClient } from '../../core/client.js';
import { BASE_URL, boundWorkspaceOf, displayProfileSlug, resolveCredentials } from '../../core/auth.js';
import { AuthError } from '../../core/errors.js';
import { output, outputError } from '../../core/output.js';
import { formatError } from '../../core/errors.js';
import type { GlobalOptions } from '../../core/types.js';

export async function buildAuthStatus(opts: {
  apiKey?: string;
  profile?: string;
}): Promise<Record<string, unknown>> {
  let credentials;
  try {
    credentials = resolveCredentials({
      apiKey: opts.apiKey,
      profile: opts.profile,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        authenticated: false,
        source: null,
        profile: opts.profile ?? process.env.HEYREACH_PROFILE ?? 'default',
        workspace_id: null,
        workspace_name: null,
        error: error.message,
      };
    }
    throw error;
  }

  const bound = boundWorkspaceOf(credentials);
  const profile = displayProfileSlug(credentials);
  const client = createClient({ apiKey: credentials.apiKey, baseUrl: BASE_URL });

  try {
    await client.request({ method: 'GET', path: '/auth/CheckApiKey' });
    return {
      authenticated: true,
      source: credentials.source,
      profile,
      workspace_id: bound?.id ?? null,
      workspace_name: bound?.name ?? null,
    };
  } catch (verifyErr: unknown) {
    const msg = verifyErr instanceof Error ? verifyErr.message : String(verifyErr);
    return {
      authenticated: false,
      source: credentials.source,
      profile,
      workspace_id: bound?.id ?? null,
      workspace_name: bound?.name ?? null,
      error: `Key found but verification failed: ${msg}`,
    };
  }
}

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .alias('whoami')
    .description(
      'Show which credential source is active. Prints profile slug (or default), workspace_id, ' +
        'workspace_name, and source. Never prints the API key. Confirm this bound pair before writes.',
    )
    .action(async () => {
      const globalOpts = program.opts() as GlobalOptions;
      try {
        const result = await buildAuthStatus({
          apiKey: globalOpts.apiKey,
          profile: globalOpts.profile,
        });
        output(result, globalOpts);
        if (!result.authenticated) process.exitCode = 1;
      } catch (err) {
        outputError(formatError(err), globalOpts);
      }
    });
}
