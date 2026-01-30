/**
 * Query Tools
 *
 * MCP tools for running queries, SQL queries, and exploring LookML models in Looker.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { LookerClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

const resultFormatSchema = z
  .enum(['json', 'json_detail', 'json_fe', 'json_bi', 'csv', 'txt', 'html', 'md', 'xlsx', 'sql', 'png', 'jpg'])
  .default('json')
  .describe('Result format for query output');

/**
 * Register all query-related tools
 */
export function registerQueryTools(server: McpServer, client: LookerClient): void {
  // ===========================================================================
  // Create Query
  // ===========================================================================
  server.tool(
    'looker_create_query',
    `Create a new query object in Looker.

Args:
  - model: LookML model name (required)
  - view: Explore/view name (required)
  - fields: Array of field names to include (required)
  - filters: Object mapping field names to filter values
  - sorts: Array of field names to sort by (prefix with "-" for descending)
  - limit: Row limit (as string)
  - pivots: Array of field names to pivot on
  - total: Whether to include totals

Returns:
  The created query object with its ID.`,
    {
      model: z.string().describe('LookML model name'),
      view: z.string().describe('Explore/view name'),
      fields: z.array(z.string()).describe('Fields to include'),
      filters: z.record(z.string(), z.string()).optional().describe('Field filters'),
      sorts: z.array(z.string()).optional().describe('Sort fields'),
      limit: z.string().optional().describe('Row limit'),
      pivots: z.array(z.string()).optional().describe('Pivot fields'),
      total: z.boolean().optional().describe('Include totals'),
    },
    async (input) => {
      try {
        const query = await client.createQuery({
          ...input,
          filters: input.filters as Record<string, string> | undefined,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Query created', query }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Query
  // ===========================================================================
  server.tool(
    'looker_get_query',
    `Get details of an existing query by ID.

Args:
  - query_id: Query ID

Returns:
  The query object with model, view, fields, filters, etc.`,
    {
      query_id: z.string().describe('Query ID'),
    },
    async ({ query_id }) => {
      try {
        const query = await client.getQuery(query_id);
        return {
          content: [{ type: 'text', text: JSON.stringify(query, null, 2) }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Run Query
  // ===========================================================================
  server.tool(
    'looker_run_query',
    `Run an existing query and get results.

Args:
  - query_id: Query ID to run
  - result_format: Format for results (json, csv, txt, html, md, xlsx, sql, png, jpg)
  - limit: Row limit for results

Returns:
  Query results in the specified format.`,
    {
      query_id: z.string().describe('Query ID to run'),
      result_format: resultFormatSchema,
      limit: z.number().int().min(1).optional().describe('Row limit'),
    },
    async ({ query_id, result_format, limit }) => {
      try {
        const results = await client.runQuery(query_id, result_format, limit);
        if (typeof results === 'string') {
          return { content: [{ type: 'text', text: results }] };
        }
        return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Run Inline Query
  // ===========================================================================
  server.tool(
    'looker_run_inline_query',
    `Create and run a query in one step without saving it.

This is the most common way to query data from Looker programmatically.

Args:
  - model: LookML model name (required)
  - view: Explore/view name (required)
  - fields: Array of field names to include (required)
  - filters: Object mapping field names to filter values
  - sorts: Array of field names to sort by
  - limit: Row limit
  - result_format: Format for results (default: json)

Returns:
  Query results in the specified format.`,
    {
      model: z.string().describe('LookML model name'),
      view: z.string().describe('Explore/view name'),
      fields: z.array(z.string()).describe('Fields to include'),
      filters: z.record(z.string(), z.string()).optional().describe('Field filters'),
      sorts: z.array(z.string()).optional().describe('Sort fields'),
      limit: z.number().int().min(1).optional().describe('Row limit'),
      result_format: resultFormatSchema,
    },
    async ({ model, view, fields, filters, sorts, limit, result_format }) => {
      try {
        const results = await client.runInlineQuery(
          model,
          view,
          fields,
          filters as Record<string, string> | undefined,
          sorts,
          limit,
          result_format
        );
        if (typeof results === 'string') {
          return { content: [{ type: 'text', text: results }] };
        }
        return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create SQL Query
  // ===========================================================================
  server.tool(
    'looker_create_sql_query',
    `Create a raw SQL query in Looker.

Args:
  - sql: SQL query string (required)
  - connection_name: Database connection name
  - model_name: LookML model name (for context)

Returns:
  The created SQL query object with its slug.`,
    {
      sql: z.string().describe('SQL query string'),
      connection_name: z.string().optional().describe('Database connection name'),
      model_name: z.string().optional().describe('LookML model name'),
    },
    async (input) => {
      try {
        const sqlQuery = await client.createSqlQuery(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'SQL query created', sqlQuery }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get SQL Query
  // ===========================================================================
  server.tool(
    'looker_get_sql_query',
    `Get details of an existing SQL query by slug.

Args:
  - slug: SQL query slug

Returns:
  The SQL query object.`,
    {
      slug: z.string().describe('SQL query slug'),
    },
    async ({ slug }) => {
      try {
        const sqlQuery = await client.getSqlQuery(slug);
        return {
          content: [{ type: 'text', text: JSON.stringify(sqlQuery, null, 2) }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Run SQL Query
  // ===========================================================================
  server.tool(
    'looker_run_sql_query',
    `Run an existing SQL query and get results.

Args:
  - slug: SQL query slug to run
  - result_format: Format for results (json, csv, txt)

Returns:
  Query results in the specified format.`,
    {
      slug: z.string().describe('SQL query slug to run'),
      result_format: z
        .enum(['json', 'json_detail', 'csv', 'txt', 'md'])
        .default('json')
        .describe('Result format'),
    },
    async ({ slug, result_format }) => {
      try {
        const results = await client.runSqlQuery(slug, result_format);
        if (typeof results === 'string') {
          return { content: [{ type: 'text', text: results }] };
        }
        return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // List Models
  // ===========================================================================
  server.tool(
    'looker_list_models',
    `List all LookML models available in Looker.

Returns:
  List of models with their explores.`,
    {
      format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    },
    async ({ format }) => {
      try {
        const models = await client.listModels();
        const result = { items: models, count: models.length, hasMore: false };
        return formatResponse(result, format, 'models');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Model
  // ===========================================================================
  server.tool(
    'looker_get_model',
    `Get details of a specific LookML model.

Args:
  - model_name: LookML model name

Returns:
  Model details including explores, connections, and project.`,
    {
      model_name: z.string().describe('LookML model name'),
    },
    async ({ model_name }) => {
      try {
        const model = await client.getModel(model_name);
        return {
          content: [{ type: 'text', text: JSON.stringify(model, null, 2) }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Explore
  // ===========================================================================
  server.tool(
    'looker_get_explore',
    `Get details of a specific explore including all available fields.

This is useful for discovering what dimensions and measures are available to query.

Args:
  - model_name: LookML model name
  - explore_name: Explore name

Returns:
  Explore details including dimensions, measures, filters, and joins.`,
    {
      model_name: z.string().describe('LookML model name'),
      explore_name: z.string().describe('Explore name'),
    },
    async ({ model_name, explore_name }) => {
      try {
        const explore = await client.getExplore(model_name, explore_name);
        return {
          content: [{ type: 'text', text: JSON.stringify(explore, null, 2) }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Search Content
  // ===========================================================================
  server.tool(
    'looker_search_content',
    `Search for content (looks, dashboards) across Looker.

Args:
  - terms: Search terms
  - limit: Maximum results to return
  - types: Content types to include (e.g., "look,dashboard")

Returns:
  List of matching content items.`,
    {
      terms: z.string().describe('Search terms'),
      limit: z.number().int().min(1).max(100).default(20),
      types: z.string().optional().describe('Content types (comma-separated)'),
    },
    async ({ terms, limit, types }) => {
      try {
        const content = await client.searchContent({ terms, limit, types });
        return {
          content: [{ type: 'text', text: JSON.stringify(content, null, 2) }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
