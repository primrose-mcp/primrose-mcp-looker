/**
 * User Tools
 *
 * MCP tools for managing Looker Users.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { LookerClient } from '../client.js';
import { formatError, formatResponse } from '../utils/formatters.js';

/**
 * Register all user-related tools
 */
export function registerUserTools(server: McpServer, client: LookerClient): void {
  // ===========================================================================
  // List Users
  // ===========================================================================
  server.tool(
    'looker_list_users',
    `List all users in Looker with pagination.

Returns a paginated list of users.

Args:
  - limit: Number of users to return (default: 20)
  - offset: Offset for pagination
  - format: Response format ('json' or 'markdown')

Returns:
  List of users with id, name, email, and status.`,
    {
      limit: z.number().int().min(1).max(100).default(20).describe('Number of users to return'),
      offset: z.number().int().min(0).optional().describe('Offset for pagination'),
      format: z.enum(['json', 'markdown']).default('json').describe('Response format'),
    },
    async ({ limit, offset, format }) => {
      try {
        const result = await client.listUsers({ limit, offset });
        return formatResponse(result, format, 'users');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get User
  // ===========================================================================
  server.tool(
    'looker_get_user',
    `Get a single user by ID.

Args:
  - user_id: The user ID
  - format: Response format ('json' or 'markdown')

Returns:
  The user details including name, email, roles, groups, and credentials.`,
    {
      user_id: z.string().describe('User ID'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ user_id, format }) => {
      try {
        const user = await client.getUser(user_id);
        return formatResponse(user, format, 'user');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Get Current User
  // ===========================================================================
  server.tool(
    'looker_get_current_user',
    `Get the currently authenticated user (me).

Returns:
  The current user's details.`,
    {
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ format }) => {
      try {
        const user = await client.getCurrentUser();
        return formatResponse(user, format, 'user');
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Create User
  // ===========================================================================
  server.tool(
    'looker_create_user',
    `Create a new user in Looker.

Args:
  - first_name: First name
  - last_name: Last name
  - email: Email address
  - is_disabled: Whether the user is disabled
  - locale: User locale

Returns:
  The created user.`,
    {
      first_name: z.string().optional().describe('First name'),
      last_name: z.string().optional().describe('Last name'),
      email: z.string().optional().describe('Email address'),
      is_disabled: z.boolean().optional().describe('Whether user is disabled'),
      locale: z.string().optional().describe('User locale'),
    },
    async (input) => {
      try {
        const user = await client.createUser(input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'User created', user }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Update User
  // ===========================================================================
  server.tool(
    'looker_update_user',
    `Update an existing user.

Args:
  - user_id: User ID to update
  - first_name: New first name
  - last_name: New last name
  - email: New email
  - is_disabled: Update disabled status
  - locale: Update locale

Returns:
  The updated user.`,
    {
      user_id: z.string().describe('User ID to update'),
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      email: z.string().optional(),
      is_disabled: z.boolean().optional(),
      locale: z.string().optional(),
    },
    async ({ user_id, ...input }) => {
      try {
        const user = await client.updateUser(user_id, input);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: 'User updated', user }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Delete User
  // ===========================================================================
  server.tool(
    'looker_delete_user',
    `Delete a user from Looker.

Args:
  - user_id: User ID to delete

Returns:
  Confirmation of deletion.`,
    {
      user_id: z.string().describe('User ID to delete'),
    },
    async ({ user_id }) => {
      try {
        await client.deleteUser(user_id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: `User ${user_id} deleted` }, null, 2),
            },
          ],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  // ===========================================================================
  // Search Users
  // ===========================================================================
  server.tool(
    'looker_search_users',
    `Search for users by email or name.

Args:
  - email: Search by email
  - first_name: Search by first name
  - last_name: Search by last name
  - format: Response format

Returns:
  List of matching users.`,
    {
      email: z.string().optional().describe('Search by email'),
      first_name: z.string().optional().describe('Search by first name'),
      last_name: z.string().optional().describe('Search by last name'),
      format: z.enum(['json', 'markdown']).default('json'),
    },
    async ({ email, first_name, last_name, format }) => {
      try {
        const users = await client.searchUsers({ email, first_name, last_name });
        const result = { items: users, count: users.length, hasMore: false };
        return formatResponse(result, format, 'users');
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
