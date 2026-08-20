import { getConfigPath, saveConfig } from './config.js';
import { ValidationError } from './errors.js';
import { saveProfile } from './profiles.js';

export interface PersistLoginResult {
  stored_at: string;
  profile?: string;
  workspace_id?: number;
  workspace_name?: string;
}

/**
 * Persist credentials after a successful CheckApiKey validation.
 * `--profile` writes ONLY ~/.heyreach/profiles/<slug>.json.
 * Default login writes ONLY ~/.heyreach/config.json (never a client key).
 *
 * CheckApiKey cannot whoami. Profile login requires an explicit numeric workspace id.
 * Default login stamps id/name only when `--workspace` is passed — never invent one.
 */
export function persistLoginSession(options: {
  apiKey: string;
  profileSlug?: string;
  workspaceId?: number;
  workspaceName?: string;
}): PersistLoginResult {
  if (options.profileSlug) {
    if (options.workspaceId === undefined) {
      throw new ValidationError(
        `Cannot create profile '${options.profileSlug}' without --workspace <id>. ` +
          'CheckApiKey does not return a workspace id. No files were written.',
      );
    }
    const storedAt = saveProfile(options.profileSlug, {
      api_key: options.apiKey,
      workspace_id: options.workspaceId,
      workspace_name: options.workspaceName ?? '',
    });
    return {
      stored_at: storedAt,
      profile: options.profileSlug,
      workspace_id: options.workspaceId,
      workspace_name: options.workspaceName ?? '',
    };
  }

  const updates: { api_key: string; workspace_id?: number; workspace_name?: string } = {
    api_key: options.apiKey,
  };
  if (options.workspaceId !== undefined) {
    updates.workspace_id = options.workspaceId;
    updates.workspace_name = options.workspaceName ?? '';
  }
  saveConfig(updates);
  return {
    stored_at: getConfigPath(),
    workspace_id: options.workspaceId,
    workspace_name: options.workspaceName,
  };
}

export function defaultConfigHintPath(): string {
  return '~/.heyreach/config.json';
}

export function defaultProfileHintPath(slug: string): string {
  return `~/.heyreach/profiles/${slug}.json`;
}
