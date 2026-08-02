import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, Float, Enum
from sqlalchemy.orm import relationship
from app.db.session import Base

class UserRole(str, enum.Enum):
    ADMIN = "Admin"
    MANAGER = "Manager"
    ANALYST = "Analyst"
    EMPLOYEE = "Employee"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    company_name = Column(String, default="Acme Corp")
    role = Column(String, default=UserRole.ANALYST.value)
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    datasets = relationship("Dataset", back_populates="owner")
    reports = relationship("Report", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    ai_settings = relationship("AISettings", back_populates="user", uselist=False, cascade="all, delete-orphan")

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    plan = Column(String, default="Enterprise")
    max_users = Column(Integer, default=50)
    max_storage_mb = Column(Integer, default=10240)
    api_quota = Column(Integer, default=100000)
    created_at = Column(DateTime, default=datetime.utcnow)

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    company_name = Column(String, default="Acme Corp")
    owner_name = Column(String, nullable=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    file_type = Column(String, default="csv")
    file_path = Column(String, nullable=True)
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    quality_score = Column(Float, default=100.0)
    memory_usage_bytes = Column(Integer, default=0)
    schema_json = Column(JSON, nullable=True)
    metrics_json = Column(JSON, nullable=True)
    status = Column(String, default="processed") # processing, validated, cleaned, processed, error
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="datasets")
    files = relationship("DatasetFile", back_populates="dataset", cascade="all, delete-orphan", uselist=False)
    columns = relationship("DatasetColumn", back_populates="dataset", cascade="all, delete-orphan")
    statistics = relationship("DatasetStatistics", back_populates="dataset", cascade="all, delete-orphan", uselist=False)
    quality_reports = relationship("DataQualityReport", back_populates="dataset", cascade="all, delete-orphan", uselist=False)
    records = relationship("DataRecord", back_populates="dataset", cascade="all, delete-orphan")
    insights = relationship("Insight", back_populates="dataset", cascade="all, delete-orphan")
    forecasts = relationship("ForecastModel", back_populates="dataset", cascade="all, delete-orphan")
    anomalies = relationship("AnomalyResult", back_populates="dataset", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="dataset", cascade="all, delete-orphan")

class DatasetFile(Base):
    __tablename__ = "dataset_files"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), unique=True)
    original_filename = Column(String, nullable=False)
    original_file_path = Column(String, nullable=False)
    cleaned_file_path = Column(String, nullable=True)
    mime_type = Column(String, nullable=False)
    file_size_bytes = Column(Integer, default=0)
    encoding = Column(String, default="utf-8")
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="files")

class DatasetColumn(Base):
    __tablename__ = "dataset_columns"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"))
    column_name = Column(String, nullable=False)
    data_type = Column(String, nullable=False) # string, integer, float, datetime, boolean
    missing_count = Column(Integer, default=0)
    unique_count = Column(Integer, default=0)
    is_numeric = Column(Boolean, default=False)
    is_date = Column(Boolean, default=False)
    sample_values = Column(JSON, nullable=True)

    dataset = relationship("Dataset", back_populates="columns")

class DatasetStatistics(Base):
    __tablename__ = "dataset_statistics"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), unique=True)
    total_rows = Column(Integer, default=0)
    total_columns = Column(Integer, default=0)
    missing_values_count = Column(Integer, default=0)
    duplicate_rows_count = Column(Integer, default=0)
    numeric_cols_count = Column(Integer, default=0)
    categorical_cols_count = Column(Integer, default=0)
    date_cols_count = Column(Integer, default=0)
    completeness_pct = Column(Float, default=100.0)
    consistency_pct = Column(Float, default=100.0)
    quality_score = Column(Float, default=100.0)
    memory_usage_bytes = Column(Integer, default=0)
    numeric_summary_json = Column(JSON, nullable=True)
    categorical_summary_json = Column(JSON, nullable=True)

    dataset = relationship("Dataset", back_populates="statistics")

class DataQualityReport(Base):
    __tablename__ = "data_quality_reports"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"), unique=True)
    quality_score = Column(Float, default=100.0)
    error_count = Column(Integer, default=0)
    warning_count = Column(Integer, default=0)
    issues_json = Column(JSON, nullable=False) # list of {type, column, row, message, severity}
    validated_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="quality_reports")

class DataRecord(Base):
    __tablename__ = "data_records"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"))
    row_index = Column(Integer, nullable=False)
    payload = Column(JSON, nullable=False)

    dataset = relationship("Dataset", back_populates="records")

# Phase 3 Chat Models
class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False, default="New Business Intelligence Query")
    is_pinned = Column(Boolean, default=False)
    model_provider = Column(String, default="llama3.1") # llama3.1, gemini-pro, gpt-4o
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="conversations")
    dataset = relationship("Dataset", back_populates="conversations")
    messages = relationship("ChatMessageModel", back_populates="conversation", cascade="all, delete-orphan")

class ChatMessageModel(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"))
    sender = Column(String, nullable=False) # user, assistant
    message_text = Column(Text, nullable=False)
    sources_json = Column(JSON, nullable=True) # list of strings
    chart_spec_json = Column(JSON, nullable=True) # Recharts config
    data_summary_json = Column(JSON, nullable=True) # Dict of metric cards
    sql_query = Column(Text, nullable=True)
    confidence_score = Column(Float, default=95.0)
    follow_ups_json = Column(JSON, nullable=True) # list of strings
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")

class AISettings(Base):
    __tablename__ = "ai_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    preferred_llm = Column(String, default="llama3.1") # llama3.1, gemini-pro, gpt-4o
    temperature = Column(Float, default=0.2)
    max_tokens = Column(Integer, default=2048)
    prompt_style = Column(String, default="Executive Analytical")
    language = Column(String, default="en")

    user = relationship("User", back_populates="ai_settings")

class Insight(Base):
    __tablename__ = "insights"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"))
    type = Column(String, nullable=False) # executive_summary, revenue_driver, cost_reduction, anomaly, churn_alert, inventory_warning
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    importance = Column(String, default="High") # High, Medium, Low
    metrics_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="insights")

class ForecastModel(Base):
    __tablename__ = "forecast_models"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"))
    algorithm = Column(String, nullable=False) # prophet, xgboost, random_forest, linear_regression
    target_column = Column(String, nullable=False)
    date_column = Column(String, nullable=False)
    metrics_json = Column(JSON, nullable=True) # R2, RMSE, MAE
    forecast_data_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="forecasts")

class AnomalyResult(Base):
    __tablename__ = "anomaly_results"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id", ondelete="CASCADE"))
    row_index = Column(Integer, nullable=False)
    anomaly_score = Column(Float, nullable=False)
    anomaly_type = Column(String, nullable=False) # fraud, duplicate, spike, unusual_pattern
    reasoning = Column(Text, nullable=False)
    payload_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    dataset = relationship("Dataset", back_populates="anomalies")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    format = Column(String, nullable=False) # pdf, excel, docx
    file_path = Column(String, nullable=True)
    parameters_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="reports")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    resource = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="info") # alert, info, recommendation, report
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")

class AIUsageLog(Base):
    __tablename__ = "ai_usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    query_type = Column(String, nullable=False) # RAG_CHAT, INSIGHT_GEN, ML_FORECAST, ANOMALY_DETECTION
    tokens_used = Column(Integer, default=0)
    execution_time_ms = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow)

class DecisionScenario(Base):
    __tablename__ = "decision_scenarios"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    variables_json = Column(JSON, nullable=False)
    projected_metrics_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class BusinessGoal(Base):
    __tablename__ = "business_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    metric_name = Column(String, nullable=False)
    target_value = Column(Float, nullable=False)
    current_value = Column(Float, nullable=False)
    target_date = Column(String, nullable=False)
    status = Column(String, default="active") # active, achieved, failed
    created_at = Column(DateTime, default=datetime.utcnow)

class BusinessAlert(Base):
    __tablename__ = "business_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String, nullable=False) # Info, Warning, Critical
    metric = Column(String, nullable=True)
    current_value = Column(Float, nullable=True)
    threshold_value = Column(Float, nullable=True)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class DecisionHistory(Base):
    __tablename__ = "decision_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action_type = Column(String, nullable=False) # advisor_query, scenario_simulation, etc.
    query_text = Column(Text, nullable=True)
    response_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

