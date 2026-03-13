export class HeyReachError extends Error {
  code: string;
  statusCode?: number;

  constructor(message: string, code: string, statusCode?: number) {
    super(message);
    this.name = 'HeyReachError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class AuthError extends HeyReachError {
  constructor(message = 'Authentication failed. Run "heyreach login" or set HEYREACH_API_KEY.') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends HeyReachError {
  constructor(message = 'Resource not found.') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends HeyReachError {
  constructor(message = 'Validation failed.') {
    super(message, 'VALIDATION_ERROR', 422);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends HeyReachError {
  retryAfter?: number;

  constructor(message = 'Rate limit exceeded (300 req/min). Try again later.', retryAfter?: number) {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ServerError extends HeyReachError {
  constructor(message = 'Server error. Try again later.') {
    super(message, 'SERVER_ERROR', 500);
    this.name = 'ServerError';
  }
}

export function classifyHttpError(status: number, body: string): HeyReachError {
  const parsed = safeParse(body);
  const rawVal = parsed?.message || parsed?.error || body || `HTTP ${status} error`;
  const raw = typeof rawVal === 'string' ? rawVal : JSON.stringify(rawVal);
  const message = extractMessage(raw);

  if (status === 401 || status === 403) return new AuthError(message);
  if (status === 404) return new NotFoundError(message);
  if (status === 422) return new ValidationError(message);
  if (status === 429) return new RateLimitError(message);
  if (status >= 500) return new ServerError(message);
  return new HeyReachError(message, 'HTTP_ERROR', status);
}

function extractMessage(raw: string): string {
  // Handle nested JSON error strings like: {"errors":{"AccountIds":["The AccountIds field is required."]}}
  const nested = safeParse(raw);
  if (nested?.errors && typeof nested.errors === 'object') {
    const parts: string[] = [];
    for (const [field, msgs] of Object.entries(nested.errors as Record<string, unknown>)) {
      const msgList = Array.isArray(msgs) ? msgs.join('; ') : String(msgs);
      parts.push(`${field}: ${msgList}`);
    }
    if (parts.length > 0) return parts.join('. ');
  }
  if (nested?.errorMessage) return String(nested.errorMessage);
  return raw;
}

function safeParse(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function formatError(error: unknown): { error: string; code: string } {
  if (error instanceof HeyReachError) {
    return { error: error.message, code: error.code };
  }
  if (error instanceof Error) {
    return { error: error.message, code: 'UNKNOWN_ERROR' };
  }
  return { error: String(error), code: 'UNKNOWN_ERROR' };
}
