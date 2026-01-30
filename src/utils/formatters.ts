/**
 * Response Formatting Utilities
 *
 * Helpers for formatting tool responses in JSON or Markdown.
 */

import type {
  Dashboard,
  Folder,
  Look,
  LookmlModel,
  PaginatedResponse,
  ResponseFormat,
  ScheduledPlan,
  User,
} from '../types/entities.js';
import { LookerApiError, formatErrorForLogging } from './errors.js';

/**
 * MCP tool response type
 * Note: Index signature required for MCP SDK 1.25+ compatibility
 */
export interface ToolResponse {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * Format a successful response
 */
export function formatResponse(
  data: unknown,
  format: ResponseFormat,
  entityType: string
): ToolResponse {
  if (format === 'markdown') {
    return {
      content: [{ type: 'text', text: formatAsMarkdown(data, entityType) }],
    };
  }
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

/**
 * Format an error response
 */
export function formatError(error: unknown): ToolResponse {
  const errorInfo = formatErrorForLogging(error);

  let message: string;
  if (error instanceof LookerApiError) {
    message = `Error: ${error.message}`;
    if (error.retryable) {
      message += ' (retryable)';
    }
  } else if (error instanceof Error) {
    message = `Error: ${error.message}`;
  } else {
    message = `Error: ${String(error)}`;
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ error: message, details: errorInfo }, null, 2),
      },
    ],
    isError: true,
  };
}

/**
 * Format data as Markdown
 */
function formatAsMarkdown(data: unknown, entityType: string): string {
  if (isPaginatedResponse(data)) {
    return formatPaginatedAsMarkdown(data, entityType);
  }

  if (Array.isArray(data)) {
    return formatArrayAsMarkdown(data, entityType);
  }

  if (typeof data === 'object' && data !== null) {
    return formatObjectAsMarkdown(data as Record<string, unknown>, entityType);
  }

  return String(data);
}

/**
 * Type guard for paginated response
 */
function isPaginatedResponse(data: unknown): data is PaginatedResponse<unknown> {
  return (
    typeof data === 'object' &&
    data !== null &&
    'items' in data &&
    Array.isArray((data as PaginatedResponse<unknown>).items)
  );
}

/**
 * Format paginated response as Markdown
 */
function formatPaginatedAsMarkdown(data: PaginatedResponse<unknown>, entityType: string): string {
  const lines: string[] = [];

  lines.push(`## ${capitalize(entityType)}`);
  lines.push('');
  lines.push(`**Showing:** ${data.count}`);

  if (data.hasMore) {
    lines.push('**More available:** Yes');
  }
  lines.push('');

  if (data.items.length === 0) {
    lines.push('_No items found._');
    return lines.join('\n');
  }

  // Format items based on entity type
  switch (entityType) {
    case 'looks':
      lines.push(formatLooksTable(data.items as Look[]));
      break;
    case 'dashboards':
      lines.push(formatDashboardsTable(data.items as Dashboard[]));
      break;
    case 'folders':
      lines.push(formatFoldersTable(data.items as Folder[]));
      break;
    case 'users':
      lines.push(formatUsersTable(data.items as User[]));
      break;
    case 'scheduled_plans':
      lines.push(formatScheduledPlansTable(data.items as ScheduledPlan[]));
      break;
    case 'models':
      lines.push(formatModelsTable(data.items as LookmlModel[]));
      break;
    default:
      lines.push(formatGenericTable(data.items));
  }

  return lines.join('\n');
}

/**
 * Format looks as Markdown table
 */
function formatLooksTable(looks: Look[]): string {
  const lines: string[] = [];
  lines.push('| ID | Title | Folder | Created | Views |');
  lines.push('|---|---|---|---|---|');

  for (const look of looks) {
    lines.push(
      `| ${look.id} | ${look.title || '-'} | ${look.folder?.name || '-'} | ${look.created_at || '-'} | ${look.view_count || 0} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format dashboards as Markdown table
 */
function formatDashboardsTable(dashboards: Dashboard[]): string {
  const lines: string[] = [];
  lines.push('| ID | Title | Folder | Created | Views |');
  lines.push('|---|---|---|---|---|');

  for (const dashboard of dashboards) {
    lines.push(
      `| ${dashboard.id} | ${dashboard.title || '-'} | ${dashboard.folder?.name || '-'} | ${dashboard.created_at || '-'} | ${dashboard.view_count || 0} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format folders as Markdown table
 */
function formatFoldersTable(folders: Folder[]): string {
  const lines: string[] = [];
  lines.push('| ID | Name | Parent ID | Children |');
  lines.push('|---|---|---|---|');

  for (const folder of folders) {
    lines.push(
      `| ${folder.id} | ${folder.name} | ${folder.parent_id || 'root'} | ${folder.child_count || 0} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format users as Markdown table
 */
function formatUsersTable(users: User[]): string {
  const lines: string[] = [];
  lines.push('| ID | Name | Email | Disabled |');
  lines.push('|---|---|---|---|');

  for (const user of users) {
    const name = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || '-';
    lines.push(
      `| ${user.id} | ${name} | ${user.email || '-'} | ${user.is_disabled ? 'Yes' : 'No'} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format scheduled plans as Markdown table
 */
function formatScheduledPlansTable(plans: ScheduledPlan[]): string {
  const lines: string[] = [];
  lines.push('| ID | Name | Enabled | Next Run | Crontab |');
  lines.push('|---|---|---|---|---|');

  for (const plan of plans) {
    lines.push(
      `| ${plan.id || '-'} | ${plan.name || '-'} | ${plan.enabled ? 'Yes' : 'No'} | ${plan.next_run_at || '-'} | ${plan.crontab || '-'} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format LookML models as Markdown table
 */
function formatModelsTable(models: LookmlModel[]): string {
  const lines: string[] = [];
  lines.push('| Name | Label | Project | Explores |');
  lines.push('|---|---|---|---|');

  for (const model of models) {
    const exploreCount = model.explores?.length || 0;
    lines.push(
      `| ${model.name || '-'} | ${model.label || '-'} | ${model.project_name || '-'} | ${exploreCount} |`
    );
  }

  return lines.join('\n');
}

/**
 * Format a generic array as Markdown table
 */
function formatGenericTable(items: unknown[]): string {
  if (items.length === 0) return '_No items_';

  const first = items[0] as Record<string, unknown>;
  const keys = Object.keys(first).slice(0, 5); // Limit columns

  const lines: string[] = [];
  lines.push(`| ${keys.join(' | ')} |`);
  lines.push(`|${keys.map(() => '---').join('|')}|`);

  for (const item of items) {
    const record = item as Record<string, unknown>;
    const values = keys.map((k) => {
      const val = record[k];
      if (val === null || val === undefined) return '-';
      if (typeof val === 'object') return '[object]';
      return String(val).substring(0, 50);
    });
    lines.push(`| ${values.join(' | ')} |`);
  }

  return lines.join('\n');
}

/**
 * Format an array as Markdown
 */
function formatArrayAsMarkdown(data: unknown[], entityType: string): string {
  switch (entityType) {
    case 'looks':
      return formatLooksTable(data as Look[]);
    case 'dashboards':
      return formatDashboardsTable(data as Dashboard[]);
    case 'folders':
      return formatFoldersTable(data as Folder[]);
    case 'users':
      return formatUsersTable(data as User[]);
    case 'scheduled_plans':
      return formatScheduledPlansTable(data as ScheduledPlan[]);
    case 'models':
      return formatModelsTable(data as LookmlModel[]);
    default:
      return formatGenericTable(data);
  }
}

/**
 * Format a single object as Markdown
 */
function formatObjectAsMarkdown(data: Record<string, unknown>, entityType: string): string {
  const lines: string[] = [];
  lines.push(`## ${capitalize(entityType.replace(/s$/, ''))}`);
  lines.push('');

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;

    if (typeof value === 'object') {
      lines.push(`**${formatKey(key)}:**`);
      lines.push('```json');
      lines.push(JSON.stringify(value, null, 2));
      lines.push('```');
    } else {
      lines.push(`**${formatKey(key)}:** ${value}`);
    }
  }

  return lines.join('\n');
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format a key for display (snake_case to Title Case)
 */
function formatKey(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
