/**
 * Dashboard Tools
 *
 * MCP tools for managing Looker Dashboards.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { LookerClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all dashboard-related tools
 */
export function registerDashboardTools(server: McpServer, client: LookerClient): void {
  // ===========================================================================
  // List Dashboards
  // ===========================================================================
  server.tool(
    'looker_list_dashboards',
    `List all dashboards from Looker with pagination.

Returns a paginated list of dashboards.

Args:
  - limit: Number of dashboards to return (default: 20)
  - offset: Offset for pagination
  - format: Response format ('json' or 'markdown')

Returns:
  List of dashboards with id, title, folder, created date, and view count.`,
    {
      limit: z.number().int().min(1).max(100).default(20).describe('Number of dashboards to return'),
      offset: z.number().int().min(0).optional().describe('Offset for pagination'),
      format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    },
    async ({ limit, offset, format }) => {
      try {
        const result = await client.listDashboards({ limit, offset });
        return formatResponse(result, format, 'dashboards');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Dashboard
  // ===========================================================================
  server.tool(
    'looker_get_dashboard',
    `Get a single dashboard by ID.

Args:
  - dashboard_id: The dashboard ID
  - format: Response format ('json' or 'markdown')

Returns:
  The dashboard details including title, description, elements, filters, and layouts.`,
    {
      dashboard_id: z.string().describe('Dashboard ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ dashboard_id, format }) => {
      try {
        const dashboard = await client.getDashboard(dashboard_id);
        return formatResponse(dashboard, format, 'dashboard');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Dashboard
  // ===========================================================================
  server.tool(
    'looker_create_dashboard',
    `Create a new dashboard in Looker.

Args:
  - title: Dashboard title (required)
  - folder_id: Folder to create the dashboard in
  - description: Optional description
  - refresh_interval: Auto-refresh interval (e.g., "5 minutes")
  - background_color: Background color
  - show_title: Whether to show the title
  - show_filters_bar: Whether to show the filters bar
  - query_timezone: Timezone for queries

Returns:
  The created dashboard.`,
    {
      title: z.string().describe('Dashboard title'),
      folder_id: z.string().optional().describe('Folder ID'),
      description: z.string().optional().describe('Description'),
      refresh_interval: z.string().optional().describe('Refresh interval'),
      background_color: z.string().optional().describe('Background color'),
      show_title: z.boolean().optional().describe('Show title'),
      show_filters_bar: z.boolean().optional().describe('Show filters bar'),
      query_timezone: z.string().optional().describe('Query timezone'),
    },
    async (input) => {
      try {
        const dashboard = await client.createDashboard(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Dashboard created', dashboard }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Update Dashboard
  // ===========================================================================
  server.tool(
    'looker_update_dashboard',
    `Update an existing dashboard.

Args:
  - dashboard_id: Dashboard ID to update
  - title: New title
  - description: New description
  - folder_id: Move to new folder
  - refresh_interval: New refresh interval
  - background_color: New background color
  - show_title: Update show title setting
  - show_filters_bar: Update filters bar setting
  - deleted: Soft delete the dashboard

Returns:
  The updated dashboard.`,
    {
      dashboard_id: z.string().describe('Dashboard ID to update'),
      title: z.string().optional(),
      description: z.string().optional(),
      folder_id: z.string().optional(),
      refresh_interval: z.string().optional(),
      background_color: z.string().optional(),
      show_title: z.boolean().optional(),
      show_filters_bar: z.boolean().optional(),
      deleted: z.boolean().optional(),
    },
    async ({ dashboard_id, ...input }) => {
      try {
        const dashboard = await client.updateDashboard(dashboard_id, input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Dashboard updated', dashboard }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete Dashboard
  // ===========================================================================
  server.tool(
    'looker_delete_dashboard',
    `Delete a dashboard from Looker.

Args:
  - dashboard_id: Dashboard ID to delete

Returns:
  Confirmation of deletion.`,
    {
      dashboard_id: z.string().describe('Dashboard ID to delete'),
    },
    async ({ dashboard_id }) => {
      try {
        await client.deleteDashboard(dashboard_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: `Dashboard ${dashboard_id} deleted` }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Search Dashboards
  // ===========================================================================
  server.tool(
    'looker_search_dashboards',
    `Search for dashboards by title or folder.

Args:
  - title: Search by title (partial match)
  - folder_id: Filter by folder ID
  - limit: Maximum results to return
  - format: Response format

Returns:
  List of matching dashboards.`,
    {
      title: z.string().optional().describe('Search by title'),
      folder_id: z.string().optional().describe('Filter by folder ID'),
      limit: z.number().int().min(1).max(100).default(20),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ title, folder_id, limit, format }) => {
      try {
        const dashboards = await client.searchDashboards({ title, folder_id, limit });
        const result = { items: dashboards, count: dashboards.length, hasMore: false };
        return formatResponse(result, format, 'dashboards');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Copy Dashboard
  // ===========================================================================
  server.tool(
    'looker_copy_dashboard',
    `Copy a dashboard to create a duplicate.

Args:
  - dashboard_id: Dashboard ID to copy
  - folder_id: Destination folder (optional, defaults to same folder)

Returns:
  The newly created dashboard copy.`,
    {
      dashboard_id: z.string().describe('Dashboard ID to copy'),
      folder_id: z.string().optional().describe('Destination folder ID'),
    },
    async ({ dashboard_id, folder_id }) => {
      try {
        const dashboard = await client.copyDashboard(dashboard_id, folder_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Dashboard copied', dashboard }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Move Dashboard
  // ===========================================================================
  server.tool(
    'looker_move_dashboard',
    `Move a dashboard to a different folder.

Args:
  - dashboard_id: Dashboard ID to move
  - folder_id: Destination folder ID

Returns:
  The moved dashboard.`,
    {
      dashboard_id: z.string().describe('Dashboard ID to move'),
      folder_id: z.string().describe('Destination folder ID'),
    },
    async ({ dashboard_id, folder_id }) => {
      try {
        const dashboard = await client.moveDashboard(dashboard_id, folder_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Dashboard moved', dashboard }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
