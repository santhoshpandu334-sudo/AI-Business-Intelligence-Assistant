import { 
  User, Dataset, DatasetSummary, DatasetColumn, DatasetStatistics, 
  ConversationItem, ChatMessageItem, AISettingsData,
  Insight, ForecastModel, AnomalyResult, Report, NotificationItem, 
  AuditLogItem, AdminStats,
  KPIDashboardData, ChartsDashboardData, BusinessHealthData, DashboardSummaryData,
  ForecastPoint, AnomalyItem, RiskAnalysisData, AIRecommendationItem, ForecastDashboardData,
  ExecutiveSummaryData, BusinessInsightItem, RiskIntelligenceItem, InsightRecommendation, InsightsDashboardData,
  WhatIfScenario, HealthScore, BusinessRecommendation, GoalPlannerRequest, GoalPlannerResponse, RootCauseAnalysis, BusinessAlert, ExecutiveAdvisorRequest, ExecutiveAdvisorResponse, DecisionNoDataResponse, WhatIfRequest, WhatIfResponse, DecisionHistoryItem
} from '../types';

const API_BASE = '/api/v1';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Authentication failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },

  async register(data: { email: string; password: string; full_name: string; company_name?: string; role?: string }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }
    return res.json();
  },

  async loginGoogle() {
    const res = await fetch(`${API_BASE}/auth/google`, { method: 'POST' });
    if (!res.ok) throw new Error('Google OAuth failed');
    return res.json();
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Session expired');
    return res.json();
  },

  async forgotPassword(email: string) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  async resetPassword(token: string, new_password: string, email: string) {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password, email })
    });
    return res.json();
  },

  // Datasets
  async uploadDataset(file: File): Promise<Dataset> {
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/datasets/upload`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Dataset upload failed' }));
      throw new Error(err.detail || 'Dataset upload failed');
    }
    return res.json();
  },

  async getDatasets(search?: string, company?: string, user_name?: string, sort_by?: string): Promise<Dataset[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (company) params.append('company', company);
    if (user_name) params.append('user_name', user_name);
    if (sort_by) params.append('sort_by', sort_by);

    const res = await fetch(`${API_BASE}/datasets/?${params.toString()}`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  async getDatasetById(id: number): Promise<Dataset> {
    const res = await fetch(`${API_BASE}/datasets/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Dataset not found');
    return res.json();
  },

  async updateDataset(id: number, name?: string, description?: string): Promise<Dataset> {
    const res = await fetch(`${API_BASE}/datasets/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ name, description })
    });
    if (!res.ok) throw new Error('Failed to update dataset');
    return res.json();
  },

  async deleteDataset(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/datasets/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete dataset');
    return res.json();
  },

  async getDatasetSummary(id: number): Promise<DatasetSummary> {
    const res = await fetch(`${API_BASE}/datasets/${id}/summary`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch dataset summary');
    return res.json();
  },

  async getDatasetPreview(id: number): Promise<any[]> {
    const res = await fetch(`${API_BASE}/datasets/${id}/preview`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  async getDatasetColumns(id: number): Promise<DatasetColumn[]> {
    const res = await fetch(`${API_BASE}/datasets/${id}/columns`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  async getDatasetStatistics(id: number): Promise<DatasetStatistics> {
    const res = await fetch(`${API_BASE}/datasets/${id}/statistics`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch statistics');
    return res.json();
  },

  getDatasetDownloadUrl(id: number, cleaned: boolean = true): string {
    return `${API_BASE}/datasets/${id}/download?cleaned=${cleaned}`;
  },

  // Phase 3 Conversations & RAG Chat
  async createConversation(title?: string, dataset_id?: number, model_provider: string = 'llama3.1'): Promise<ConversationItem> {
    const res = await fetch(`${API_BASE}/chat/conversations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, dataset_id, model_provider })
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return res.json();
  },

  async getConversations(search?: string, is_pinned?: boolean): Promise<ConversationItem[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (is_pinned !== undefined) params.append('is_pinned', String(is_pinned));

    const res = await fetch(`${API_BASE}/chat/conversations?${params.toString()}`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  async getConversationHistory(id: number): Promise<ConversationItem> {
    const res = await fetch(`${API_BASE}/chat/conversations/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Conversation not found');
    return res.json();
  },

  async updateConversation(id: number, title?: string, is_pinned?: boolean, model_provider?: string): Promise<ConversationItem> {
    const res = await fetch(`${API_BASE}/chat/conversations/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ title, is_pinned, model_provider })
    });
    if (!res.ok) throw new Error('Failed to update conversation');
    return res.json();
  },

  async deleteConversation(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/chat/conversations/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete conversation');
    return res.json();
  },

  async sendChatMessage(conversation_id: number, message: string, dataset_id?: number): Promise<ChatMessageItem> {
    const res = await fetch(`${API_BASE}/chat/conversations/${conversation_id}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message, dataset_id })
    });
    if (!res.ok) throw new Error('Failed to send RAG message');
    return res.json();
  },

  async getAISettings(): Promise<AISettingsData> {
    const res = await fetch(`${API_BASE}/chat/settings`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch AI settings');
    return res.json();
  },

  async updateAISettings(settings: Partial<AISettingsData>): Promise<AISettingsData> {
    const res = await fetch(`${API_BASE}/chat/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update AI settings');
    return res.json();
  },

  // RAG Analytics & Insights
  async sendRAGChat(message: string, dataset_id?: number) {
    const res = await fetch(`${API_BASE}/analytics/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message, dataset_id })
    });
    if (!res.ok) throw new Error('RAG Query Failed');
    return res.json();
  },

  async getInsights(dataset_id: number): Promise<Insight[]> {
    const res = await fetch(`${API_BASE}/analytics/insights/${dataset_id}`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  async getAnomalies(dataset_id: number): Promise<AnomalyResult[]> {
    const res = await fetch(`${API_BASE}/analytics/anomalies/${dataset_id}`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  // Phase 4 Analytics Dashboard Calls
  async getDashboardSummary(
    datasetId: number, 
    filters?: { start_date?: string; end_date?: string; product?: string; region?: string; category?: string; customer?: string }
  ): Promise<DashboardSummaryData> {
    const params = new URLSearchParams({ dataset_id: String(datasetId) });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });
    }
    const res = await fetch(`${API_BASE}/analytics/dashboard?${params.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch dashboard summary');
    return res.json();
  },

  async getDashboardKPIs(
    datasetId: number,
    filters?: { start_date?: string; end_date?: string; product?: string; region?: string; category?: string; customer?: string }
  ): Promise<KPIDashboardData> {
    const params = new URLSearchParams({ dataset_id: String(datasetId) });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });
    }
    const res = await fetch(`${API_BASE}/analytics/kpis?${params.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch dashboard KPIs');
    return res.json();
  },

  async getDashboardCharts(
    datasetId: number,
    filters?: { start_date?: string; end_date?: string; product?: string; region?: string; category?: string; customer?: string }
  ): Promise<ChartsDashboardData> {
    const params = new URLSearchParams({ dataset_id: String(datasetId) });
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });
    }
    const res = await fetch(`${API_BASE}/analytics/charts?${params.toString()}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch dashboard charts');
    return res.json();
  },

  async getBusinessHealth(datasetId: number): Promise<BusinessHealthData> {
    const res = await fetch(`${API_BASE}/analytics/health?dataset_id=${datasetId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch business health score');
    return res.json();
  },


  // ML Forecasting
  async getRevenueForecast(datasetId: number, horizonDays: number = 30): Promise<ForecastPoint[]> {
    const res = await fetch(`${API_BASE}/forecast/revenue?dataset_id=${datasetId}&horizon_days=${horizonDays}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch revenue forecast');
    return res.json();
  },

  async getProfitForecast(datasetId: number, horizonDays: number = 30): Promise<ForecastPoint[]> {
    const res = await fetch(`${API_BASE}/forecast/profit?dataset_id=${datasetId}&horizon_days=${horizonDays}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch profit forecast');
    return res.json();
  },

  async getOrdersForecast(datasetId: number, horizonDays: number = 30): Promise<ForecastPoint[]> {
    const res = await fetch(`${API_BASE}/forecast/orders?dataset_id=${datasetId}&horizon_days=${horizonDays}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch orders forecast');
    return res.json();
  },

  async getForecastDashboard(datasetId: number, horizonDays: number = 30): Promise<ForecastDashboardData> {
    const res = await fetch(`${API_BASE}/forecast/dashboard?dataset_id=${datasetId}&horizon_days=${horizonDays}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch forecast dashboard summary');
    return res.json();
  },

  // Phase 6 Executive Insights Calls
  async getExecutiveSummary(datasetId: number): Promise<ExecutiveSummaryData> {
    const res = await fetch(`${API_BASE}/insights/executive-summary?dataset_id=${datasetId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch executive summary');
    return res.json();
  },

  async getBusinessInsightsList(datasetId: number): Promise<BusinessInsightItem[]> {
    const res = await fetch(`${API_BASE}/insights/business?dataset_id=${datasetId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch business insights');
    return res.json();
  },

  async getRiskIntelligenceList(datasetId: number): Promise<RiskIntelligenceItem[]> {
    const res = await fetch(`${API_BASE}/insights/risks?dataset_id=${datasetId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch risk intelligence');
    return res.json();
  },

  async getInsightRecommendationsList(datasetId: number): Promise<InsightRecommendation[]> {
    const res = await fetch(`${API_BASE}/insights/recommendations?dataset_id=${datasetId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  },

  async getInsightsDashboard(datasetId: number): Promise<InsightsDashboardData> {
    const res = await fetch(`${API_BASE}/insights/dashboard?dataset_id=${datasetId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch insights dashboard');
    return res.json();
  },


  async runForecast(dataset_id: number, algorithm: string = 'xgboost', target_column: string = 'revenue'): Promise<ForecastModel> {
    const res = await fetch(`${API_BASE}/forecast/run`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ dataset_id, algorithm, target_column, date_column: 'date', periods: 12 })
    });
    if (!res.ok) throw new Error('Forecast execution failed');
    return res.json();
  },

  // Reports
  async generateReport(title: string, format: 'pdf' | 'excel' | 'docx', dataset_id?: number): Promise<Report> {
    const res = await fetch(`${API_BASE}/reports/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, format, dataset_id })
    });
    if (!res.ok) throw new Error('Report generation failed');
    return res.json();
  },

  async getReports(): Promise<Report[]> {
    const res = await fetch(`${API_BASE}/reports/`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  // Admin & Notifications
  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch(`${API_BASE}/admin/metrics`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Admin unauthorized');
    return res.json();
  },

  async getAllUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/admin/users`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  async updateRole(user_id: number, role: string) {
    const res = await fetch(`${API_BASE}/admin/users/${user_id}/role?role=${role}`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return res.json();
  },

  async getAuditLogs(): Promise<AuditLogItem[]> {
    const res = await fetch(`${API_BASE}/admin/audit-logs`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  async getNotifications(): Promise<NotificationItem[]> {
    const res = await fetch(`${API_BASE}/notifications/`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  // Phase 7 Decision Intelligence
  async getDecisionHealthScore(datasetId?: number): Promise<HealthScore | DecisionNoDataResponse> {
    const url = datasetId ? `${API_BASE}/decision/health-score?dataset_id=${datasetId}` : `${API_BASE}/decision/health-score`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch business health score' }));
      throw new Error(err.detail || 'Failed to fetch business health score');
    }
    return res.json();
  },

  async runWhatIfAnalysis(scenario: WhatIfRequest): Promise<WhatIfResponse | DecisionNoDataResponse> {
    const res = await fetch(`${API_BASE}/decision/what-if`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(scenario)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'What-If analysis execution failed' }));
      throw new Error(err.detail || 'What-If analysis execution failed');
    }
    return res.json();
  },

  async getRootCauseAnalysis(datasetId?: number, metric?: string): Promise<RootCauseAnalysis | DecisionNoDataResponse> {
    const params = new URLSearchParams();
    if (datasetId) params.append('dataset_id', String(datasetId));
    if (metric) params.append('metric', metric);
    const res = await fetch(`${API_BASE}/decision/root-cause?${params.toString()}`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch root cause analysis' }));
      throw new Error(err.detail || 'Failed to fetch root cause analysis');
    }
    return res.json();
  },

  async planGoal(request: GoalPlannerRequest): Promise<GoalPlannerResponse | DecisionNoDataResponse> {
    const res = await fetch(`${API_BASE}/decision/goal-plan`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Goal planner execution failed' }));
      throw new Error(err.detail || 'Goal planner execution failed');
    }
    return res.json();
  },

  async getDecisionRecommendations(datasetId?: number): Promise<BusinessRecommendation[] | DecisionNoDataResponse> {
    const url = datasetId ? `${API_BASE}/decision/recommendations?dataset_id=${datasetId}` : `${API_BASE}/decision/recommendations`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch decision recommendations' }));
      throw new Error(err.detail || 'Failed to fetch decision recommendations');
    }
    return res.json();
  },

  async getDecisionAlerts(datasetId?: number): Promise<BusinessAlert[] | DecisionNoDataResponse> {
    const url = datasetId ? `${API_BASE}/decision/alerts?dataset_id=${datasetId}` : `${API_BASE}/decision/alerts`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch decision alerts' }));
      throw new Error(err.detail || 'Failed to fetch decision alerts');
    }
    return res.json();
  },

  async runExecutiveAdvisor(request: ExecutiveAdvisorRequest): Promise<ExecutiveAdvisorResponse | DecisionNoDataResponse> {
    const res = await fetch(`${API_BASE}/decision/advisor`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Executive AI Advisor query failed' }));
      throw new Error(err.detail || 'Executive AI Advisor query failed');
    }
    return res.json();
  },

  async getDecisionHistory(): Promise<DecisionHistoryItem[] | DecisionNoDataResponse> {
    const res = await fetch(`${API_BASE}/decision/history`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch decision history' }));
      throw new Error(err.detail || 'Failed to fetch decision history');
    }
    return res.json();
  }
};

