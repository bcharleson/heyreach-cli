import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { HeyReachConfig } from './types.js';

const CONFIG_DIR = join(homedir(), '.heyreach');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

function ensureDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): HeyReachConfig {
  try {
    if (!existsSync(CONFIG_FILE)) return {};
    const raw = readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw) as HeyReachConfig;
  } catch {
    return {};
  }
}

export function saveConfig(config: Partial<HeyReachConfig>): void {
  ensureDir();
  const existing = loadConfig();
  const merged = { ...existing, ...config };
  writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
}

export function deleteConfig(): void {
  try {
    if (existsSync(CONFIG_FILE)) unlinkSync(CONFIG_FILE);
  } catch {
    // ignore
  }
}

export function getConfigDir(): string {
  return CONFIG_DIR;
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}
