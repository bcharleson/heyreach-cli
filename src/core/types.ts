import { z } from 'zod';

export interface CliMapping {
  args?: Array<{
    field: string;
    name: string;
    required?: boolean;
  }>;
  options?: Array<{
    field: string;
    flags: string;
    description?: string;
  }>;
}

export interface CommandDefinition<TInput extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>> {
  name: string;
  group: string;
  subcommand: string;
  description: string;
  examples?: string[];
  inputSchema: TInput;
  cliMappings: CliMapping;
  endpoint: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
  };
  fieldMappings: Record<string, 'path' | 'query' | 'body'>;
  handler: (input: z.infer<TInput>, client: HeyReachClient) => Promise<unknown>;
  /**
   * Explicit write flag. HeyReach lists are POST — do not infer mutation from method.
   * When true, a selected profile requires `--workspace` matching the bound numeric id.
   */
  mutating?: boolean;
}

export interface HeyReachRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
}

export interface HeyReachClient {
  request(opts: HeyReachRequestOptions): Promise<unknown>;
  paginate(opts: HeyReachRequestOptions, maxPages?: number): Promise<unknown>;
}

export interface HeyReachConfig {
  api_key?: string;
  org_api_key?: string;
  /** Bound numeric workspace id (stamped on default login when `--workspace` is passed). */
  workspace_id?: number;
  workspace_name?: string;
}

/** Named workspace profile at ~/.heyreach/profiles/<slug>.json */
export interface HeyReachProfile {
  api_key: string;
  workspace_id: number;
  workspace_name: string;
}

export interface GlobalOptions {
  pretty?: boolean;
  quiet?: boolean;
  fields?: string;
  apiKey?: string;
  orgKey?: string;
  profile?: string;
  workspace?: string;
}
