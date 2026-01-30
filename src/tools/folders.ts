/**
 * Folder Tools
 *
 * MCP tools for managing Looker Folders.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { LookerClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all folder-related tools
 */
export function registerFolderTools(server: McpServer, client: LookerClient): void {
  // ===========================================================================
  // List Folders
  // ===========================================================================
  server.tool(
    'looker_list_folders',
    `List all folders in Looker with pagination.

Returns a paginated list of folders.

Args:
  - limit: Number of folders to return (default: 20)
  - offset: Offset for pagination
  - format: Response format ('json' or 'markdown')

Returns:
  List of folders with id, name, parent_id, and child count.`,
    {
      limit: z.number().int().min(1).max(100).default(20).describe('Number of folders to return'),
      offset: z.number().int().min(0).optional().describe('Offset for pagination'),
      format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    },
    async ({ limit, offset, format }) => {
      try {
        const result = await client.listFolders({ limit, offset });
        return formatResponse(result, format, 'folders');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Folder
  // ===========================================================================
  server.tool(
    'looker_get_folder',
    `Get a single folder by ID.

Args:
  - folder_id: The folder ID
  - format: Response format ('json' or 'markdown')

Returns:
  The folder details including name, parent, children, looks, and dashboards.`,
    {
      folder_id: z.string().describe('Folder ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ folder_id, format }) => {
      try {
        const folder = await client.getFolder(folder_id);
        return formatResponse(folder, format, 'folder');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create Folder
  // ===========================================================================
  server.tool(
    'looker_create_folder',
    `Create a new folder in Looker.

Args:
  - name: Folder name (required)
  - parent_id: Parent folder ID (required)

Returns:
  The created folder.`,
    {
      name: z.string().describe('Folder name'),
      parent_id: z.string().describe('Parent folder ID'),
    },
    async (input) => {
      try {
        const folder = await client.createFolder(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Folder created', folder }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Update Folder
  // ===========================================================================
  server.tool(
    'looker_update_folder',
    `Update an existing folder.

Args:
  - folder_id: Folder ID to update
  - name: New name
  - parent_id: Move to new parent folder

Returns:
  The updated folder.`,
    {
      folder_id: z.string().describe('Folder ID to update'),
      name: z.string().optional(),
      parent_id: z.string().optional(),
    },
    async ({ folder_id, ...input }) => {
      try {
        const folder = await client.updateFolder(folder_id, input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'Folder updated', folder }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete Folder
  // ===========================================================================
  server.tool(
    'looker_delete_folder',
    `Delete a folder from Looker.

Args:
  - folder_id: Folder ID to delete

Returns:
  Confirmation of deletion.`,
    {
      folder_id: z.string().describe('Folder ID to delete'),
    },
    async ({ folder_id }) => {
      try {
        await client.deleteFolder(folder_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: `Folder ${folder_id} deleted` }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Folder Children
  // ===========================================================================
  server.tool(
    'looker_get_folder_children',
    `Get all child folders of a folder.

Args:
  - folder_id: Parent folder ID
  - format: Response format

Returns:
  List of child folders.`,
    {
      folder_id: z.string().describe('Parent folder ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ folder_id, format }) => {
      try {
        const folders = await client.getFolderChildren(folder_id);
        const result = { items: folders, count: folders.length, hasMore: false };
        return formatResponse(result, format, 'folders');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Folder Looks
  // ===========================================================================
  server.tool(
    'looker_get_folder_looks',
    `Get all looks in a folder.

Args:
  - folder_id: Folder ID
  - format: Response format

Returns:
  List of looks in the folder.`,
    {
      folder_id: z.string().describe('Folder ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ folder_id, format }) => {
      try {
        const looks = await client.getFolderLooks(folder_id);
        const result = { items: looks, count: looks.length, hasMore: false };
        return formatResponse(result, format, 'looks');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Folder Dashboards
  // ===========================================================================
  server.tool(
    'looker_get_folder_dashboards',
    `Get all dashboards in a folder.

Args:
  - folder_id: Folder ID
  - format: Response format

Returns:
  List of dashboards in the folder.`,
    {
      folder_id: z.string().describe('Folder ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ folder_id, format }) => {
      try {
        const dashboards = await client.getFolderDashboards(folder_id);
        const result = { items: dashboards, count: dashboards.length, hasMore: false };
        return formatResponse(result, format, 'dashboards');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Search Folders
  // ===========================================================================
  server.tool(
    'looker_search_folders',
    `Search for folders by name or parent.

Args:
  - name: Search by name
  - parent_id: Filter by parent folder ID
  - format: Response format

Returns:
  List of matching folders.`,
    {
      name: z.string().optional().describe('Search by name'),
      parent_id: z.string().optional().describe('Filter by parent folder ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ name, parent_id, format }) => {
      try {
        const folders = await client.searchFolders({ name, parent_id });
        const result = { items: folders, count: folders.length, hasMore: false };
        return formatResponse(result, format, 'folders');
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
