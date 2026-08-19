import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtemp, writeFile, readFile, access, mkdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createProgram } from '../../src/program.js';
import { saveProfile } from '../../src/core/profiles.js';
import { saveConfig } from '../../src/core/config.js';

const CLIENT_A_ID = 1001;
const CLIENT_B_ID = 2002;
const FAKE_DEFAULT_KEY = 'fake-default-key';
const FAKE_CLIENT_A_KEY = 'fake-client-a-key';
const FAKE_CLIENT_B_KEY = 'fake-client-b-key';

interface FetchCall {
  url: string;
  method: string;
  key: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'OK',
    headers: new Headers(),
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as unknown as Response;
}

describe('agency profiles (fail-closed)', () => {
  const originalEnv = process.env;
  const fetches: FetchCall[] = [];
  let stdout: string[];
  let stderr: string[];
  let home: string;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    delete process.env.HEYREACH_API_KEY;
    delete process.env.HEYREACH_PROFILE;
    delete process.env.HEYREACH_ORG_API_KEY;
    fetches.length = 0;
    stdout = [];
    stderr = [];
    vi.spyOn(console, 'log').mockImplementation((message?: unknown) => {
      stdout.push(String(message ?? ''));
    });
    vi.spyOn(console, 'error').mockImplementation((message?: unknown) => {
      stderr.push(String(message ?? ''));
    });

    home = await mkdtemp(join(tmpdir(), 'heyreach-agency-'));
    process.env.HEYREACH_HOME = home;

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL, init?: RequestInit) => {
        const url = String(input);
        const headers = (init?.headers ?? {}) as Record<string, string>;
        const key = headers['X-API-KEY'] ?? headers['x-api-key'] ?? '';
        fetches.push({ url, method: init?.method ?? 'GET', key });

        if (url.includes('/auth/CheckApiKey')) {
          if (!key) return jsonResponse({ error: 'unauthorized' }, 401);
          return jsonResponse({ success: true });
        }
        if (url.includes('/campaign/GetAll')) {
          return jsonResponse({ totalCount: 0, items: [] });
        }
        if (url.includes('/campaign/Pause')) {
          return jsonResponse({ success: true });
        }
        return jsonResponse({ success: true });
      }),
    );
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    process.exitCode = 0;
  });

  async function run(args: string[]): Promise<void> {
    const cli = createProgram();
    cli.exitOverride();
    await cli.parseAsync(args, { from: 'user' });
  }

  async function seedProfiles(): Promise<void> {
    saveConfig({
      api_key: FAKE_DEFAULT_KEY,
      workspace_id: CLIENT_A_ID,
      workspace_name: 'Default Workspace',
    });
    saveProfile('client-a', {
      api_key: FAKE_CLIENT_A_KEY,
      workspace_id: CLIENT_A_ID,
      workspace_name: 'Client A',
    });
    saveProfile('client-b', {
      api_key: FAKE_CLIENT_B_KEY,
      workspace_id: CLIENT_B_ID,
      workspace_name: 'Client B',
    });
  }

  it('Profile login writes only profiles/<slug>.json', async () => {
    await writeFile(join(home, 'config.json'), JSON.stringify({ api_key: FAKE_DEFAULT_KEY }, null, 2));

    await run([
      'login',
      '--profile',
      'client-a',
      '--api-key',
      FAKE_CLIENT_A_KEY,
      '--workspace',
      String(CLIENT_A_ID),
      '--workspace-name',
      'Client A',
    ]);

    expect(process.exitCode ?? 0).toBe(0);
    const profile = JSON.parse(await readFile(join(home, 'profiles', 'client-a.json'), 'utf-8'));
    expect(profile.api_key).toBe(FAKE_CLIENT_A_KEY);
    expect(profile.workspace_id).toBe(CLIENT_A_ID);
    expect(profile.workspace_name).toBe('Client A');
    expect(profile).not.toHaveProperty('org_api_key');

    const config = JSON.parse(await readFile(join(home, 'config.json'), 'utf-8'));
    expect(config.api_key).toBe(FAKE_DEFAULT_KEY);

    const mode = statSync(join(home, 'profiles', 'client-a.json')).mode & 0o777;
    expect(mode).toBe(0o600);
    const dirMode = statSync(join(home, 'profiles')).mode & 0o777;
    expect(dirMode).toBe(0o700);
  });

  it('Unknown slug aborts', async () => {
    await seedProfiles();
    await run(['--profile', 'nosuch', 'campaigns', 'list']);
    expect(process.exitCode).toBe(1);
    expect(stderr.join('\n')).toMatch(/not found/);
    expect(stderr.join('\n')).toMatch(/AUTH_ERROR/);
    expect(fetches.some((call) => call.url.includes('/campaign/'))).toBe(false);
  });

  it('Profile write missing --workspace aborts before HTTP', async () => {
    await seedProfiles();
    fetches.length = 0;
    await run(['--profile', 'client-a', 'campaigns', 'pause', '--campaign-id', '1']);
    expect(process.exitCode).toBe(1);
    expect(stderr.join('\n')).toMatch(/requires --workspace/);
    expect(stderr.join('\n')).toMatch(/VALIDATION_ERROR/);
    expect(fetches.some((call) => call.url.includes('/campaign/Pause'))).toBe(false);
    expect(fetches.length).toBe(0);
  });

  it('Profile write wrong --workspace aborts before HTTP', async () => {
    await seedProfiles();
    fetches.length = 0;
    await run([
      '--profile',
      'client-a',
      '--workspace',
      String(CLIENT_B_ID),
      'campaigns',
      'pause',
      '--campaign-id',
      '1',
    ]);
    expect(process.exitCode).toBe(1);
    expect(stderr.join('\n')).toMatch(/does not match profile 'client-a'/);
    expect(stderr.join('\n')).toMatch(/WORKSPACE_MISMATCH/);
    expect(fetches.some((call) => call.url.includes('/campaign/Pause'))).toBe(false);
    expect(fetches.length).toBe(0);
  });

  it('Default path without --profile still works (backward compatible)', async () => {
    process.env.HEYREACH_API_KEY = FAKE_DEFAULT_KEY;
    fetches.length = 0;
    await run(['campaigns', 'list']);
    expect(process.exitCode ?? 0).toBe(0);
    expect(fetches.some((call) => call.url.includes('/campaign/GetAll') && call.key === FAKE_DEFAULT_KEY)).toBe(
      true,
    );
    expect(fetches.some((call) => call.key === FAKE_CLIENT_A_KEY)).toBe(false);
  });

  it('status/whoami omit api_key', async () => {
    await seedProfiles();
    await run(['status']);
    const status = JSON.parse(stdout.join('\n'));
    expect(status.authenticated).toBe(true);
    expect(status.profile).toBe('default');
    expect(status.workspace_id).toBe(CLIENT_A_ID);
    expect(status.workspace_name).toBe('Default Workspace');
    expect(status.source).toContain('stored config');
    expect(status).not.toHaveProperty('api_key');
    expect(JSON.stringify(status)).not.toMatch(/fake-default-ke|fake-client/);

    stdout.length = 0;
    await run(['whoami']);
    const whoami = JSON.parse(stdout.join('\n'));
    expect(whoami).not.toHaveProperty('api_key');
    expect(JSON.stringify(whoami)).not.toMatch(/fake-default-ke|fake-client/);

    stdout.length = 0;
    await run(['profile', 'whoami']);
    const profileWhoami = JSON.parse(stdout.join('\n'));
    expect(profileWhoami).not.toHaveProperty('api_key');
    expect(JSON.stringify(profileWhoami)).not.toMatch(/fake-default-ke|fake-client/);
  });

  it('logout --profile does not delete default config', async () => {
    await seedProfiles();
    await run(['logout', '--profile', 'client-a']);
    expect(process.exitCode ?? 0).toBe(0);
    const config = JSON.parse(await readFile(join(home, 'config.json'), 'utf-8'));
    expect(config.api_key).toBe(FAKE_DEFAULT_KEY);
    await expect(access(join(home, 'profiles', 'client-a.json'))).rejects.toThrow();
    expect(existsSync(join(home, 'profiles', 'client-b.json'))).toBe(true);
  });

  it('POST list/read does not require --workspace', async () => {
    await seedProfiles();
    fetches.length = 0;
    process.exitCode = 0;
    await run(['--profile', 'client-a', 'campaigns', 'list']);
    expect(process.exitCode ?? 0).toBe(0);
    expect(fetches.some((call) => call.url.includes('/campaign/GetAll') && call.key === FAKE_CLIENT_A_KEY)).toBe(
      true,
    );
    expect(fetches.some((call) => call.key === FAKE_CLIENT_B_KEY)).toBe(false);
  });

  it('default key + --workspace of a different id aborts before HTTP when bound id exists', async () => {
    await seedProfiles();
    fetches.length = 0;
    await run(['--workspace', String(CLIENT_B_ID), 'campaigns', 'pause', '--campaign-id', '1']);
    expect(process.exitCode).toBe(1);
    expect(stderr.join('\n')).toMatch(/WORKSPACE_MISMATCH/);
    expect(fetches.some((call) => call.url.includes('/campaign/Pause'))).toBe(false);
  });

  it('default write without --workspace still reaches the HTTP handler', async () => {
    process.env.HEYREACH_API_KEY = FAKE_DEFAULT_KEY;
    fetches.length = 0;
    process.exitCode = 0;
    await run(['campaigns', 'pause', '--campaign-id', '1']);
    expect(process.exitCode ?? 0).toBe(0);
    expect(fetches.some((call) => call.url.includes('/campaign/Pause'))).toBe(true);
  });

  it('profile wins over leftover cwd .env and HEYREACH_API_KEY', async () => {
    await seedProfiles();
    const cwd = await mkdtemp(join(tmpdir(), 'heyreach-dotenv-'));
    await writeFile(join(cwd, '.env'), `HEYREACH_API_KEY=${FAKE_DEFAULT_KEY}\n`);
    await mkdir(join(cwd, 'nested'), { recursive: true });
    process.env.HEYREACH_API_KEY = FAKE_DEFAULT_KEY;

    const { resolveCredentials } = await import('../../src/core/auth.js');
    const creds = resolveCredentials({ profile: 'client-a', cwd });
    expect(creds.apiKey).toBe(FAKE_CLIENT_A_KEY);
    expect(creds.profile?.slug).toBe('client-a');
    expect(creds.source).toBe('profile (client-a)');
  });
});
