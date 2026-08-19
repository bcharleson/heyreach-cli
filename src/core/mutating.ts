import type { CommandDefinition } from './types.js';

/**
 * HeyReach list/read endpoints are almost all POST. Do not treat POST as a write.
 * Writes must set `mutating: true`. PATCH/DELETE without a flag still count as writes.
 */
export function isMutatingCommand(cmdDef: CommandDefinition): boolean {
  if (cmdDef.mutating === true) return true;
  if (cmdDef.mutating === false) return false;
  const method = cmdDef.endpoint.method;
  if (method === 'PATCH' || method === 'DELETE') return true;
  return false;
}
