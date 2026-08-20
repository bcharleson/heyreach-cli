import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCommandContext } from '../../src/core/command-context.js';
import { saveProfile } from '../../src/core/profiles.js';
import { saveConfig } from '../../src/core/config.js';
import { ValidationError, WorkspaceMismatchError, AuthError } from '../../src/core/errors.js';

const CLIENT_A_ID = 1001;
const CLIENT_B_ID = 2002;

describe('createCommandContext', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.HEYREACH_API_KEY;
    delete process.env.HEYREACH_PROFILE;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  async function withHome<T>(fn: (home: string) => Promise<T>): Promise<T> {
    const home = await mkdtemp(join(tmpdir(), 'heyreach-ctx-'));
    process.env.HEYREACH_HOME = home;
    return fn(home);
  }

  it('does not require --workspace on the default single-key path', async () => {
    process.env.HEYREACH_API_KEY = 'fake-default-key';
    const ctx = createCommandContext({ mutating: true });
    expect(ctx.credentials.apiKey).toBe('fake-default-key');
    expect(ctx.credentials.profile).toBeUndefined();
  });

  it('unknown slug aborts', async () => {
    await withHome(async () => {
      expect(() => createCommandContext({ profile: 'nosuch', mutating: false })).toThrow(AuthError);
    });
  });

  it('profile write missing --workspace aborts before HTTP', async () => {
    await withHome(async () => {
      saveProfile('client-a', {
        api_key: 'fake-client-a-key',
        workspace_id: CLIENT_A_ID,
        workspace_name: 'Client A',
      });
      expect(() => createCommandContext({ profile: 'client-a', mutating: true })).toThrow(ValidationError);
      expect(() => createCommandContext({ profile: 'client-a', mutating: true })).toThrow(
        /requires --workspace/,
      );
    });
  });

  it('profile write wrong --workspace aborts before HTTP', async () => {
    await withHome(async () => {
      saveProfile('client-a', {
        api_key: 'fake-client-a-key',
        workspace_id: CLIENT_A_ID,
        workspace_name: 'Client A',
      });
      expect(() =>
        createCommandContext({
          profile: 'client-a',
          workspace: CLIENT_B_ID,
          mutating: true,
        }),
      ).toThrow(WorkspaceMismatchError);
    });
  });

  it('default key + --workspace of a different id aborts before the handler when bound', async () => {
    await withHome(async () => {
      saveConfig({
        api_key: 'fake-default-key',
        workspace_id: CLIENT_A_ID,
        workspace_name: 'Default Workspace',
      });
      expect(() =>
        createCommandContext({
          workspace: CLIENT_B_ID,
          mutating: true,
        }),
      ).toThrow(WorkspaceMismatchError);
    });
  });
});
