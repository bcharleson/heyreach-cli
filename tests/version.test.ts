import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createProgram } from '../src/program.js';
import { getCliVersion } from '../src/version.js';

describe('CLI version', () => {
  it('matches package.json', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8')) as {
      version: string;
    };
    expect(pkg.version).toBe('0.2.2');
    expect(getCliVersion()).toBe(pkg.version);
    expect(createProgram().version()).toBe(pkg.version);
  });
});
