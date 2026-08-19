import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { HeyReachConfig } from './types.js';

/**
 * Config directory. `HEYREACH_HOME` replaces `~/.heyreach` (tests and isolated installs).
 * Default login still writes config.json here — never a client profile key.
 */
export function getConfigDir(): string {
  const override = process.env.HEYREACH_HOME?.trim();
  if (override) return override;
  return join(homedir(), '.heyreach');
}

export function getConfigPath(): string {
  return join(getConfigDir(), 'config.json');
}

export function ensureSecretDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  try {
    chmodSync(dir, 0o700);
  } catch {
    // ignore (e.g. unsupported on some filesystems)
  }
}

export function writeSecretFile(file: string, contents: string): void {
  writeFileSync(file, contents, { encoding: 'utf-8', mode: 0o600 });
  chmodSync(file, 0o600);
}

function ensureDir(): void {
  ensureSecretDir(getConfigDir());
}

function parseWorkspaceId(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const n = Number(value.trim());
    if (Number.isInteger(n) && n > 0) return n;
  }
  return undefined;
}

export function normalizeConfig(raw: unknown): HeyReachConfig {
  if (!raw || typeof raw !== 'object') return {};
  const obj = raw as Record<string, unknown>;
  const config: HeyReachConfig = {};
  if (typeof obj.api_key === 'string' && obj.api_key) config.api_key = obj.api_key;
  if (typeof obj.org_api_key === 'string' && obj.org_api_key) config.org_api_key = obj.org_api_key;
  const workspaceId = parseWorkspaceId(obj.workspace_id);
  if (workspaceId !== undefined) config.workspace_id = workspaceId;
  if (typeof obj.workspace_name === 'string') config.workspace_name = obj.workspace_name;
  return config;
}

export function loadConfig(): HeyReachConfig {
  try {
    if (!existsSync(getConfigPath())) return {};
    const raw = readFileSync(getConfigPath(), 'utf-8');
    return normalizeConfig(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function saveConfig(config: Partial<HeyReachConfig>): void {
  ensureDir();
  const existing = loadConfig();
  const merged = normalizeConfig({ ...existing, ...config });
  writeSecretFile(getConfigPath(), JSON.stringify(merged, null, 2) + '\n');
}

export function deleteConfig(): void {
  try {
    if (existsSync(getConfigPath())) unlinkSync(getConfigPath());
  } catch {
    // ignore
  }
}
