import { loadConfig } from './config.js';
import { AuthError } from './errors.js';

const BASE_URL = 'https://api.heyreach.io/api/public';

export interface AuthContext {
  apiKey: string;
  baseUrl: string;
}

export function resolveAuth(opts?: { apiKey?: string }): AuthContext {
  const config = loadConfig();

  const apiKey =
    opts?.apiKey ??
    process.env.HEYREACH_API_KEY ??
    config.api_key;

  if (!apiKey) {
    throw new AuthError(
      'No API key found. Run "heyreach login" or set HEYREACH_API_KEY.',
    );
  }

  return { apiKey, baseUrl: BASE_URL };
}

export function resolveOrgAuth(opts?: { orgKey?: string }): AuthContext {
  const config = loadConfig();

  const apiKey =
    opts?.orgKey ??
    process.env.HEYREACH_ORG_API_KEY ??
    config.org_api_key;

  if (!apiKey) {
    throw new AuthError(
      'No Organization API key found. Run "heyreach login --org" or set HEYREACH_ORG_API_KEY.',
    );
  }

  return { apiKey, baseUrl: BASE_URL };
}
