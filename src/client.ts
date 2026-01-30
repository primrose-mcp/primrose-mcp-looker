/**
 * Looker API Client
 *
 * This file handles all HTTP communication with the Looker API.
 * It implements OAuth 2.0 authentication using client credentials.
 *
 * MULTI-TENANT: This client receives credentials per-request via TenantCredentials,
 * allowing a single server to serve multiple tenants with different Looker instances.
 *
 * Looker API Base URL: https://{instance}.looker.com/api/4.0
 */

import type {
  CreateQueryRequest,
  CreateSqlQueryRequest,
  Dashboard,
  DashboardCreateInput,
  DashboardUpdateInput,
  Folder,
  FolderCreateInput,
  FolderUpdateInput,
  Look,
  LookCreateInput,
  LookUpdateInput,
  LookmlModel,
  LookmlModelExplore,
  PaginatedResponse,
  PaginationParams,
  Query,
  ResultFormat,
  ScheduledPlan,
  ScheduledPlanCreateInput,
  ScheduledPlanUpdateInput,
  SqlQuery,
  User,
  UserCreateInput,
  UserUpdateInput,
  ContentSearch,
  Alert,
} from './types/entities.js';
import type { TenantCredentials } from './types/env.js';
import { AuthenticationError, LookerApiError, RateLimitError } from './utils/errors.js';

// =============================================================================
// Looker Client Interface
// =============================================================================

export interface LookerClient {
  // Connection
  testConnection(): Promise<{ connected: boolean; message: string }>;

  // Looks
  listLooks(params?: PaginationParams): Promise<PaginatedResponse<Look>>;
  getLook(lookId: string): Promise<Look>;
  createLook(input: LookCreateInput): Promise<Look>;
  updateLook(lookId: string, input: LookUpdateInput): Promise<Look>;
  deleteLook(lookId: string): Promise<void>;
  searchLooks(params: { title?: string; folder_id?: string; limit?: number }): Promise<Look[]>;
  runLook(lookId: string, resultFormat: ResultFormat, limit?: number): Promise<unknown>;
  copyLook(lookId: string, folderId?: string): Promise<Look>;
  moveLook(lookId: string, folderId: string): Promise<Look>;

  // Dashboards
  listDashboards(params?: PaginationParams): Promise<PaginatedResponse<Dashboard>>;
  getDashboard(dashboardId: string): Promise<Dashboard>;
  createDashboard(input: DashboardCreateInput): Promise<Dashboard>;
  updateDashboard(dashboardId: string, input: DashboardUpdateInput): Promise<Dashboard>;
  deleteDashboard(dashboardId: string): Promise<void>;
  searchDashboards(params: { title?: string; folder_id?: string; limit?: number }): Promise<Dashboard[]>;
  copyDashboard(dashboardId: string, folderId?: string): Promise<Dashboard>;
  moveDashboard(dashboardId: string, folderId: string): Promise<Dashboard>;

  // Queries
  createQuery(input: CreateQueryRequest): Promise<Query>;
  getQuery(queryId: string): Promise<Query>;
  runQuery(queryId: string, resultFormat: ResultFormat, limit?: number): Promise<unknown>;
  runInlineQuery(
    model: string,
    view: string,
    fields: string[],
    filters?: Record<string, string>,
    sorts?: string[],
    limit?: number,
    resultFormat?: ResultFormat
  ): Promise<unknown>;

  // SQL Queries
  createSqlQuery(input: CreateSqlQueryRequest): Promise<SqlQuery>;
  getSqlQuery(slug: string): Promise<SqlQuery>;
  runSqlQuery(slug: string, resultFormat: ResultFormat): Promise<unknown>;

  // Folders
  listFolders(params?: PaginationParams): Promise<PaginatedResponse<Folder>>;
  getFolder(folderId: string): Promise<Folder>;
  createFolder(input: FolderCreateInput): Promise<Folder>;
  updateFolder(folderId: string, input: FolderUpdateInput): Promise<Folder>;
  deleteFolder(folderId: string): Promise<void>;
  getFolderChildren(folderId: string): Promise<Folder[]>;
  getFolderLooks(folderId: string): Promise<Look[]>;
  getFolderDashboards(folderId: string): Promise<Dashboard[]>;
  searchFolders(params: { name?: string; parent_id?: string }): Promise<Folder[]>;

  // Users
  listUsers(params?: PaginationParams): Promise<PaginatedResponse<User>>;
  getUser(userId: string): Promise<User>;
  getCurrentUser(): Promise<User>;
  createUser(input: UserCreateInput): Promise<User>;
  updateUser(userId: string, input: UserUpdateInput): Promise<User>;
  deleteUser(userId: string): Promise<void>;
  searchUsers(params: { email?: string; first_name?: string; last_name?: string }): Promise<User[]>;

  // Scheduled Plans
  listScheduledPlans(params?: { user_id?: string; look_id?: string; dashboard_id?: string }): Promise<ScheduledPlan[]>;
  getScheduledPlan(scheduledPlanId: string): Promise<ScheduledPlan>;
  createScheduledPlan(input: ScheduledPlanCreateInput): Promise<ScheduledPlan>;
  updateScheduledPlan(scheduledPlanId: string, input: ScheduledPlanUpdateInput): Promise<ScheduledPlan>;
  deleteScheduledPlan(scheduledPlanId: string): Promise<void>;
  runScheduledPlanOnce(scheduledPlanId: string): Promise<ScheduledPlan>;
  getScheduledPlansForLook(lookId: string): Promise<ScheduledPlan[]>;
  getScheduledPlansForDashboard(dashboardId: string): Promise<ScheduledPlan[]>;

  // LookML Models & Explores
  listModels(): Promise<LookmlModel[]>;
  getModel(modelName: string): Promise<LookmlModel>;
  getExplore(modelName: string, exploreName: string): Promise<LookmlModelExplore>;

  // Content
  searchContent(params: { terms?: string; limit?: number; types?: string }): Promise<ContentSearch[]>;

  // Alerts
  listAlerts(params?: { look_id?: string; dashboard_id?: string }): Promise<Alert[]>;
  getAlert(alertId: string): Promise<Alert>;
}

// =============================================================================
// Looker Client Implementation
// =============================================================================

class LookerClientImpl implements LookerClient {
  private credentials: TenantCredentials;
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(credentials: TenantCredentials) {
    this.credentials = credentials;
    // Looker API 4.0 base URL
    this.baseUrl = `${credentials.baseUrl}/api/4.0`;
    // Use pre-authenticated token if provided
    if (credentials.accessToken) {
      this.accessToken = credentials.accessToken;
      this.tokenExpiry = Date.now() + 3600000; // Assume 1 hour validity
    }
  }

  // ===========================================================================
  // OAuth Authentication
  // ===========================================================================

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    // Use pre-authenticated token if provided
    if (this.credentials.accessToken) {
      this.accessToken = this.credentials.accessToken;
      this.tokenExpiry = Date.now() + 3600000;
      return this.accessToken;
    }

    // Perform OAuth login using client credentials
    if (!this.credentials.clientId || !this.credentials.clientSecret) {
      throw new AuthenticationError(
        'No credentials provided. Include X-Looker-Client-ID and X-Looker-Client-Secret headers.'
      );
    }

    const loginUrl = `${this.credentials.baseUrl}/api/4.0/login`;
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `client_id=${encodeURIComponent(this.credentials.clientId)}&client_secret=${encodeURIComponent(this.credentials.clientSecret)}`,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AuthenticationError(`Looker login failed: ${errorText}`);
    }

    const data = (await response.json()) as { access_token: string; expires_in?: number };
    this.accessToken = data.access_token;
    // Set expiry with buffer (default 1 hour)
    this.tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;

    return this.accessToken;
  }

  // ===========================================================================
  // HTTP Request Helper
  // ===========================================================================

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getAuthHeaders();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new RateLimitError('Rate limit exceeded', retryAfter ? parseInt(retryAfter, 10) : 60);
    }

    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      // Clear cached token and retry once
      this.accessToken = null;
      this.tokenExpiry = 0;
      throw new AuthenticationError('Authentication failed. Check your API credentials.');
    }

    // Handle not found
    if (response.status === 404) {
      const errorBody = await response.text();
      throw new LookerApiError(`Not found: ${errorBody}`, 404, 'NOT_FOUND', false);
    }

    // Handle other errors
    if (!response.ok) {
      const errorBody = await response.text();
      let message = `API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorBody);
        message = errorJson.message || errorJson.error || message;
      } catch {
        message = errorBody || message;
      }
      throw new LookerApiError(message, response.status);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    // Check content type for non-JSON responses
    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.includes('application/json')) {
      // Return raw text/binary for non-JSON formats
      return (await response.text()) as T;
    }

    return response.json() as Promise<T>;
  }

  // ===========================================================================
  // Connection
  // ===========================================================================

  async testConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      await this.request('/user');
      return { connected: true, message: 'Successfully connected to Looker API' };
    } catch (error) {
      return {
        connected: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  // ===========================================================================
  // Looks
  // ===========================================================================

  async listLooks(params?: PaginationParams): Promise<PaginatedResponse<Look>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.offset) queryParams.set('offset', String(params.offset));
    if (params?.fields) queryParams.set('fields', params.fields);

    const looks = await this.request<Look[]>(`/looks?${queryParams.toString()}`);
    return {
      items: looks,
      count: looks.length,
      hasMore: looks.length === (params?.limit || 100),
    };
  }

  async getLook(lookId: string): Promise<Look> {
    return this.request<Look>(`/looks/${lookId}`);
  }

  async createLook(input: LookCreateInput): Promise<Look> {
    return this.request<Look>('/looks', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateLook(lookId: string, input: LookUpdateInput): Promise<Look> {
    return this.request<Look>(`/looks/${lookId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  async deleteLook(lookId: string): Promise<void> {
    await this.request<void>(`/looks/${lookId}`, {
      method: 'DELETE',
    });
  }

  async searchLooks(params: { title?: string; folder_id?: string; limit?: number }): Promise<Look[]> {
    const queryParams = new URLSearchParams();
    if (params.title) queryParams.set('title', params.title);
    if (params.folder_id) queryParams.set('folder_id', params.folder_id);
    if (params.limit) queryParams.set('limit', String(params.limit));

    return this.request<Look[]>(`/looks/search?${queryParams.toString()}`);
  }

  async runLook(lookId: string, resultFormat: ResultFormat, limit?: number): Promise<unknown> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.set('limit', String(limit));

    return this.request<unknown>(
      `/looks/${lookId}/run/${resultFormat}?${queryParams.toString()}`
    );
  }

  async copyLook(lookId: string, folderId?: string): Promise<Look> {
    const queryParams = new URLSearchParams();
    if (folderId) queryParams.set('folder_id', folderId);

    return this.request<Look>(`/looks/${lookId}/copy?${queryParams.toString()}`, {
      method: 'POST',
    });
  }

  async moveLook(lookId: string, folderId: string): Promise<Look> {
    return this.request<Look>(`/looks/${lookId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ folder_id: folderId }),
    });
  }

  // ===========================================================================
  // Dashboards
  // ===========================================================================

  async listDashboards(params?: PaginationParams): Promise<PaginatedResponse<Dashboard>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.offset) queryParams.set('offset', String(params.offset));
    if (params?.fields) queryParams.set('fields', params.fields);

    const dashboards = await this.request<Dashboard[]>(`/dashboards?${queryParams.toString()}`);
    return {
      items: dashboards,
      count: dashboards.length,
      hasMore: dashboards.length === (params?.limit || 100),
    };
  }

  async getDashboard(dashboardId: string): Promise<Dashboard> {
    return this.request<Dashboard>(`/dashboards/${dashboardId}`);
  }

  async createDashboard(input: DashboardCreateInput): Promise<Dashboard> {
    return this.request<Dashboard>('/dashboards', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateDashboard(dashboardId: string, input: DashboardUpdateInput): Promise<Dashboard> {
    return this.request<Dashboard>(`/dashboards/${dashboardId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  async deleteDashboard(dashboardId: string): Promise<void> {
    await this.request<void>(`/dashboards/${dashboardId}`, {
      method: 'DELETE',
    });
  }

  async searchDashboards(params: { title?: string; folder_id?: string; limit?: number }): Promise<Dashboard[]> {
    const queryParams = new URLSearchParams();
    if (params.title) queryParams.set('title', params.title);
    if (params.folder_id) queryParams.set('folder_id', params.folder_id);
    if (params.limit) queryParams.set('limit', String(params.limit));

    return this.request<Dashboard[]>(`/dashboards/search?${queryParams.toString()}`);
  }

  async copyDashboard(dashboardId: string, folderId?: string): Promise<Dashboard> {
    const queryParams = new URLSearchParams();
    if (folderId) queryParams.set('folder_id', folderId);

    return this.request<Dashboard>(`/dashboards/${dashboardId}/copy?${queryParams.toString()}`, {
      method: 'POST',
    });
  }

  async moveDashboard(dashboardId: string, folderId: string): Promise<Dashboard> {
    return this.request<Dashboard>(`/dashboards/${dashboardId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ folder_id: folderId }),
    });
  }

  // ===========================================================================
  // Queries
  // ===========================================================================

  async createQuery(input: CreateQueryRequest): Promise<Query> {
    return this.request<Query>('/queries', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async getQuery(queryId: string): Promise<Query> {
    return this.request<Query>(`/queries/${queryId}`);
  }

  async runQuery(queryId: string, resultFormat: ResultFormat, limit?: number): Promise<unknown> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.set('limit', String(limit));

    return this.request<unknown>(
      `/queries/${queryId}/run/${resultFormat}?${queryParams.toString()}`
    );
  }

  async runInlineQuery(
    model: string,
    view: string,
    fields: string[],
    filters?: Record<string, string>,
    sorts?: string[],
    limit?: number,
    resultFormat: ResultFormat = 'json'
  ): Promise<unknown> {
    const body: CreateQueryRequest = {
      model,
      view,
      fields,
      filters,
      sorts,
      limit: limit ? String(limit) : undefined,
    };

    return this.request<unknown>(`/queries/run/${resultFormat}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // ===========================================================================
  // SQL Queries
  // ===========================================================================

  async createSqlQuery(input: CreateSqlQueryRequest): Promise<SqlQuery> {
    return this.request<SqlQuery>('/sql_queries', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async getSqlQuery(slug: string): Promise<SqlQuery> {
    return this.request<SqlQuery>(`/sql_queries/${slug}`);
  }

  async runSqlQuery(slug: string, resultFormat: ResultFormat): Promise<unknown> {
    return this.request<unknown>(`/sql_queries/${slug}/run/${resultFormat}`, {
      method: 'POST',
    });
  }

  // ===========================================================================
  // Folders
  // ===========================================================================

  async listFolders(params?: PaginationParams): Promise<PaginatedResponse<Folder>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.offset) queryParams.set('offset', String(params.offset));
    if (params?.fields) queryParams.set('fields', params.fields);

    const folders = await this.request<Folder[]>(`/folders?${queryParams.toString()}`);
    return {
      items: folders,
      count: folders.length,
      hasMore: folders.length === (params?.limit || 100),
    };
  }

  async getFolder(folderId: string): Promise<Folder> {
    return this.request<Folder>(`/folders/${folderId}`);
  }

  async createFolder(input: FolderCreateInput): Promise<Folder> {
    return this.request<Folder>('/folders', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateFolder(folderId: string, input: FolderUpdateInput): Promise<Folder> {
    return this.request<Folder>(`/folders/${folderId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  async deleteFolder(folderId: string): Promise<void> {
    await this.request<void>(`/folders/${folderId}`, {
      method: 'DELETE',
    });
  }

  async getFolderChildren(folderId: string): Promise<Folder[]> {
    return this.request<Folder[]>(`/folders/${folderId}/children`);
  }

  async getFolderLooks(folderId: string): Promise<Look[]> {
    return this.request<Look[]>(`/folders/${folderId}/looks`);
  }

  async getFolderDashboards(folderId: string): Promise<Dashboard[]> {
    return this.request<Dashboard[]>(`/folders/${folderId}/dashboards`);
  }

  async searchFolders(params: { name?: string; parent_id?: string }): Promise<Folder[]> {
    const queryParams = new URLSearchParams();
    if (params.name) queryParams.set('name', params.name);
    if (params.parent_id) queryParams.set('parent_id', params.parent_id);

    return this.request<Folder[]>(`/folders/search?${queryParams.toString()}`);
  }

  // ===========================================================================
  // Users
  // ===========================================================================

  async listUsers(params?: PaginationParams): Promise<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.offset) queryParams.set('offset', String(params.offset));
    if (params?.fields) queryParams.set('fields', params.fields);

    const users = await this.request<User[]>(`/users?${queryParams.toString()}`);
    return {
      items: users,
      count: users.length,
      hasMore: users.length === (params?.limit || 100),
    };
  }

  async getUser(userId: string): Promise<User> {
    return this.request<User>(`/users/${userId}`);
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/user');
  }

  async createUser(input: UserCreateInput): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateUser(userId: string, input: UserUpdateInput): Promise<User> {
    return this.request<User>(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  async deleteUser(userId: string): Promise<void> {
    await this.request<void>(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async searchUsers(params: { email?: string; first_name?: string; last_name?: string }): Promise<User[]> {
    const queryParams = new URLSearchParams();
    if (params.email) queryParams.set('email', params.email);
    if (params.first_name) queryParams.set('first_name', params.first_name);
    if (params.last_name) queryParams.set('last_name', params.last_name);

    return this.request<User[]>(`/users/search?${queryParams.toString()}`);
  }

  // ===========================================================================
  // Scheduled Plans
  // ===========================================================================

  async listScheduledPlans(params?: { user_id?: string; look_id?: string; dashboard_id?: string }): Promise<ScheduledPlan[]> {
    const queryParams = new URLSearchParams();
    if (params?.user_id) queryParams.set('user_id', params.user_id);

    return this.request<ScheduledPlan[]>(`/scheduled_plans?${queryParams.toString()}`);
  }

  async getScheduledPlan(scheduledPlanId: string): Promise<ScheduledPlan> {
    return this.request<ScheduledPlan>(`/scheduled_plans/${scheduledPlanId}`);
  }

  async createScheduledPlan(input: ScheduledPlanCreateInput): Promise<ScheduledPlan> {
    return this.request<ScheduledPlan>('/scheduled_plans', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateScheduledPlan(scheduledPlanId: string, input: ScheduledPlanUpdateInput): Promise<ScheduledPlan> {
    return this.request<ScheduledPlan>(`/scheduled_plans/${scheduledPlanId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  }

  async deleteScheduledPlan(scheduledPlanId: string): Promise<void> {
    await this.request<void>(`/scheduled_plans/${scheduledPlanId}`, {
      method: 'DELETE',
    });
  }

  async runScheduledPlanOnce(scheduledPlanId: string): Promise<ScheduledPlan> {
    return this.request<ScheduledPlan>(`/scheduled_plans/${scheduledPlanId}/run_once`, {
      method: 'POST',
    });
  }

  async getScheduledPlansForLook(lookId: string): Promise<ScheduledPlan[]> {
    return this.request<ScheduledPlan[]>(`/scheduled_plans/look/${lookId}`);
  }

  async getScheduledPlansForDashboard(dashboardId: string): Promise<ScheduledPlan[]> {
    return this.request<ScheduledPlan[]>(`/scheduled_plans/dashboard/${dashboardId}`);
  }

  // ===========================================================================
  // LookML Models & Explores
  // ===========================================================================

  async listModels(): Promise<LookmlModel[]> {
    return this.request<LookmlModel[]>('/lookml_models');
  }

  async getModel(modelName: string): Promise<LookmlModel> {
    return this.request<LookmlModel>(`/lookml_models/${modelName}`);
  }

  async getExplore(modelName: string, exploreName: string): Promise<LookmlModelExplore> {
    return this.request<LookmlModelExplore>(`/lookml_models/${modelName}/explores/${exploreName}`);
  }

  // ===========================================================================
  // Content
  // ===========================================================================

  async searchContent(params: { terms?: string; limit?: number; types?: string }): Promise<ContentSearch[]> {
    const queryParams = new URLSearchParams();
    if (params.terms) queryParams.set('terms', params.terms);
    if (params.limit) queryParams.set('limit', String(params.limit));
    if (params.types) queryParams.set('types', params.types);

    return this.request<ContentSearch[]>(`/content_search?${queryParams.toString()}`);
  }

  // ===========================================================================
  // Alerts
  // ===========================================================================

  async listAlerts(params?: { look_id?: string; dashboard_id?: string }): Promise<Alert[]> {
    const queryParams = new URLSearchParams();
    if (params?.look_id) queryParams.set('look_id', params.look_id);
    if (params?.dashboard_id) queryParams.set('dashboard_id', params.dashboard_id);

    return this.request<Alert[]>(`/alerts?${queryParams.toString()}`);
  }

  async getAlert(alertId: string): Promise<Alert> {
    return this.request<Alert>(`/alerts/${alertId}`);
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a Looker client instance with tenant-specific credentials.
 *
 * MULTI-TENANT: Each request provides its own credentials via headers,
 * allowing a single server deployment to serve multiple tenants.
 *
 * @param credentials - Tenant credentials parsed from request headers
 */
export function createLookerClient(credentials: TenantCredentials): LookerClient {
  return new LookerClientImpl(credentials);
}
