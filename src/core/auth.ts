import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, getConfigPath } from './config.js';
import { AuthError } from './errors.js';
import { loadProfile, getProfilePath } from './profiles.js';
import type { BoundWorkspace } from './workspace.js';
import type { HeyReachProfile } from './types.js';

export const BASE_URL = 'https://api.heyreach.io/api/public';

export interface AuthContext {
  apiKey: string;
  baseUrl: string;
}

export interface ResolvedCredentials {
  apiKey: string;
  source: string;
  profile?: HeyReachProfile & { slug: string };
  boundWorkspace?: BoundWorkspace;
}

export function displayProfileSlug(credentials: { profile?: { slug: string } }): string {
  return credentials.profile?.slug ?? 'default';
}

export function boundWorkspaceOf(credentials: ResolvedCredentials): BoundWorkspace | undefined {
  if (credentials.profile?.workspace_id) {
    return {
      id: credentials.profile.workspace_id,
      name: credentials.profile.workspace_name,
    };
  }
  return credentials.boundWorkspace;
}

export interface ResolveCredentialsOptions {
  apiKey?: string;
  profile?: string;
  cwd?: string;
}

/**
 * Parse a `.env` file from the given directory into a key→value map.
 */
export function loadDotEnv(cwd: string = process.cwd()): Record<string, string> {
  const envPath = join(cwd, '.env');
  try {
    const content = readFileSync(envPath, 'utf-8');
    const vars: Record<string, string> = {};
    for (const raw of content.split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eqIdx = line.indexOf('=');
      if (eqIdx < 1) continue;
      const key = line.slice(0, eqIdx).trim();
      let val = line.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (key) vars[key] = val;
    }
    return vars;
  } catch {
    return {};
  }
}

function resolveProfileSlug(explicit?: string): string | undefined {
  const fromFlag = explicit?.trim();
  if (fromFlag) return fromFlag;
  const fromEnv = process.env.HEYREACH_PROFILE?.trim();
  return fromEnv || undefined;
}

/**
 * Resolve which API key and (optional) workspace profile this process will use.
 *
 * Without a profile:
 * `--api-key` → `HEYREACH_API_KEY` → cwd `.env` `HEYREACH_API_KEY` → `~/.heyreach/config.json`
 *
 * When `--profile` or `HEYREACH_PROFILE` is set, the named profile wins over cwd `.env`
 * and over `HEYREACH_API_KEY`. `--api-key` still overrides the stored profile key.
 */
export function resolveCredentials(opts: ResolveCredentialsOptions = {}): ResolvedCredentials {
  const slug = resolveProfileSlug(opts.profile);

  if (slug) {
    const stored = loadProfile(slug);
    if (!stored) {
      throw new AuthError(
        `Profile '${slug}' not found at ${getProfilePath(slug)}. ` +
          `Create it with: heyreach login --profile ${slug} --workspace <id>`,
      );
    }
    const profile = { ...stored, slug };
    const boundWorkspace = {
      id: stored.workspace_id,
      name: stored.workspace_name,
    };
    if (opts.apiKey) {
      return { apiKey: opts.apiKey, source: '--api-key flag', profile, boundWorkspace };
    }
    return {
      apiKey: stored.api_key,
      source: `profile (${slug})`,
      profile,
      boundWorkspace,
    };
  }

  if (opts.apiKey) {
    return { apiKey: opts.apiKey, source: '--api-key flag' };
  }

  const envKey = process.env.HEYREACH_API_KEY;
  if (envKey) {
    return { apiKey: envKey, source: 'HEYREACH_API_KEY environment variable' };
  }

  const dotEnv = loadDotEnv(opts.cwd ?? process.cwd());
  const dotEnvKey = dotEnv['HEYREACH_API_KEY'];
  if (dotEnvKey) {
    const envPath = join(opts.cwd ?? process.cwd(), '.env');
    return { apiKey: dotEnvKey, source: `.env file (${envPath})` };
  }

  const config = loadConfig();
  if (config.api_key) {
    return {
      apiKey: config.api_key,
      source: `stored config (${getConfigPath()})`,
      boundWorkspace: config.workspace_id
        ? { id: config.workspace_id, name: config.workspace_name ?? '' }
        : undefined,
    };
  }

  throw new AuthError(
    'No API key found. Run "heyreach login" or set HEYREACH_API_KEY, or pass --profile after ' +
      'heyreach login --profile <slug> --workspace <id>.',
  );
}

export function resolveAuth(opts?: { apiKey?: string; profile?: string }): AuthContext {
  const creds = resolveCredentials({ apiKey: opts?.apiKey, profile: opts?.profile });
  return { apiKey: creds.apiKey, baseUrl: BASE_URL };
}

export function resolveOrgAuth(opts?: { orgKey?: string }): AuthContext {
  const config = loadConfig();

  const apiKey = opts?.orgKey ?? process.env.HEYREACH_ORG_API_KEY ?? config.org_api_key;

  if (!apiKey) {
    throw new AuthError(
      'No Organization API key found. Run "heyreach login --org" or set HEYREACH_ORG_API_KEY.',
    );
  }

  return { apiKey, baseUrl: BASE_URL };
}

/**
 * Key supplied to `login` / `profile add` (not the full credential resolver).
 * Commander may attach `--api-key` to the command or the program.
 */
export function resolveProvidedApiKey(
  commandApiKey?: string,
  globalApiKey?: string,
): string | undefined {
  const fromCommand = commandApiKey?.trim();
  if (fromCommand) return fromCommand;
  const fromGlobal = globalApiKey?.trim();
  if (fromGlobal) return fromGlobal;
  const fromEnv = process.env.HEYREACH_API_KEY?.trim();
  return fromEnv || undefined;
}

export function resolveProvidedOrgKey(
  commandOrgKey?: string,
  globalOrgKey?: string,
): string | undefined {
  const fromCommand = commandOrgKey?.trim();
  if (fromCommand) return fromCommand;
  const fromGlobal = globalOrgKey?.trim();
  if (fromGlobal) return fromGlobal;
  const fromEnv = process.env.HEYREACH_ORG_API_KEY?.trim();
  return fromEnv || undefined;
}
