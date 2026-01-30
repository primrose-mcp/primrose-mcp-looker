/**
 * Looker MCP Server - Main Entry Point
 *
 * This file sets up the MCP server using Cloudflare's Agents SDK.
 * It supports both stateless (McpServer) and stateful (McpAgent) modes.
 *
 * MULTI-TENANT ARCHITECTURE:
 * Tenant credentials (OAuth client ID/secret) are parsed from request headers,
 * allowing a single server deployment to serve multiple customers.
 *
 * Required Headers:
 * - X-Looker-Base-URL: Looker instance URL (e.g., https://company.looker.com)
 * - X-Looker-Client-ID: OAuth client ID
 * - X-Looker-Client-Secret: OAuth client secret
 *
 * Optional Headers:
 * - X-Looker-Access-Token: Pre-authenticated access token (skips OAuth)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpAgent } from 'agents/mcp';
import { createLookerClient } from './client.js';
import {
  registerDashboardTools,
  registerFolderTools,
  registerLookTools,
  registerQueryTools,
  registerScheduledPlanTools,
  registerUserTools,
} from './tools/index.js';
import {
  type Env,
  type TenantCredentials,
  parseTenantCredentials,
  validateCredentials,
} from './types/env.js';

// =============================================================================
// MCP Server Configuration
// =============================================================================

const SERVER_NAME = 'primrose-mcp-looker';
const SERVER_VERSION = '1.0.0';

// =============================================================================
// MCP Agent (Stateful - uses Durable Objects)
// =============================================================================

/**
 * McpAgent provides stateful MCP sessions backed by Durable Objects.
 *
 * NOTE: For multi-tenant deployments, use the stateless mode (Option 2) instead.
 * The stateful McpAgent is better suited for single-tenant deployments where
 * credentials can be stored as wrangler secrets.
 *
 * @deprecated For multi-tenant support, use stateless mode with per-request credentials
 */
export class LookerMcpAgent extends McpAgent<Env> {
  server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  async init() {
    // NOTE: Stateful mode requires credentials to be configured differently.
    // For multi-tenant, use the stateless /mcp endpoint instead.
    throw new Error(
      'Stateful mode (McpAgent) is not supported for multi-tenant deployments. ' +
        'Use the stateless /mcp endpoint with X-Looker-* headers instead.'
    );
  }
}

// =============================================================================
// Stateless MCP Server (Recommended - no Durable Objects needed)
// =============================================================================

/**
 * Creates a stateless MCP server instance with tenant-specific credentials.
 *
 * MULTI-TENANT: Each request provides credentials via headers, allowing
 * a single server deployment to serve multiple tenants.
 *
 * @param credentials - Tenant credentials parsed from request headers
 */
function createStatelessServer(credentials: TenantCredentials): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // Create client with tenant-specific credentials
  const client = createLookerClient(credentials);

  // Register all tools
  registerLookTools(server, client);
  registerDashboardTools(server, client);
  registerQueryTools(server, client);
  registerFolderTools(server, client);
  registerUserTools(server, client);
  registerScheduledPlanTools(server, client);

  // Test connection tool
  server.tool(
    'looker_test_connection',
    'Test the connection to the Looker API',
    {},
    async () => {
      try {
        const result = await client.testConnection();
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server;
}

// =============================================================================
// Worker Export
// =============================================================================

export default {
  /**
   * Main fetch handler for the Worker
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', server: SERVER_NAME }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ==========================================================================
    // Option 1: Stateful MCP with McpAgent (requires Durable Objects)
    // ==========================================================================
    // Uncomment to use McpAgent for stateful sessions:
    //
    // if (url.pathname === '/sse' || url.pathname === '/mcp') {
    //   return LookerMcpAgent.serveSSE('/sse').fetch(request, env, ctx);
    // }

    // ==========================================================================
    // Option 2: Stateless MCP with Streamable HTTP (Recommended for multi-tenant)
    // ==========================================================================
    if (url.pathname === '/mcp' && request.method === 'POST') {
      // Parse tenant credentials from request headers
      const credentials = parseTenantCredentials(request);

      // Validate credentials are present
      try {
        validateCredentials(credentials);
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: 'Unauthorized',
            message: error instanceof Error ? error.message : 'Invalid credentials',
            required_headers: [
              'X-Looker-Base-URL',
              'X-Looker-Client-ID + X-Looker-Client-Secret OR X-Looker-Access-Token',
            ],
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Create server with tenant-specific credentials
      const server = createStatelessServer(credentials);

      // Import and use createMcpHandler for streamable HTTP
      const { createMcpHandler } = await import('agents/mcp');
      const handler = createMcpHandler(server);
      return handler(request, env, ctx);
    }

    // SSE endpoint for legacy clients
    if (url.pathname === '/sse') {
      return new Response('SSE endpoint requires Durable Objects. Enable in wrangler.jsonc.', {
        status: 501,
      });
    }

    // Default response - API documentation
    return new Response(
      JSON.stringify({
        name: SERVER_NAME,
        version: SERVER_VERSION,
        description: 'Multi-tenant Looker MCP Server',
        endpoints: {
          mcp: '/mcp (POST) - Streamable HTTP MCP endpoint',
          health: '/health - Health check',
        },
        authentication: {
          description: 'Pass tenant credentials via request headers',
          required_headers: {
            'X-Looker-Base-URL': 'Looker instance URL (e.g., https://company.looker.com)',
            'X-Looker-Client-ID': 'OAuth client ID',
            'X-Looker-Client-Secret': 'OAuth client secret',
          },
          optional_headers: {
            'X-Looker-Access-Token': 'Pre-authenticated access token (alternative to client credentials)',
          },
        },
        tools: {
          looks: [
            'looker_list_looks',
            'looker_get_look',
            'looker_create_look',
            'looker_update_look',
            'looker_delete_look',
            'looker_search_looks',
            'looker_run_look',
            'looker_copy_look',
            'looker_move_look',
          ],
          dashboards: [
            'looker_list_dashboards',
            'looker_get_dashboard',
            'looker_create_dashboard',
            'looker_update_dashboard',
            'looker_delete_dashboard',
            'looker_search_dashboards',
            'looker_copy_dashboard',
            'looker_move_dashboard',
          ],
          queries: [
            'looker_create_query',
            'looker_get_query',
            'looker_run_query',
            'looker_run_inline_query',
            'looker_create_sql_query',
            'looker_get_sql_query',
            'looker_run_sql_query',
            'looker_list_models',
            'looker_get_model',
            'looker_get_explore',
            'looker_search_content',
          ],
          folders: [
            'looker_list_folders',
            'looker_get_folder',
            'looker_create_folder',
            'looker_update_folder',
            'looker_delete_folder',
            'looker_get_folder_children',
            'looker_get_folder_looks',
            'looker_get_folder_dashboards',
            'looker_search_folders',
          ],
          users: [
            'looker_list_users',
            'looker_get_user',
            'looker_get_current_user',
            'looker_create_user',
            'looker_update_user',
            'looker_delete_user',
            'looker_search_users',
          ],
          scheduled_plans: [
            'looker_list_scheduled_plans',
            'looker_get_scheduled_plan',
            'looker_create_scheduled_plan',
            'looker_update_scheduled_plan',
            'looker_delete_scheduled_plan',
            'looker_run_scheduled_plan_once',
            'looker_get_scheduled_plans_for_look',
            'looker_get_scheduled_plans_for_dashboard',
            'looker_list_alerts',
            'looker_get_alert',
          ],
          connection: ['looker_test_connection'],
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  },
};
