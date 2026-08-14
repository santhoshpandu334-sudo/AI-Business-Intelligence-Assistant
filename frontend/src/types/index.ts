export type Role = 'Admin' | 'Manager' | 'Analyst' | 'Employee';

export interface User {
  id: number;
  email: string;
  full_name: string;
  company_name: string;
  role: Role;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface DatasetFile {
  id: number;
  original_filename: string;
  original_file_path: string;
  cleaned_file_path?: string;
  mime_type: string;
  file_size_bytes: number;
  encoding: string;
  created_at: string;
}

export interface DatasetColumn {
  id: number;
  column_name: string;
  data_type: string;
  missing_count: number;
  unique_count: number;
  is_numeric: boolean;
  is_date: boolean;
  sample_values?: string[];
}

export interface DatasetStatistics {
  id: number;
  total_rows: number;
  total_columns: number;
  missing_values_count: number;
  duplicate_rows_count: number;
  numeric_cols_count: number;
  categorical_cols_count: number;
  date_cols_count: number;
  completeness_pct: number;
  consistency_pct: number;
  quality_score: number;
  memory_usage_bytes: number;
  numeric_summary_json?: Record<string, any>;
  categorical_summary_json?: Record<string, any>;
}

export interface ValidationIssue {
  severity: 'ERROR' | 'WARNING' | 'INFO';
  type: string;
  message: string;
}

export interface DataQualityReport {
  id: number;
  quality_score: number;
  error_count: number;
  warning_count: number;
  issues_json: ValidationIssue[];
  validated_at: string;
}

export interface Dataset {
  id: number;
  owner_id: number;
  company_name?: string;
  owner_name?: string;
  name: string;
  description?: string;
  file_type: string;
  row_count: number;
  column_count: number;
  quality_score?: number;
  memory_usage_bytes?: number;
  schema_json?: Record<string, string>;
  metrics_json?: any;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface DatasetSummary {
  dataset: Dataset;
  file?: DatasetFile;
  columns: DatasetColumn[];
  statistics?: DatasetStatistics;
  quality_report?: DataQualityReport;
}

// Phase 3 Chat & Conversation Interfaces
export interface ChatMessageItem {
  id: number;
  conversation_id: number;
  sender: 'user' | 'assistant';
  message_text: string;
  sources_json?: string[];
  chart_spec_json?: any;
  data_summary_json?: Record<string, any>;
  sql_query?: string;
  confidence_score?: number;
  follow_ups_json?: string[];
  created_at: string;
}

export interface ConversationItem {
  id: number;
  user_id: number;
  dataset_id?: number;
  title: string;
  is_pinned: boolean;
  model_provider: string; // llama3.1, gemini-pro, gpt-4o
  created_at: string;
  updated_at: string;
  messages: ChatMessageItem[];
}

export interface AISettingsData {
  id: number;
  user_id: number;
  preferred_llm: string;
  temperature: number;
  max_tokens: number;
  prompt_style: string;
  language: string;
}

export interface Insight {
  id: number;
  dataset_id: number;
  type: 'executive_summary' | 'revenue_driver' | 'cost_reduction' | 'anomaly' | 'churn_alert' | 'inventory_warning' | 'business_recommendation';
  title: string;
  content: string;
  importance: 'High' | 'Medium' | 'Low';
  metrics_json?: Record<string, any>;
  created_at: string;
}

export interface ForecastPoint {
  period: string;
  predicted: number;
  upper_bound: number;
  lower_bound: number;
}

export interface ForecastModel {
  id: number;
  dataset_id: number;
  algorithm: 'prophet' | 'xgboost' | 'random_forest' | 'linear_regression';
  target_column: string;
  date_column: string;
  metrics_json: {
    r2_score: number;
    rmse: number;
    mae: number;
  };
  forecast_data_json: ForecastPoint[];
  created_at: string;
}

export interface AnomalyResult {
  id: number;
  dataset_id: number;
  row_index: number;
  anomaly_score: number;
  anomaly_type: 'revenue_spike' | 'fraud_risk' | 'duplicate_invoice' | 'unusual_pattern';
  reasoning: string;
  payload_json?: any;
  created_at: string;
}

export interface Report {
  id: number;
  user_id: number;
  title: string;
  format: 'pdf' | 'excel' | 'docx';
  file_path?: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'alert' | 'info' | 'recommendation' | 'report';
  is_read: boolean;
  created_at: string;
}

export interface AuditLogItem {
  id: number;
  user_id?: number;
  action: string;
  resource: string;
  details?: string;
  ip_address?: string;
  timestamp: string;
}

export interface AdminStats {
  total_users: number;
  role_distribution: Record<string, number>;
  total_datasets: number;
  total_reports: number;
  total_ai_queries: number;
  storage_used_mb: number;
  api_requests_24h: number;
  avg_latency_ms: number;
  system_health: string;
  active_companies: number;
}

export interface KPIDashboardData {
  total_revenue: number | string;
  total_profit: number | string;
  active_customers: number | string;
  total_orders: number | string;
  avg_order_value: number | string;
  profit_margin: number | string;
  dataset_health_score: number;
  revenue_growth_pct: number;
  profit_growth_pct: number;
  dynamic_kpis?: { key: string; name: string; value: number | string }[];
}

export interface ChartDataPoint {
  date: string;
  revenue: number;
  profit: number;
  orders: number;
}

export interface ProductDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface RegionDataPoint {
  region: string;
  sales: number;
}

export interface CategoryDataPoint {
  category: string;
  revenue: number;
}

export interface ChartsDashboardData {
  trend_data: ChartDataPoint[];
  product_data: ProductDataPoint[];
  region_data: RegionDataPoint[];
  category_data: CategoryDataPoint[];
}

export interface BusinessHealthData {
  revenue_score: number;
  profit_score: number;
  customer_score: number;
  inventory_score: number;
  overall_score: number;
}

export interface DashboardSummaryData {
  kpis: KPIDashboardData;
  charts: ChartsDashboardData;
  health: BusinessHealthData;
  domain?: string;
  title?: string;
  subtitle?: string;
  available_filters?: string[];
  filter_metadata?: Record<string, string>;
}

// Phase 5 Forecasting & Anomaly Interfaces
export interface AnomalyItem {
  id?: number;
  dataset_id?: number;
  row_index: number;
  anomaly_score: number;
  anomaly_type: string;
  reasoning: string;
  payload_json?: any;
}

export interface RiskAnalysisData {
  revenue_risk: number;
  profit_risk: number;
  inventory_risk: number;
  customer_risk: number;
  overall_risk: number;
}

export interface AIRecommendationItem {
  title: string;
  priority: string;
  impact: string;
  benefit: string;
  confidence_score: number;
}

export interface ForecastDashboardData {
  forecast_kpis: {
    forecasted_revenue: number;
    forecasted_profit: number;
    forecasted_orders: number;
    anomalies_count: number;
    overall_risk_score: number;
  };
  revenue_forecast: ForecastPoint[];
  profit_forecast: ForecastPoint[];
  orders_forecast: ForecastPoint[];
  anomalies: AnomalyItem[];
  risks: RiskAnalysisData;
  recommendations: AIRecommendationItem[];
}

// Phase 6 Executive Insights Interfaces
export interface ExecutiveSummaryData {
  summary: string;
  total_revenue: number;
  total_profit: number;
  orders: number;
  active_customers: number;
  overall_health_score: number;
  company_status: string;
}

export interface BusinessInsightItem {
  category: string;
  title: string;
  details: string;
  severity: string;
}

export interface RiskIntelligenceItem {
  risk_type: string;
  severity: string;
  business_impact: string;
  probability: string;
  recommendation: string;
}

export interface InsightRecommendation {
  title: string;
  priority: string;
  expected_benefit: string;
  estimated_impact: string;
  confidence_score: number;
}

export interface InsightsDashboardData {
  executive_summary: ExecutiveSummaryData;
  business_insights: BusinessInsightItem[];
  risks: RiskIntelligenceItem[];
  recommendations: InsightRecommendation[];
}

export interface WhatIfScenario {
  id?: number;
  name: string;
  description?: string;
  variables: Record<string, any>;
  projected_metrics?: Record<string, any>;
  created_at?: string;
}

export interface WhatIfRequest {
  scenario_type: string;
  adjustment_pct: number;
  target_metric?: string;
  dataset_id?: number;
}

export interface WhatIfResponse {
  success: boolean;
  scenario_type: string;
  adjustment_pct: number;
  target_metric: string;

  original_revenue: number;
  predicted_revenue: number;
  revenue_diff: number;
  revenue_change_pct: number;

  original_profit: number;
  predicted_profit: number;
  profit_diff: number;
  profit_change_pct: number;

  original_margin: number;
  predicted_margin: number;
  margin_diff: number;
  margin_change_pct: number;

  original_customers: number;
  predicted_customers: number;
  customers_diff: number;
  customers_change_pct: number;

  growth_pct: number;
  risk_level: string;
  confidence_score: number;
  business_explanation: string;
}


export interface HealthScore {
  score: number;
  breakdown: Record<string, number>;
  status: string;
  trend: string;
  calculated_at: string;
}

export interface BusinessRecommendation {
  id?: number;
  title: string;
  description: string;
  impact_score: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  created_at: string;
}

export interface GoalGapItem {
  metric_name: string;
  current_value: number;
  target_value: number;
  gap: number;
  gap_pct: number;
  required_growth_pct: number;
  monthly_target: number;
  weekly_target: number;
  daily_target: number;
}

export interface GoalPlannerRequest {
  target_date: string;
  target_revenue?: number;
  target_profit?: number;
  target_orders?: number;
  target_customers?: number;
  target_margin?: number;
}

export interface GoalPlannerResponse {
  success: boolean;
  target_date: string;
  gaps: GoalGapItem[];
  overall_feasibility_score: number;
  overall_difficulty: string;
  overall_risk_level: string;
  recommended_strategy: string;
  plan_steps: Record<string, any>[];
  recommendations: string[];
}

export interface DecisionHistoryItem {
  id: number;
  user_email: string;
  timestamp: string;
  decision_type: string;
  scenario_type: string;
  input_parameters: Record<string, any>;
  output_summary: string;
  confidence_score: number;
  risk_level: string;
}


export interface RootCauseAnalysis {
  metric: string;
  deviation_pct: number;
  possible_causes: Record<string, any>[];
  insights: string[];
  analyzed_at: string;
}

export interface BusinessAlert {
  id?: number;
  title: string;
  message: string;
  severity: 'Info' | 'Warning' | 'Critical' | 'High' | 'Medium' | 'Low';
  metric?: string;
  current_value?: number;
  threshold_value?: number;
  is_resolved: boolean;
  created_at: string;
}

export interface ExecutiveAdvisorRequest {
  query: string;
  focus_area?: string;
  context_depth?: 'brief' | 'comprehensive';
}

export interface ExecutiveAdvisorResponse {
  response_text: string;
  supporting_data?: Record<string, any>;
  suggested_actions: string[];
  confidence_score: number;
  generated_at: string;
}

export interface DecisionNoDataResponse {
  success: boolean;
  data: any;
  message: string;
}





