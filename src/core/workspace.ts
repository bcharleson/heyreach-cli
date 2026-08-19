import { ValidationError, WorkspaceMismatchError } from './errors.js';

export interface BoundWorkspace {
  id: number;
  name: string;
}

/**
 * Parse a HeyReach workspace id (numeric). Instantly-style UUIDs are rejected.
 */
export function parseWorkspaceId(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const n = Number(value.trim());
    if (Number.isInteger(n) && n > 0) return n;
  }
  return undefined;
}

export function requireWorkspaceId(value: unknown, label = '--workspace'): number {
  const id = parseWorkspaceId(value);
  if (id === undefined) {
    throw new ValidationError(
      `${label} must be a positive numeric HeyReach workspace id (e.g. 123).`,
    );
  }
  return id;
}

export function assertWriteWorkspace(
  profile: { slug: string; workspace_id: number },
  workspaceFlag: number | undefined,
): void {
  if (workspaceFlag === undefined) {
    throw new ValidationError(
      `Write command requires --workspace ${profile.workspace_id} when using profile '${profile.slug}'. ` +
        `This confirms the target workspace before any mutation.`,
    );
  }
  if (workspaceFlag !== profile.workspace_id) {
    throw new WorkspaceMismatchError(
      `--workspace ${workspaceFlag} does not match profile '${profile.slug}' ` +
        `bound workspace ${profile.workspace_id}. Aborting.`,
    );
  }
}

/**
 * When `--workspace` is passed and a bound id exists, they must match.
 * No live whoami exists for a workspace public key — do not invent a re-fetch.
 */
export function assertWorkspaceMatchesBound(
  boundId: number,
  workspaceFlag: number,
  boundName?: string,
): void {
  if (workspaceFlag !== boundId) {
    throw new WorkspaceMismatchError(
      `--workspace ${workspaceFlag} does not match the bound workspace ${boundId}` +
        `${boundName ? ` (${boundName})` : ''}. Aborting.`,
    );
  }
}

export interface OrgWorkspaceRow {
  id: number;
  name: string;
}

/** Best-effort parse of GET /management/organizations/workspaces. */
export function findOrgWorkspaceName(raw: unknown, workspaceId: number): string | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const obj = raw as Record<string, unknown>;
  const candidates = [obj.items, obj.workspaces, obj.data, Array.isArray(raw) ? raw : undefined];
  for (const list of candidates) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      const row = item as Record<string, unknown>;
      const id = parseWorkspaceId(row.id ?? row.workspaceId ?? row.workspace_id);
      if (id !== workspaceId) continue;
      const name = row.name ?? row.workspaceName ?? row.workspace_name;
      if (typeof name === 'string' && name) return name;
    }
  }
  return undefined;
}
