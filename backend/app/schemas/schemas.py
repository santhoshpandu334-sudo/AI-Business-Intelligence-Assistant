from datetime import datetime
from typing import Optional, List, Any, Dict, Union
from pydantic import BaseModel, EmailStr, ConfigDict

# Auth & User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    company_name: Optional[str] = "Acme Corp"
    role: Optional[str] = "Analyst"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: int
    avatar_url: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    email_digest_enabled: bool = False
    last_digest_sent_at: Optional[datetime] = None

# Dataset Schemas
class DatasetBase(BaseModel):
    name: str
    description: Optional[str] = None

class DatasetCreate(DatasetBase):
    pass

class DatasetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class DatasetFileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
    
    id: int
    original_filename: str
    original_file_path: str
    cleaned_file_path: Optional[str] = None
    mime_type: str
    file_size_bytes: int
    encoding: str
    created_at: datetime

class DatasetColumnResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: int
    column_name: str
    data_type: str
    missing_count: int
    unique_count: int
    is_numeric: bool
    is_date: bool
    sample_values: Optional[List[str]] = None

class DatasetStatisticsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: int
    total_rows: int
    total_columns: int
    missing_values_count: int
    duplicate_rows_count: int
    numeric_cols_count: int
    categorical_cols_count: int
    date_cols_count: int
    completeness_pct: float
    consistency_pct: float
    quality_score: float
    memory_usage_bytes: int
    numeric_summary_json: Optional[Dict[str, Any]] = None
    categorical_summary_json: Optional[Dict[str, Any]] = None

class DataQualityReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: int
    quality_score: float
    error_count: int
    warning_count: int
    issues_json: List[Dict[str, Any]]
    validated_at: datetime

class DatasetResponse(DatasetBase):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: int
    owner_id: int
    company_name: Optional[str] = "Acme Corp"
    owner_name: Optional[str] = "Analyst User"
    file_type: str
    row_count: int
    column_count: int
    quality_score: Optional[float] = 100.0
    memory_usage_bytes: Optional[int] = 0
    schema_json: Optional[Dict[str, Any]] = None
    metrics_json: Optional[Dict[str, Any]] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

class DatasetSummaryResponse(BaseModel):
    dataset: DatasetResponse
    file: Optional[DatasetFileResponse] = None
    columns: List[DatasetColumnResponse] = []
    statistics: Optional[DatasetStatisticsResponse] = None
    quality_report: Optional[DataQualityReportResponse] = None

# Phase 3 Chat & Conversation Schemas
class ConversationCreate(BaseModel):
    title: Optional[str] = "New Business Intelligence Query"
    dataset_id: Optional[int] = None
    model_provider: Optional[str] = "llama3.1"

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    is_pinned: Optional[bool] = None
    model_provider: Optional[str] = None

class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: int
    conversation_id: int
    sender: str
    message_text: str
    sources_json: Optional[List[str]] = None
    chart_spec_json: Optional[Dict[str, Any]] = None
    data_summary_json: Optional[Dict[str, Any]] = None
    sql_query: Optional[str] = None
    confidence_score: Optional[float] = 95.0
    follow_ups_json: Optional[List[str]] = None
    created_at: datetime

class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: int
    user_id: int
    dataset_id: Optional[int] = None
    title: str
    is_pinned: bool
    model_provider: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse] = []

class AISettingsUpdate(BaseModel):
    preferred_llm: Optional[str] = "llama3.1"
    temperature: Optional[float] = 0.2
    max_tokens: Optional[int] = 2048
    prompt_style: Optional[str] = "Executive Analytical"
    language: Optional[str] = "en"

class AISettingsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: int
    user_id: int
    preferred_llm: str
    temperature: float
    max_tokens: int
    prompt_style: str
    language: str

# Legacy RAG Chat Schemas
class ChatMessage(BaseModel):
    dataset_id: Optional[int] = None
    message: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[str] = []
    recommended_chart: Optional[Dict[str, Any]] = None
    data_summary: Optional[Dict[str, Any]] = None

# Insight Schemas
class InsightResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: int
    dataset_id: int
    type: str
    title: str
    content: str
    importance: str
    metrics_json: Optional[Dict[str, Any]] = None
    created_at: datetime

# Forecast Schemas
class ForecastRequest(BaseModel):
    dataset_id: int
    algorithm: str = "xgboost" # prophet, xgboost, random_forest, linear_regression
    target_column: str
    date_column: str
    periods: int = 12

class ForecastResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: int
    dataset_id: int
    algorithm: str
    target_column: str
    date_column: str
    metrics_json: Dict[str, Any]
    forecast_data_json: List[Dict[str, Any]]
    created_at: datetime

# Anomaly Schemas
class AnomalyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: int
    dataset_id: int
    row_index: int
    anomaly_score: float
    anomaly_type: str
    reasoning: str
    payload_json: Optional[Dict[str, Any]] = None
    created_at: datetime

# Report Schemas
class ReportRequest(BaseModel):
    title: str
    format: str # pdf, excel, docx
    dataset_id: Optional[int] = None
    include_kpis: bool = True
    include_forecasts: bool = True
    include_insights: bool = True

class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: int
    user_id: int
    title: str
    format: str
    file_path: Optional[str] = None
    created_at: datetime

# Notification & Admin Schemas
class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: int
    user_id: Optional[int] = None
    action: str
    resource: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: datetime

class AdminStatsResponse(BaseModel):
    total_users: int
    active_companies: int
    total_datasets: int
    total_ai_queries: int
    storage_used_mb: float
    system_health: str

# Phase 4 Analytics Dashboard Schemas
class KPIDashboardResponse(BaseModel):
    total_revenue: Union[float, str]
    total_profit: Union[float, str]
    active_customers: Union[int, str]
    total_orders: Union[int, str]
    avg_order_value: Union[float, str]
    profit_margin: Union[float, str]
    dataset_health_score: float
    revenue_growth_pct: float
    profit_growth_pct: float
    dynamic_kpis: Optional[List[Dict[str, Any]]] = None

class ChartDataPoint(BaseModel):
    date: str
    revenue: Optional[float] = 0.0
    profit: Optional[float] = 0.0
    orders: Optional[int] = 0
    value: Optional[float] = 0.0

class ProductDataPoint(BaseModel):
    name: str
    value: float
    color: str

class RegionDataPoint(BaseModel):
    region: str
    sales: float

class CategoryDataPoint(BaseModel):
    category: str
    revenue: float

class ChartsDashboardResponse(BaseModel):
    trend_data: List[ChartDataPoint]
    product_data: List[ProductDataPoint]
    region_data: List[RegionDataPoint]
    category_data: List[CategoryDataPoint]

class BusinessHealthResponse(BaseModel):
    revenue_score: float
    profit_score: float
    customer_score: float
    inventory_score: float
    overall_score: float

class DashboardSummaryResponse(BaseModel):
    kpis: KPIDashboardResponse
    charts: ChartsDashboardResponse
    health: BusinessHealthResponse
    domain: Optional[str] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    available_filters: Optional[List[str]] = None
    filter_metadata: Optional[Dict[str, str]] = None

# Phase 5 Forecasting & Anomaly Detection Schemas
class ForecastDataPointResponse(BaseModel):
    period: str
    predicted: float
    upper_bound: float
    lower_bound: float

class AnomalyItemResponse(BaseModel):
    id: Optional[int] = None
    dataset_id: Optional[int] = None
    row_index: int
    anomaly_score: float
    anomaly_type: str
    reasoning: str
    payload_json: Optional[Dict[str, Any]] = None

class RiskAnalysisResponse(BaseModel):
    revenue_risk: float
    profit_risk: float
    inventory_risk: float
    customer_risk: float
    overall_risk: float

class RecommendationResponse(BaseModel):
    title: str
    priority: str
    impact: str
    benefit: str
    confidence_score: float

class ForecastDashboardResponse(BaseModel):
    forecast_kpis: Dict[str, Any]
    revenue_forecast: List[ForecastDataPointResponse]
    profit_forecast: List[ForecastDataPointResponse]
    orders_forecast: List[ForecastDataPointResponse]
    anomalies: List[AnomalyItemResponse]
    risks: RiskAnalysisResponse
    recommendations: List[RecommendationResponse]

# Phase 6 Executive Insights Schemas
class ExecutiveSummaryResponse(BaseModel):
    summary: str
    total_revenue: float
    total_profit: float
    orders: int
    active_customers: int
    overall_health_score: float
    company_status: str

class BusinessInsightItemResponse(BaseModel):
    category: str
    title: str
    details: str
    severity: str

class RiskIntelligenceItemResponse(BaseModel):
    risk_type: str
    severity: str
    business_impact: str
    probability: str
    recommendation: str

class InsightRecommendationResponse(BaseModel):
    title: str
    priority: str
    expected_benefit: str
    estimated_impact: str
    confidence_score: float

class InsightsDashboardResponse(BaseModel):
    executive_summary: ExecutiveSummaryResponse
    business_insights: List[BusinessInsightItemResponse]
    risks: List[RiskIntelligenceItemResponse]
    recommendations: List[InsightRecommendationResponse]

# Phase 7 - AI Decision Intelligence Schemas
class WhatIfScenario(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    variables: Dict[str, Any]
    projected_metrics: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None

class HealthScore(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    score: float
    breakdown: Dict[str, float]
    status: str
    trend: str
    calculated_at: datetime

class BusinessRecommendation(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: Optional[int] = None
    title: str
    description: str
    impact_score: float
    difficulty: str  # Easy, Medium, Hard
    category: str  # cost, revenue, customer, inventory
    created_at: datetime

class GoalGapItem(BaseModel):
    metric_name: str
    current_value: float
    target_value: float
    gap: float
    gap_pct: float
    required_growth_pct: float
    monthly_target: float
    weekly_target: float
    daily_target: float

class GoalPlannerRequest(BaseModel):
    target_date: str
    target_revenue: Optional[float] = None
    target_profit: Optional[float] = None
    target_orders: Optional[float] = None
    target_customers: Optional[float] = None
    target_margin: Optional[float] = None

class GoalPlannerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    success: bool
    target_date: str
    gaps: List[GoalGapItem]
    overall_feasibility_score: float
    overall_difficulty: str
    overall_risk_level: str
    recommended_strategy: str
    plan_steps: List[Dict[str, Any]]
    recommendations: List[str]

class RootCauseAnalysis(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    metric: str
    deviation_pct: float
    possible_causes: List[Dict[str, Any]]
    insights: List[str]
    analyzed_at: datetime

class BusinessAlert(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: Optional[int] = None
    title: str
    message: str
    severity: str  # Info, Warning, Critical
    metric: Optional[str] = None
    current_value: Optional[float] = None
    threshold_value: Optional[float] = None
    is_resolved: bool = False
    created_at: datetime

class ExecutiveAdvisorRequest(BaseModel):
    query: str
    focus_area: Optional[str] = None
    context_depth: Optional[str] = "comprehensive"

class ExecutiveAdvisorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    response_text: str
    supporting_data: Optional[Dict[str, Any]] = None
    suggested_actions: List[str]
    confidence_score: float
    generated_at: datetime

class DecisionNoDataResponse(BaseModel):
    success: bool = True
    data: Optional[Dict[str, Any]] = None
    message: str = "No datasets uploaded."

class WhatIfRequest(BaseModel):
    scenario_type: str
    adjustment_pct: float
    target_metric: Optional[str] = "revenue"
    dataset_id: Optional[int] = None

class WhatIfResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    success: bool = True
    scenario_type: str
    adjustment_pct: float
    target_metric: str

    original_revenue: float
    predicted_revenue: float
    revenue_diff: float
    revenue_change_pct: float

    original_profit: float
    predicted_profit: float
    profit_diff: float
    profit_change_pct: float

    original_margin: float
    predicted_margin: float
    margin_diff: float
    margin_change_pct: float

    original_customers: int
    predicted_customers: int
    customers_diff: int
    customers_change_pct: float

    growth_pct: float
    risk_level: str
    confidence_score: float
    business_explanation: str

class DecisionHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())

    id: int
    user_email: str
    timestamp: datetime
    decision_type: str
    scenario_type: str
    input_parameters: Dict[str, Any]
    output_summary: str
    confidence_score: float
    risk_level: str


class EmailDigestPreferenceResponse(BaseModel):
    email_digest_enabled: bool
    user_email: str
    last_digest_sent: Optional[datetime] = None

class EmailDigestPreferenceUpdate(BaseModel):
    email_digest_enabled: bool







