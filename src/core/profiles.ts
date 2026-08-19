import { existsSync, readFileSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { ensureSecretDir, getConfigDir, getConfigPath, loadConfig, writeSecretFile } from './config.js';
import { ValidationError } from './errors.js';
import type { HeyReachProfile } from './types.js';

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export function assertProfileSlug(slug: string): string {
  if (!slug || !SLUG_PATTERN.test(slug)) {
    throw new ValidationError(
      `Invalid profile slug '${slug}'. Use a lowercase slug like acme or client-a ` +
        `(letters, numbers, hyphens; 1–64 characters).`,
    );
  }
  if (slug === 'default') {
    throw new ValidationError(
      `'default' is reserved for ~/.heyreach/config.json. ` +
        'Use heyreach login --profile <slug> --workspace <id> to name a workspace.',
    );
  }
  return slug;
}

export function getProfilesDir(): string {
  return join(getConfigDir(), 'profiles');
}

export function getProfilePath(slug: string): string {
  return join(getProfilesDir(), `${assertProfileSlug(slug)}.json`);
}

function parseWorkspaceId(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const n = Number(value.trim());
    if (Number.isInteger(n) && n > 0) return n;
  }
  return undefined;
}

export function loadProfile(slug: string): HeyReachProfile | null {
  try {
    const file = getProfilePath(slug);
    if (!existsSync(file)) return null;
    const parsed = JSON.parse(readFileSync(file, 'utf-8')) as Partial<HeyReachProfile>;
    const workspaceId = parseWorkspaceId(parsed.workspace_id);
    if (!parsed.api_key || workspaceId === undefined) {
      throw new ValidationError(
        `Profile '${slug}' is incomplete. Re-run: heyreach login --profile ${slug} --workspace <id>`,
      );
    }
    return {
      api_key: parsed.api_key,
      workspace_id: workspaceId,
      workspace_name: parsed.workspace_name ?? '',
    };
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    return null;
  }
}

export function saveProfile(slug: string, profile: HeyReachProfile): string {
  assertProfileSlug(slug);
  const dir = getProfilesDir();
  const file = getProfilePath(slug);
  ensureSecretDir(dir);
  writeSecretFile(
    file,
    JSON.stringify(
      {
        api_key: profile.api_key,
        workspace_id: profile.workspace_id,
        workspace_name: profile.workspace_name,
      },
      null,
      2,
    ) + '\n',
  );
  return file;
}

export function deleteProfile(slug: string): boolean {
  try {
    const file = getProfilePath(slug);
    if (!existsSync(file)) return false;
    unlinkSync(file);
    return true;
  } catch {
    return false;
  }
}

export interface ProfileListItem {
  profile: string;
  slug: string;
  workspace_id: number | null;
  workspace_name: string;
  source: string;
}

function listItem(
  profile: string,
  workspaceId: number | null,
  workspaceName: string,
  source: string,
): ProfileListItem {
  return {
    profile,
    slug: profile,
    workspace_id: workspaceId,
    workspace_name: workspaceName,
    source,
  };
}

/**
 * List bound workspaces (default config + named profiles). Never returns API keys.
 * Does not call the HeyReach API — one process still equals one workspace.
 */
export function listProfiles(): ProfileListItem[] {
  const items: ProfileListItem[] = [];
  const config = loadConfig();
  if (config.api_key) {
    items.push(
      listItem(
        'default',
        config.workspace_id ?? null,
        config.workspace_name ?? '',
        `stored config (${getConfigPath()})`,
      ),
    );
  }

  let names: string[];
  try {
    names = readdirSync(getProfilesDir());
  } catch {
    return items;
  }

  for (const name of names) {
    if (!name.endsWith('.json')) continue;
    const slug = name.slice(0, -5);
    try {
      assertProfileSlug(slug);
    } catch {
      continue;
    }
    const profile = loadProfile(slug);
    if (!profile) continue;
    items.push(listItem(slug, profile.workspace_id, profile.workspace_name, `profile (${slug})`));
  }

  return items.sort((a, b) => {
    if (a.profile === 'default') return -1;
    if (b.profile === 'default') return 1;
    return a.profile.localeCompare(b.profile);
  });
}
