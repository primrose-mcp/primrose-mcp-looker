/**
 * Look Tools
 *
 * MCP tools for managing Looker Looks.
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
 * Register all look-related tools
 */
export function registerLookTools(server: McpServer, client: LookerClient): void {
  // ===========================================================================
  // List Looks
  // ===========================================================================
  server.tool(
    'looker_list_looks',
    `List all looks from Looker with pagination.

Returns a paginated list of looks.

Args:
  - limit: Number of looks to return (default: 20)
  - offset: Offset for pagination
  - format: Response format ('json' or 'markdown')

Returns:
  List of looks with id, title, folder, created date, and view count.`,
    {
      limit: z.number().int().min(1).max(100).default(20).describe('Number of looks to return'),
      offset: z.number().int().min(0).optional().describe('Offset for pagination'),
      format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    },
    async ({ limit, offset, format }) => {
      try {
        const result = await client.listLooks({ limit, offset });
        return formatResponse(result, format, 'looks');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Look
  // ===========================================================================
  server.tool(
    'looker_get_look',
    `Get a single look by ID.

Args:
  - look_id: The look ID
  - format: Response format ('json' or 'markdown')

Returns:
  The look details including title, description, query, folder, and metadata.`,
    {
      look_id: z.string().describe('Look ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ look_id, format }) => {
      try {
        const look = await client.getLook(look_id);
        return formatResponse(look, format, 'look');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Look
  // ===========================================================================
  server.tool(
    'looker_create_look',
    `Create a new look in Looker.

Args:
  - title: Look title (required)
  - query_id: ID of the query to associate with the look
  - folder_id: Folder to create the look in
  - description: Optional description
  - is_run_on_load: Whether to run the query when the look loads

Returns:
  The created look.`,
    {
      title: z.string().describe('Look title'),
      query_id: z.string().optional().describe('Query ID to associate with the look'),
      folder_id: z.string().optional().describe('Folder ID'),
      description: z.string().optional().describe('Description'),
      is_run_on_load: z.boolean().optional().describe('Run query on load'),
    },
    async (input) => {
      try {
        const look = await client.createLook(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Look created', look }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Update Look
  // ===========================================================================
  server.tool(
    'looker_update_look',
    `Update an existing look.

Args:
  - look_id: Look ID to update
  - title: New title
  - description: New description
  - folder_id: Move to new folder
  - is_run_on_load: Update run on load setting
  - deleted: Soft delete the look

Returns:
  The updated look.`,
    {
      look_id: z.string().describe('Look ID to update'),
      title: z.string().optional(),
      description: z.string().optional(),
      folder_id: z.string().optional(),
      is_run_on_load: z.boolean().optional(),
      deleted: z.boolean().optional(),
    },
    async ({ look_id, ...input }) => {
      try {
        const look = await client.updateLook(look_id, input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Look updated', look }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete Look
  // ===========================================================================
  server.tool(
    'looker_delete_look',
    `Delete a look from Looker.

Args:
  - look_id: Look ID to delete

Returns:
  Confirmation of deletion.`,
    {
      look_id: z.string().describe('Look ID to delete'),
    },
    async ({ look_id }) => {
      try {
        await client.deleteLook(look_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: `Look ${look_id} deleted` }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Search Looks
  // ===========================================================================
  server.tool(
    'looker_search_looks',
    `Search for looks by title or folder.

Args:
  - title: Search by title (partial match)
  - folder_id: Filter by folder ID
  - limit: Maximum results to return
  - format: Response format

Returns:
  List of matching looks.`,
    {
      title: z.string().optional().describe('Search by title'),
      folder_id: z.string().optional().describe('Filter by folder ID'),
      limit: z.number().int().min(1).max(100).default(20),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ title, folder_id, limit, format }) => {
      try {
        const looks = await client.searchLooks({ title, folder_id, limit });
        const result = { items: looks, count: looks.length, hasMore: false };
        return formatResponse(result, format, 'looks');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Run Look
  // ===========================================================================
  server.tool(
    'looker_run_look',
    `Run a look and get the results.

Args:
  - look_id: Look ID to run
  - result_format: Format for results (json, csv, txt, html, md, xlsx, sql, png, jpg)
  - limit: Row limit for results

Returns:
  Query results in the specified format.`,
    {
      look_id: z.string().describe('Look ID to run'),
      result_format: resultFormatSchema,
      limit: z.number().int().min(1).optional().describe('Row limit'),
    },
    async ({ look_id, result_format, limit }) => {
      try {
        const results = await client.runLook(look_id, result_format, limit);
        // Handle different result formats
        if (typeof results === 'string') {
          return {
            content: [{ type: 'text', text: results }],
          };
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Copy Look
  // ===========================================================================
  server.tool(
    'looker_copy_look',
    `Copy a look to create a duplicate.

Args:
  - look_id: Look ID to copy
  - folder_id: Destination folder (optional, defaults to same folder)

Returns:
  The newly created look copy.`,
    {
      look_id: z.string().describe('Look ID to copy'),
      folder_id: z.string().optional().describe('Destination folder ID'),
    },
    async ({ look_id, folder_id }) => {
      try {
        const look = await client.copyLook(look_id, folder_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Look copied', look }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Move Look
  // ===========================================================================
  server.tool(
    'looker_move_look',
    `Move a look to a different folder.

Args:
  - look_id: Look ID to move
  - folder_id: Destination folder ID

Returns:
  The moved look.`,
    {
      look_id: z.string().describe('Look ID to move'),
      folder_id: z.string().describe('Destination folder ID'),
    },
    async ({ look_id, folder_id }) => {
      try {
        const look = await client.moveLook(look_id, folder_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Look moved', look }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
