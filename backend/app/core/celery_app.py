from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "bi_assistant_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task(name="generate_scheduled_report_task")
def generate_scheduled_report_task(user_id: int, title: str, format_type: str):
    """
    Celery background task for async report compilation.
    """
    from app.db.session import SessionLocal
    from app.services.report_service import MultiFormatReportService
    
    db = SessionLocal()
    try:
        report = MultiFormatReportService.generate_report(
            db=db,
            user_id=user_id,
            title=title,
            format_type=format_type
        )
        return {"status": "success", "report_id": report.id}
    finally:
        db.close()
