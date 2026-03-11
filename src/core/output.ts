import type { GlobalOptions } from './types.js';

export function output(data: unknown, opts?: GlobalOptions): void {
  if (opts?.quiet) return;

  let result = data;

  if (opts?.fields && typeof data === 'object' && data !== null) {
    result = projectFields(data, opts.fields);
  }

  const json = opts?.pretty
    ? JSON.stringify(result, null, 2)
    : JSON.stringify(result);

  console.log(json);
}

export function outputError(error: { error: string; code: string }, opts?: GlobalOptions): void {
  if (opts?.quiet) {
    process.exitCode = 1;
    return;
  }

  const json = opts?.pretty
    ? JSON.stringify(error, null, 2)
    : JSON.stringify(error);

  console.error(json);
  process.exitCode = 1;
}

function projectFields(data: unknown, fields: string): unknown {
  const keys = fields.split(',').map((k) => k.trim());

  if (Array.isArray(data)) {
    return data.map((item) => pickKeys(item, keys));
  }

  if (typeof data === 'object' && data !== null && 'items' in data) {
    const inner = (data as Record<string, unknown>).items;
    if (Array.isArray(inner)) {
      return { ...data as object, items: inner.map((item) => pickKeys(item, keys)) };
    }
  }

  return pickKeys(data, keys);
}

function pickKeys(obj: unknown, keys: string[]): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  const record = obj as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    if (key in record) result[key] = record[key];
  }
  return result;
}
