import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base
from app.api.v1 import auth, datasets, analytics, forecast, reports, admin, notifications, chat, insights, decision, consultant

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Enterprise AI Business Intelligence Assistant REST API with RAG, ML Forecasting, Anomaly Detection, Multi-Format Exports, and RBAC Governance."
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(datasets.router, prefix=f"{settings.API_V1_STR}/datasets", tags=["Datasets & Ingestion"])
app.include_router(chat.router, prefix=f"{settings.API_V1_STR}/chat", tags=["RAG Conversational Chat"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["RAG Chat & AI Insights"])
app.include_router(forecast.router, prefix=f"{settings.API_V1_STR}/forecast", tags=["ML Forecasting"])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["Multi-Format Reports"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["Admin & Governance"])
app.include_router(notifications.router, prefix=f"{settings.API_V1_STR}/notifications", tags=["Notification Center"])
app.include_router(insights.router, prefix=f"{settings.API_V1_STR}/insights", tags=["Executive Insights"])
app.include_router(decision.router, prefix=f"{settings.API_V1_STR}/decision", tags=["AI Decision Intelligence"])
app.include_router(consultant.router, prefix=f"{settings.API_V1_STR}/consultant", tags=["AI Business Consultant"])


@app.get("/")
def root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
