import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// __CLI_VERSION__ is replaced by tsup at build time (see tsup.config.ts `define`).
declare const __CLI_VERSION__: string;

export function getCliVersion(): string {
  if (typeof __CLI_VERSION__ !== 'undefined') return __CLI_VERSION__;
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf-8')) as {
      version: string;
    };
    return pkg.version;
  } catch {
    return '0.2.1';
  }
}
