from celery import Celery
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

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

# Schedule weekly digest task every 7 days (604800 seconds)
celery_app.conf.beat_schedule = {
    "send-weekly-digest-every-7-days": {
        "task": "send_weekly_digest_task",
        "schedule": 604800.0,
    }
}

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

@celery_app.task(name="send_weekly_digest_task")
def send_weekly_digest_task():
    """
    Weekly Celery Beat task that iterates over all users with email_digest_enabled=True,
    generates their latest digest, and emails/previews it.
    """
    from app.db.session import SessionLocal
    from app.db.models import User
    from app.services.email_digest_service import EmailDigestService
    
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.email_digest_enabled == True).all()
        logger.info(f"Triggering scheduled weekly digest email run for {len(users)} users.")
        success_count = 0
        for u in users:
            try:
                success = EmailDigestService.generate_and_send_digest(db, u.id)
                if success:
                    success_count += 1
            except Exception as e:
                logger.error(f"Error executing scheduled digest for user #{u.id}: {e}")
        return {"status": "success", "processed_users": len(users), "successful_sends": success_count}
    finally:
        db.close()
