/**
 * Scheduled Plan Tools
 *
 * MCP tools for managing Looker Scheduled Plans (scheduled deliveries).
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { LookerClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all scheduled plan-related tools
 */
export function registerScheduledPlanTools(server: McpServer, client: LookerClient): void {
  // ===========================================================================
  // List Scheduled Plans
  // ===========================================================================
  server.tool(
    'looker_list_scheduled_plans',
    `List all scheduled plans in Looker.

Returns a list of scheduled plans.

Args:
  - user_id: Filter by owner user ID
  - format: Response format ('json' or 'markdown')

Returns:
  List of scheduled plans with id, name, enabled status, schedule, and destinations.`,
    {
      user_id: z.string().optional().describe('Filter by owner user ID'),
      format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    },
    async ({ user_id, format }) => {
      try {
        const plans = await client.listScheduledPlans({ user_id });
        const result = { items: plans, count: plans.length, hasMore: false };
        return formatResponse(result, format, 'scheduled_plans');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Scheduled Plan
  // ===========================================================================
  server.tool(
    'looker_get_scheduled_plan',
    `Get a single scheduled plan by ID.

Args:
  - scheduled_plan_id: The scheduled plan ID
  - format: Response format ('json' or 'markdown')

Returns:
  The scheduled plan details including schedule, destinations, and settings.`,
    {
      scheduled_plan_id: z.string().describe('Scheduled plan ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ scheduled_plan_id, format }) => {
      try {
        const plan = await client.getScheduledPlan(scheduled_plan_id);
        return formatResponse(plan, format, 'scheduled_plan');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Scheduled Plan
  // ===========================================================================
  server.tool(
    'looker_create_scheduled_plan',
    `Create a new scheduled plan for a look or dashboard.

Args:
  - name: Plan name
  - look_id: Look ID to schedule (mutually exclusive with dashboard_id)
  - dashboard_id: Dashboard ID to schedule (mutually exclusive with look_id)
  - crontab: Cron schedule expression (e.g., "0 9 * * 1" for Mondays at 9am)
  - timezone: Timezone for the schedule
  - title: Email subject/title
  - enabled: Whether the schedule is enabled
  - require_results: Only send if there are results
  - require_no_results: Only send if there are no results
  - require_change: Only send if results have changed
  - scheduled_plan_destination: Array of destinations (email, webhook, etc.)

Returns:
  The created scheduled plan.`,
    {
      name: z.string().optional().describe('Plan name'),
      look_id: z.string().optional().describe('Look ID to schedule'),
      dashboard_id: z.string().optional().describe('Dashboard ID to schedule'),
      crontab: z.string().optional().describe('Cron schedule expression'),
      timezone: z.string().optional().describe('Timezone'),
      title: z.string().optional().describe('Email subject/title'),
      enabled: z.boolean().optional().describe('Whether enabled'),
      require_results: z.boolean().optional().describe('Only send if there are results'),
      require_no_results: z.boolean().optional().describe('Only send if no results'),
      require_change: z.boolean().optional().describe('Only send if results changed'),
      scheduled_plan_destination: z
        .array(
          z.object({
            type: z.string().describe('Destination type (email, webhook, sftp, s3, etc.)'),
            address: z.string().optional().describe('Destination address'),
            format: z.string().optional().describe('Output format'),
            message: z.string().optional().describe('Message body'),
          })
        )
        .optional()
        .describe('Delivery destinations'),
    },
    async (input) => {
      try {
        const plan = await client.createScheduledPlan(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Scheduled plan created', plan }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Update Scheduled Plan
  // ===========================================================================
  server.tool(
    'looker_update_scheduled_plan',
    `Update an existing scheduled plan.

Args:
  - scheduled_plan_id: Scheduled plan ID to update
  - name: New name
  - title: New title
  - crontab: New cron schedule
  - timezone: New timezone
  - enabled: Update enabled status
  - require_results: Update require results setting
  - require_no_results: Update require no results setting
  - require_change: Update require change setting

Returns:
  The updated scheduled plan.`,
    {
      scheduled_plan_id: z.string().describe('Scheduled plan ID to update'),
      name: z.string().optional(),
      title: z.string().optional(),
      crontab: z.string().optional(),
      timezone: z.string().optional(),
      enabled: z.boolean().optional(),
      require_results: z.boolean().optional(),
      require_no_results: z.boolean().optional(),
      require_change: z.boolean().optional(),
    },
    async ({ scheduled_plan_id, ...input }) => {
      try {
        const plan = await client.updateScheduledPlan(scheduled_plan_id, input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Scheduled plan updated', plan }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete Scheduled Plan
  // ===========================================================================
  server.tool(
    'looker_delete_scheduled_plan',
    `Delete a scheduled plan from Looker.

Args:
  - scheduled_plan_id: Scheduled plan ID to delete

Returns:
  Confirmation of deletion.`,
    {
      scheduled_plan_id: z.string().describe('Scheduled plan ID to delete'),
    },
    async ({ scheduled_plan_id }) => {
      try {
        await client.deleteScheduledPlan(scheduled_plan_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { success: true, message: `Scheduled plan ${scheduled_plan_id} deleted` },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Run Scheduled Plan Once
  // ===========================================================================
  server.tool(
    'looker_run_scheduled_plan_once',
    `Trigger a scheduled plan to run immediately (one-time execution).

Args:
  - scheduled_plan_id: Scheduled plan ID to run

Returns:
  The scheduled plan execution result.`,
    {
      scheduled_plan_id: z.string().describe('Scheduled plan ID to run'),
    },
    async ({ scheduled_plan_id }) => {
      try {
        const result = await client.runScheduledPlanOnce(scheduled_plan_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Scheduled plan triggered', result }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Scheduled Plans for Look
  // ===========================================================================
  server.tool(
    'looker_get_scheduled_plans_for_look',
    `Get all scheduled plans for a specific look.

Args:
  - look_id: Look ID
  - format: Response format

Returns:
  List of scheduled plans associated with the look.`,
    {
      look_id: z.string().describe('Look ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ look_id, format }) => {
      try {
        const plans = await client.getScheduledPlansForLook(look_id);
        const result = { items: plans, count: plans.length, hasMore: false };
        return formatResponse(result, format, 'scheduled_plans');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Scheduled Plans for Dashboard
  // ===========================================================================
  server.tool(
    'looker_get_scheduled_plans_for_dashboard',
    `Get all scheduled plans for a specific dashboard.

Args:
  - dashboard_id: Dashboard ID
  - format: Response format

Returns:
  List of scheduled plans associated with the dashboard.`,
    {
      dashboard_id: z.string().describe('Dashboard ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ dashboard_id, format }) => {
      try {
        const plans = await client.getScheduledPlansForDashboard(dashboard_id);
        const result = { items: plans, count: plans.length, hasMore: false };
        return formatResponse(result, format, 'scheduled_plans');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // List Alerts
  // ===========================================================================
  server.tool(
    'looker_list_alerts',
    `List all alerts in Looker.

Args:
  - look_id: Filter by look ID
  - dashboard_id: Filter by dashboard ID
  - format: Response format

Returns:
  List of alerts.`,
    {
      look_id: z.string().optional().describe('Filter by look ID'),
      dashboard_id: z.string().optional().describe('Filter by dashboard ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ look_id, dashboard_id, format }) => {
      try {
        const alerts = await client.listAlerts({ look_id, dashboard_id });
        if (format === 'markdown') {
          const result = { items: alerts, count: alerts.length, hasMore: false };
          return formatResponse(result, format, 'alerts');
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(alerts, null, 2) }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Alert
  // ===========================================================================
  server.tool(
    'looker_get_alert',
    `Get a single alert by ID.

Args:
  - alert_id: Alert ID

Returns:
  The alert details.`,
    {
      alert_id: z.string().describe('Alert ID'),
    },
    async ({ alert_id }) => {
      try {
        const alert = await client.getAlert(alert_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(alert, null, 2) }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
