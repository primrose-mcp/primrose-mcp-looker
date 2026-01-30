/**
 * Looker Entity Types
 *
 * Type definitions for Looker API entities including Looks, Dashboards,
 * Queries, Folders, Users, and Scheduled Plans.
 */

// =============================================================================
// Pagination
// =============================================================================

export interface PaginationParams {
  /** Number of items to return */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Fields to return */
  fields?: string;
}

export interface PaginatedResponse<T> {
  /** Array of items */
  items: T[];
  /** Number of items in this response */
  count: number;
  /** Whether more items are available */
  hasMore: boolean;
}

// =============================================================================
// Result Formats
// =============================================================================

export type ResultFormat =
  | 'json'
  | 'json_detail'
  | 'json_fe'
  | 'json_bi'
  | 'csv'
  | 'txt'
  | 'html'
  | 'md'
  | 'xlsx'
  | 'sql'
  | 'png'
  | 'jpg';

// =============================================================================
// Look
// =============================================================================

export interface Look {
  id: string;
  title?: string;
  description?: string;
  folder_id?: string;
  folder?: FolderBase;
  query_id?: string;
  query?: Query;
  user_id?: string;
  user?: UserBase;
  is_run_on_load?: boolean;
  public?: boolean;
  public_slug?: string;
  embed_url?: string;
  short_url?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  deleted?: boolean;
  last_accessed_at?: string;
  last_viewed_at?: string;
  view_count?: number;
  favorite_count?: number;
  content_favorite_id?: string;
  content_metadata_id?: string;
  model?: LookModel;
}

export interface LookModel {
  id?: string;
  label?: string;
}

export interface LookCreateInput {
  title: string;
  query_id?: string;
  folder_id?: string;
  description?: string;
  is_run_on_load?: boolean;
  public?: boolean;
}

export interface LookUpdateInput {
  title?: string;
  description?: string;
  folder_id?: string;
  is_run_on_load?: boolean;
  public?: boolean;
  deleted?: boolean;
}

// =============================================================================
// Dashboard
// =============================================================================

export interface Dashboard {
  id: string;
  title?: string;
  description?: string;
  folder_id?: string;
  folder?: FolderBase;
  user_id?: string;
  user?: UserBase;
  slug?: string;
  preferred_viewer?: string;
  readonly?: boolean;
  refresh_interval?: string;
  refresh_interval_to_i?: number;
  load_configuration?: string;
  background_color?: string;
  show_title?: boolean;
  title_color?: string;
  show_filters_bar?: boolean;
  tile_background_color?: string;
  tile_text_color?: string;
  text_tile_text_color?: string;
  query_timezone?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  deleted?: boolean;
  last_accessed_at?: string;
  last_viewed_at?: string;
  view_count?: number;
  favorite_count?: number;
  content_favorite_id?: string;
  content_metadata_id?: string;
  embed_url?: string;
  model?: LookmlModelNavExplore;
  dashboard_elements?: DashboardElement[];
  dashboard_filters?: DashboardFilter[];
  dashboard_layouts?: DashboardLayout[];
}

export interface DashboardElement {
  id?: string;
  dashboard_id?: string;
  look_id?: string;
  query_id?: string;
  type?: string;
  title?: string;
  subtitle_text?: string;
  note_text?: string;
  note_display?: string;
  note_state?: string;
  body_text?: string;
  title_hidden?: boolean;
  title_text?: string;
  look?: LookWithQuery;
  query?: Query;
  result_maker_id?: string;
  result_maker?: ResultMakerWithIdVisConfigAndDynamicFields;
}

export interface DashboardFilter {
  id?: string;
  dashboard_id?: string;
  name?: string;
  title?: string;
  type?: string;
  default_value?: string;
  model?: string;
  explore?: string;
  dimension?: string;
  row?: number;
  field?: Record<string, unknown>;
  listens_to_filters?: string[];
  allow_multiple_values?: boolean;
  required?: boolean;
  ui_config?: Record<string, unknown>;
}

export interface DashboardLayout {
  id?: string;
  dashboard_id?: string;
  type?: string;
  active?: boolean;
  column_width?: number;
  width?: number;
  deleted?: boolean;
  dashboard_title?: string;
  dashboard_layout_components?: DashboardLayoutComponent[];
}

export interface DashboardLayoutComponent {
  id?: string;
  dashboard_layout_id?: string;
  dashboard_element_id?: string;
  row?: number;
  column?: number;
  width?: number;
  height?: number;
  deleted?: boolean;
}

export interface LookWithQuery {
  id?: string;
  title?: string;
  query?: Query;
}

export interface ResultMakerWithIdVisConfigAndDynamicFields {
  id?: string;
  dynamic_fields?: string;
  vis_config?: Record<string, unknown>;
  query_id?: string;
  query?: Query;
}

export interface LookmlModelNavExplore {
  name?: string;
  label?: string;
}

export interface DashboardCreateInput {
  title: string;
  folder_id?: string;
  description?: string;
  refresh_interval?: string;
  background_color?: string;
  show_title?: boolean;
  show_filters_bar?: boolean;
  query_timezone?: string;
}

export interface DashboardUpdateInput {
  title?: string;
  description?: string;
  folder_id?: string;
  refresh_interval?: string;
  background_color?: string;
  show_title?: boolean;
  show_filters_bar?: boolean;
  query_timezone?: string;
  deleted?: boolean;
}

// =============================================================================
// Query
// =============================================================================

export interface Query {
  id?: string;
  model?: string;
  view?: string;
  fields?: string[];
  pivots?: string[];
  fill_fields?: string[];
  filters?: Record<string, string>;
  filter_expression?: string;
  sorts?: string[];
  limit?: string;
  column_limit?: string;
  total?: boolean;
  row_total?: string;
  subtotals?: string[];
  vis_config?: Record<string, unknown>;
  filter_config?: Record<string, unknown>;
  visible_ui_sections?: string;
  slug?: string;
  dynamic_fields?: string;
  client_id?: string;
  share_url?: string;
  expanded_share_url?: string;
  url?: string;
  has_table_calculations?: boolean;
  runtime?: number;
}

export interface CreateQueryRequest {
  model: string;
  view: string;
  fields?: string[];
  pivots?: string[];
  fill_fields?: string[];
  filters?: Record<string, string>;
  filter_expression?: string;
  sorts?: string[];
  limit?: string;
  column_limit?: string;
  total?: boolean;
  row_total?: string;
  subtotals?: string[];
  vis_config?: Record<string, unknown>;
  filter_config?: Record<string, unknown>;
  visible_ui_sections?: string;
  dynamic_fields?: string;
}

// =============================================================================
// SQL Query
// =============================================================================

export interface SqlQuery {
  slug?: string;
  last_runtime?: number;
  run_count?: number;
  browser_limit?: number;
  sql?: string;
  last_run_at?: string;
  connection?: DBConnection;
  model_name?: string;
  creator?: UserBase;
  explore_url?: string;
  plaintext?: boolean;
  vis_config?: Record<string, unknown>;
  result_maker_id?: string;
}

export interface DBConnection {
  name?: string;
  dialect?: Dialect;
  snippets?: Snippet[];
  pdts_enabled?: boolean;
  host?: string;
  port?: string;
  username?: string;
  database?: string;
  db_timezone?: string;
  query_timezone?: string;
  schema?: string;
  max_connections?: number;
  max_billing_gigabytes?: string;
  ssl?: boolean;
  verify_ssl?: boolean;
  tmp_db_name?: string;
  jdbc_additional_params?: string;
  pool_timeout?: number;
  dialect_name?: string;
  supports_data_studio_link?: boolean;
  created_at?: string;
  user_id?: string;
  example?: boolean;
  user_attribute_fields?: string[];
  maintenance_cron?: string;
  last_regen_at?: string;
  last_reap_at?: string;
  managed?: boolean;
  uses_oauth?: boolean;
  uses_instance_oauth?: boolean;
  pdt_context_override?: PDTContextOverride;
}

export interface Dialect {
  name?: string;
  label?: string;
  supports_cost_estimate?: boolean;
  persistent_table_indexes?: string;
  persistent_table_sortkeys?: string;
  persistent_table_distkey?: string;
  supports_streaming?: boolean;
  automatically_run_sql_runner_snippets?: boolean;
  connection_tests?: string[];
  supports_inducer?: boolean;
  supports_multiple_databases?: boolean;
  supports_persistent_derived_tables?: boolean;
  has_ssl_support?: boolean;
}

export interface Snippet {
  name?: string;
  label?: string;
  sql?: string;
}

export interface PDTContextOverride {
  context?: string;
  host?: string;
  port?: string;
  username?: string;
  database?: string;
  schema?: string;
  jdbc_additional_params?: string;
  after_connect_statements?: string;
}

export interface CreateSqlQueryRequest {
  connection_name?: string;
  connection_id?: string;
  model_name?: string;
  sql: string;
}

// =============================================================================
// Folder
// =============================================================================

export interface Folder {
  id: string;
  name: string;
  parent_id?: string;
  content_metadata_id?: string;
  created_at?: string;
  creator_id?: string;
  child_count?: number;
  external_id?: string;
  is_embed?: boolean;
  is_embed_shared_root?: boolean;
  is_embed_users_root?: boolean;
  is_personal?: boolean;
  is_personal_descendant?: boolean;
  is_shared_root?: boolean;
  is_users_root?: boolean;
  dashboards?: DashboardBase[];
  looks?: LookWithDashboards[];
}

export interface FolderBase {
  id?: string;
  name?: string;
  parent_id?: string;
}

export interface DashboardBase {
  id?: string;
  title?: string;
  folder_id?: string;
}

export interface LookWithDashboards {
  id?: string;
  title?: string;
  folder_id?: string;
}

export interface FolderCreateInput {
  name: string;
  parent_id: string;
}

export interface FolderUpdateInput {
  name?: string;
  parent_id?: string;
}

// =============================================================================
// User
// =============================================================================

export interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  email?: string;
  is_disabled?: boolean;
  avatar_url?: string;
  home_folder_id?: string;
  personal_folder_id?: string;
  created_at?: string;
  logged_in_at?: string;
  presumed_looker_employee?: boolean;
  verified_looker_employee?: boolean;
  roles_externally_managed?: boolean;
  allow_direct_roles?: boolean;
  allow_normal_group_membership?: boolean;
  allow_roles_from_normal_groups?: boolean;
  embed_group_folder_id?: string;
  locale?: string;
  ui_state?: Record<string, unknown>;
  models_dir_validated?: boolean;
  role_ids?: string[];
  group_ids?: string[];
  credentials_email?: CredentialsEmail;
  credentials_totp?: CredentialsTotp;
  credentials_ldap?: CredentialsLDAP;
  credentials_google?: CredentialsGoogle;
  credentials_saml?: CredentialsSaml;
  credentials_oidc?: CredentialsOIDC;
  credentials_api3?: CredentialsApi3[];
  credentials_embed?: CredentialsEmbed[];
  sessions?: Session[];
}

export interface UserBase {
  id?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  email?: string;
  avatar_url?: string;
}

export interface CredentialsEmail {
  email?: string;
  created_at?: string;
  logged_in_at?: string;
  user_id?: string;
  type?: string;
  is_disabled?: boolean;
  forced_password_reset_at_next_login?: boolean;
  url?: string;
}

export interface CredentialsTotp {
  created_at?: string;
  is_disabled?: boolean;
  type?: string;
  verified?: boolean;
  url?: string;
}

export interface CredentialsLDAP {
  email?: string;
  created_at?: string;
  logged_in_at?: string;
  ldap_id?: string;
  ldap_dn?: string;
  type?: string;
  is_disabled?: boolean;
  url?: string;
}

export interface CredentialsGoogle {
  email?: string;
  created_at?: string;
  logged_in_at?: string;
  google_user_id?: string;
  type?: string;
  is_disabled?: boolean;
  url?: string;
}

export interface CredentialsSaml {
  email?: string;
  created_at?: string;
  logged_in_at?: string;
  saml_user_id?: string;
  type?: string;
  is_disabled?: boolean;
  url?: string;
}

export interface CredentialsOIDC {
  email?: string;
  created_at?: string;
  logged_in_at?: string;
  oidc_user_id?: string;
  type?: string;
  is_disabled?: boolean;
  url?: string;
}

export interface CredentialsApi3 {
  id?: string;
  created_at?: string;
  is_disabled?: boolean;
  type?: string;
  client_id?: string;
  url?: string;
}

export interface CredentialsEmbed {
  id?: string;
  created_at?: string;
  logged_in_at?: string;
  external_user_id?: string;
  type?: string;
  is_disabled?: boolean;
  url?: string;
}

export interface Session {
  id?: string;
  ip_address?: string;
  browser?: string;
  operating_system?: string;
  city?: string;
  state?: string;
  country?: string;
  credentials_type?: string;
  extended_at?: string;
  extended_count?: number;
  sudo_user_id?: string;
  created_at?: string;
  expires_at?: string;
  url?: string;
}

export interface UserCreateInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  is_disabled?: boolean;
  locale?: string;
  models_dir_validated?: boolean;
}

export interface UserUpdateInput {
  first_name?: string;
  last_name?: string;
  email?: string;
  is_disabled?: boolean;
  locale?: string;
  models_dir_validated?: boolean;
}

// =============================================================================
// Scheduled Plan
// =============================================================================

export interface ScheduledPlan {
  id?: string;
  name?: string;
  user_id?: string;
  user?: UserBase;
  title?: string;
  run_as_recipient?: boolean;
  enabled?: boolean;
  next_run_at?: string;
  last_run_at?: string;
  look_id?: string;
  dashboard_id?: string;
  lookml_dashboard_id?: string;
  filters_string?: string;
  dashboard_filters?: string;
  require_results?: boolean;
  require_no_results?: boolean;
  require_change?: boolean;
  send_all_results?: boolean;
  crontab?: string;
  timezone?: string;
  query_id?: string;
  scheduled_plan_destination?: ScheduledPlanDestination[];
  run_once?: boolean;
  include_links?: boolean;
  pdf_paper_size?: string;
  pdf_landscape?: boolean;
  embed?: boolean;
  color_theme?: string;
  long_tables?: boolean;
  inline_table_width?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ScheduledPlanDestination {
  id?: string;
  scheduled_plan_id?: string;
  format?: string;
  apply_formatting?: boolean;
  apply_vis?: boolean;
  address?: string;
  looker_recipient?: boolean;
  type?: string;
  parameters?: string;
  secret_parameters?: string;
  message?: string;
}

export interface ScheduledPlanCreateInput {
  name?: string;
  look_id?: string;
  dashboard_id?: string;
  lookml_dashboard_id?: string;
  title?: string;
  run_as_recipient?: boolean;
  enabled?: boolean;
  filters_string?: string;
  dashboard_filters?: string;
  require_results?: boolean;
  require_no_results?: boolean;
  require_change?: boolean;
  send_all_results?: boolean;
  crontab?: string;
  timezone?: string;
  query_id?: string;
  scheduled_plan_destination?: ScheduledPlanDestination[];
  run_once?: boolean;
  include_links?: boolean;
  pdf_paper_size?: string;
  pdf_landscape?: boolean;
  embed?: boolean;
  color_theme?: string;
  long_tables?: boolean;
  inline_table_width?: number;
}

export interface ScheduledPlanUpdateInput {
  name?: string;
  title?: string;
  run_as_recipient?: boolean;
  enabled?: boolean;
  filters_string?: string;
  dashboard_filters?: string;
  require_results?: boolean;
  require_no_results?: boolean;
  require_change?: boolean;
  send_all_results?: boolean;
  crontab?: string;
  timezone?: string;
  scheduled_plan_destination?: ScheduledPlanDestination[];
  include_links?: boolean;
  pdf_paper_size?: string;
  pdf_landscape?: boolean;
  embed?: boolean;
  color_theme?: string;
  long_tables?: boolean;
  inline_table_width?: number;
}

// =============================================================================
// LookML Model & Explore
// =============================================================================

export interface LookmlModel {
  name?: string;
  label?: string;
  project_name?: string;
  allowed_db_connection_names?: string[];
  unlimited_db_connections?: boolean;
  has_content?: boolean;
  explores?: LookmlModelNavExplore[];
}

export interface LookmlModelExplore {
  id?: string;
  name?: string;
  description?: string;
  label?: string;
  title?: string;
  scopes?: string[];
  can_total?: boolean;
  can_develop?: boolean;
  can_see_lookml?: boolean;
  lookml_link?: string;
  can_save?: boolean;
  can_explain?: boolean;
  can_pivot_in_db?: boolean;
  can_subtotal?: boolean;
  has_timezone_support?: boolean;
  supports_cost_estimate?: boolean;
  connection_name?: string;
  null_sort_treatment?: string;
  files?: string[];
  source_file?: string;
  project_name?: string;
  model_name?: string;
  view_name?: string;
  hidden?: boolean;
  sql_table_name?: string;
  access_filter_fields?: string[];
  access_filters?: LookmlModelExploreAccessFilter[];
  aliases?: LookmlModelExploreAlias[];
  always_filter?: LookmlModelExploreAlwaysFilter[];
  conditionally_filter?: LookmlModelExploreConditionallyFilter[];
  index_fields?: string[];
  sets?: LookmlModelExploreSet[];
  tags?: string[];
  errors?: LookmlModelExploreError[];
  fields?: LookmlModelExploreFieldset;
  joins?: LookmlModelExploreJoins[];
  group_label?: string;
  supported_measure_types?: SupportedMeasureType[];
  always_join?: string[];
}

export interface LookmlModelExploreAccessFilter {
  field?: string;
  user_attribute?: string;
}

export interface LookmlModelExploreAlias {
  name?: string;
  value?: string;
}

export interface LookmlModelExploreAlwaysFilter {
  name?: string;
  value?: string;
}

export interface LookmlModelExploreConditionallyFilter {
  field?: string;
  value?: string;
}

export interface LookmlModelExploreSet {
  name?: string;
  value?: string[];
}

export interface LookmlModelExploreError {
  message?: string;
  details?: unknown;
  error_pos?: string;
  field_error?: boolean;
}

export interface LookmlModelExploreFieldset {
  dimensions?: LookmlModelExploreField[];
  measures?: LookmlModelExploreField[];
  filters?: LookmlModelExploreField[];
  parameters?: LookmlModelExploreField[];
}

export interface LookmlModelExploreField {
  name?: string;
  label?: string;
  label_short?: string;
  view?: string;
  view_label?: string;
  description?: string;
  type?: string;
  category?: string;
  sql?: string;
  sql_case?: LookmlModelExploreFieldSqlCase[];
  filters?: LookmlModelExploreFieldMeasureFilters[];
  sortable?: boolean;
  can_filter?: boolean;
  suggest_dimension?: string;
  suggest_explore?: string;
  suggestable?: boolean;
  enumerations?: LookmlModelExploreFieldEnumeration[];
  tags?: string[];
  dynamic?: boolean;
  hidden?: boolean;
  primary_key?: boolean;
  default_filter_value?: string;
  parameter?: boolean;
  permanent?: boolean;
  source_file?: string;
  source_file_path?: string;
  field_group_label?: string;
  field_group_variant?: string;
  fill_style?: string;
  project_name?: string;
  can_time_filter?: boolean;
  time_interval?: LookmlModelExploreFieldTimeInterval;
  is_fiscal?: boolean;
  is_timeframe?: boolean;
  is_numeric?: boolean;
  week_start_day?: string;
  original_view?: string;
  dimension_group?: string;
  user_attribute_filter_types?: string[];
  fiscal_month_offset?: number;
  value_format?: string;
  map_layer?: LookmlModelExploreFieldMapLayer;
  requires_refresh_on_sort?: boolean;
  measure?: boolean;
  drill_fields?: string[];
}

export interface LookmlModelExploreFieldSqlCase {
  value?: string;
  condition?: string;
}

export interface LookmlModelExploreFieldMeasureFilters {
  field?: string;
  condition?: string;
}

export interface LookmlModelExploreFieldEnumeration {
  value?: string;
  label?: string;
}

export interface LookmlModelExploreFieldTimeInterval {
  name?: string;
  count?: number;
}

export interface LookmlModelExploreFieldMapLayer {
  name?: string;
  url?: string;
  feature_key?: string;
  property_key?: string;
  property_label_key?: string;
  max_zoom_level?: number;
  min_zoom_level?: number;
  format?: string;
  extents_json_url?: string;
}

export interface LookmlModelExploreJoins {
  name?: string;
  dependent_fields?: string[];
  fields?: string[];
  foreign_key?: string;
  from?: string;
  outer_only?: boolean;
  relationship?: string;
  required_joins?: string[];
  sql_foreign_key?: string;
  sql_on?: string;
  sql_table_name?: string;
  type?: string;
  view_label?: string;
}

export interface SupportedMeasureType {
  dimension_type?: string;
  measure_types?: string[];
}

// =============================================================================
// Content Search
// =============================================================================

export interface ContentSearch {
  id?: string;
  title?: string;
  type?: string;
  description?: string;
  folder_id?: string;
  folder_name?: string;
  favorite_count?: number;
  view_count?: number;
  last_accessed_at?: string;
  preferred_viewer?: string;
}

// =============================================================================
// Alert
// =============================================================================

export interface Alert {
  id?: string;
  look_id?: string;
  dashboard_element_id?: string;
  cron?: string;
  timezone?: string;
  title?: string;
  custom_title?: string;
  description?: string;
  comparison_type?: string;
  threshold?: number;
  field?: AlertField;
  destinations?: AlertDestination[];
  is_disabled?: boolean;
  disabled_reason?: string;
  is_public?: boolean;
  investigative_content_type?: string;
  investigative_content_id?: string;
  investigative_content_title?: string;
  lookml_dashboard_id?: string;
  lookml_link_id?: string;
  time_series_condition_state?: AlertConditionState;
  owner_id?: string;
  owner_display_name?: string;
  followable?: boolean;
  applied_dashboard_filters?: AlertAppliedDashboardFilter[];
}

export interface AlertField {
  title?: string;
  name?: string;
  filter?: AlertFieldFilter[];
}

export interface AlertFieldFilter {
  field_name?: string;
  field_value?: string;
  filter_value?: string;
}

export interface AlertDestination {
  destination_type?: string;
  email_address?: string;
  action_hub_integration_id?: string;
  action_hub_form_params_json?: string;
}

export interface AlertConditionState {
  previous_time_series_id?: string;
  latest_time_series_id?: string;
}

export interface AlertAppliedDashboardFilter {
  filter_title?: string;
  field_name?: string;
  filter_value?: string;
  filter_description?: string;
}

// =============================================================================
// Response Format
// =============================================================================

export type ResponseFormat = 'json' | 'markdown';
