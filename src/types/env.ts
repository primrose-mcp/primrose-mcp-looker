/**
 * Environment Bindings
 *
 * Type definitions for Cloudflare Worker environment variables and bindings.
 *
 * MULTI-TENANT ARCHITECTURE:
 * This server supports multiple tenants. Tenant-specific credentials (OAuth
 * client ID/secret) are passed via request headers, NOT stored in wrangler
 * secrets. This allows a single server instance to serve multiple customers.
 *
 * Required Headers:
 * - X-Looker-Base-URL: Looker instance URL (e.g., https://company.looker.com)
 * - X-Looker-Client-ID: OAuth client ID
 * - X-Looker-Client-Secret: OAuth client secret
 *
 * Optional Headers:
 * - X-Looker-Access-Token: Pre-authenticated access token (skips OAuth)
 */

// =============================================================================
// Tenant Credentials (parsed from request headers)
// =============================================================================

export interface TenantCredentials {
  /** Looker instance base URL (from X-Looker-Base-URL header) */
  baseUrl?: string;

  /** OAuth Client ID (from X-Looker-Client-ID header) */
  clientId?: string;

  /** OAuth Client Secret (from X-Looker-Client-Secret header) */
  clientSecret?: string;

  /** Pre-authenticated access token (from X-Looker-Access-Token header) */
  accessToken?: string;
}

/**
 * Parse tenant credentials from request headers
 */
export function parseTenantCredentials(request: Request): TenantCredentials {
  const headers = request.headers;

  return {
    baseUrl: headers.get('X-Looker-Base-URL') || undefined,
    clientId: headers.get('X-Looker-Client-ID') || undefined,
    clientSecret: headers.get('X-Looker-Client-Secret') || undefined,
    accessToken: headers.get('X-Looker-Access-Token') || undefined,
  };
}

/**
 * Validate that required credentials are present
 */
export function validateCredentials(credentials: TenantCredentials): void {
  if (!credentials.baseUrl) {
    throw new Error(
      'Missing Looker base URL. Provide X-Looker-Base-URL header (e.g., https://company.looker.com).'
    );
  }

  // Either need access token OR client credentials
  if (!credentials.accessToken) {
    if (!credentials.clientId || !credentials.clientSecret) {
      throw new Error(
        'Missing credentials. Provide either X-Looker-Access-Token OR both X-Looker-Client-ID and X-Looker-Client-Secret headers.'
      );
    }
  }
}

// =============================================================================
// Environment Configuration (from wrangler.jsonc vars and bindings)
// =============================================================================

export interface Env {
  // ===========================================================================
  // Environment Variables (from wrangler.jsonc vars)
  // ===========================================================================

  /** Maximum character limit for responses */
  CHARACTER_LIMIT: string;

  /** Default page size for list operations */
  DEFAULT_PAGE_SIZE: string;

  /** Maximum page size allowed */
  MAX_PAGE_SIZE: string;

  // ===========================================================================
  // Bindings
  // ===========================================================================

  /** KV namespace for OAuth token caching */
  OAUTH_KV?: KVNamespace;

  /** Durable Object namespace for MCP sessions */
  MCP_SESSIONS?: DurableObjectNamespace;

  /** Cloudflare AI binding (optional) */
  AI?: Ai;
}

// ===========================================================================
// Helper Functions
// ===========================================================================

/**
 * Get a numeric environment value with a default
 */
export function getEnvNumber(env: Env, key: keyof Env, defaultValue: number): number {
  const value = env[key];
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Get the character limit from environment
 */
export function getCharacterLimit(env: Env): number {
  return getEnvNumber(env, 'CHARACTER_LIMIT', 50000);
}

/**
 * Get the default page size from environment
 */
export function getDefaultPageSize(env: Env): number {
  return getEnvNumber(env, 'DEFAULT_PAGE_SIZE', 20);
}

/**
 * Get the maximum page size from environment
 */
export function getMaxPageSize(env: Env): number {
  return getEnvNumber(env, 'MAX_PAGE_SIZE', 100);
}
