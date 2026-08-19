import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertProfileSlug, listProfiles, saveProfile, deleteProfile } from '../../src/core/profiles.js';
import { saveConfig } from '../../src/core/config.js';
import { persistLoginSession } from '../../src/core/login-store.js';
import { ValidationError } from '../../src/core/errors.js';

describe('profiles', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('rejects reserved default slug and invalid slugs', () => {
    expect(() => assertProfileSlug('default')).toThrow(ValidationError);
    expect(() => assertProfileSlug('Client-A')).toThrow(ValidationError);
    expect(() => assertProfileSlug('a'.repeat(65))).toThrow(ValidationError);
    expect(assertProfileSlug('client-a')).toBe('client-a');
  });

  it('saveProfile never writes org_api_key and uses 0600/0700', async () => {
    const home = await mkdtemp(join(tmpdir(), 'heyreach-profiles-'));
    process.env.HEYREACH_HOME = home;
    const file = saveProfile('client-a', {
      api_key: 'fake-client-a-key',
      workspace_id: 1001,
      workspace_name: 'Client A',
    });
    const raw = JSON.parse(await readFile(file, 'utf-8'));
    expect(raw).toEqual({
      api_key: 'fake-client-a-key',
      workspace_id: 1001,
      workspace_name: 'Client A',
    });
    expect(raw).not.toHaveProperty('org_api_key');
    expect(statSync(file).mode & 0o777).toBe(0o600);
    expect(statSync(join(home, 'profiles')).mode & 0o777).toBe(0o700);
  });

  it('listProfiles omits api_key', async () => {
    const home = await mkdtemp(join(tmpdir(), 'heyreach-list-'));
    process.env.HEYREACH_HOME = home;
    saveConfig({ api_key: 'fake-default-key', workspace_id: 1001, workspace_name: 'Default Workspace' });
    saveProfile('client-a', {
      api_key: 'fake-client-a-key',
      workspace_id: 1001,
      workspace_name: 'Client A',
    });
    const listed = listProfiles();
    expect(listed.map((i) => i.profile)).toEqual(['default', 'client-a']);
    for (const item of listed) {
      expect(item).not.toHaveProperty('api_key');
      expect(item.workspace_id).toBe(1001);
      expect(item.source).toBeTruthy();
    }
    expect(JSON.stringify(listed)).not.toContain('fake-');
  });

  it('persistLoginSession --profile does not write config.json', async () => {
    const home = await mkdtemp(join(tmpdir(), 'heyreach-persist-'));
    process.env.HEYREACH_HOME = home;
    persistLoginSession({
      apiKey: 'fake-client-a-key',
      profileSlug: 'client-a',
      workspaceId: 1001,
      workspaceName: 'Client A',
    });
    expect(existsSync(join(home, 'config.json'))).toBe(false);
    expect(existsSync(join(home, 'profiles', 'client-a.json'))).toBe(true);
  });

  it('deleteProfile leaves default config in place', async () => {
    const home = await mkdtemp(join(tmpdir(), 'heyreach-del-'));
    process.env.HEYREACH_HOME = home;
    saveConfig({ api_key: 'fake-default-key' });
    saveProfile('client-a', {
      api_key: 'fake-client-a-key',
      workspace_id: 1001,
      workspace_name: 'Client A',
    });
    expect(deleteProfile('client-a')).toBe(true);
    expect(existsSync(join(home, 'config.json'))).toBe(true);
    expect(existsSync(join(home, 'profiles', 'client-a.json'))).toBe(false);
  });
});
