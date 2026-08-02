from typing import List
from sqlalchemy.orm import Session
from app.db.models import Notification, User

class NotificationService:
    @staticmethod
    def get_user_notifications(db: Session, user_id: int) -> List[Notification]:
        notifications = db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).all()
        if not notifications:
            # Seed default notification items
            defaults = [
                Notification(
                    user_id=user_id,
                    title="Revenue Target Exceeded",
                    message="Q3 ARR reached $14.25M exceeding the forecasted target by +8.4%.",
                    type="alert"
                ),
                Notification(
                    user_id=user_id,
                    title="Automated AI Insights Generated",
                    message="7 new executive insights created for dataset 'Enterprise_Sales_2026.csv'.",
                    type="recommendation"
                ),
                Notification(
                    user_id=user_id,
                    title="Scheduled Weekly Report Ready",
                    message="Your weekly PDF and Excel executive digest has been compiled and is ready for download.",
                    type="report"
                )
            ]
            db.add_all(defaults)
            db.commit()
            notifications = db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).all()
        return notifications

    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        n_type: str = "info"
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=n_type
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif
