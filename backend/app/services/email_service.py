import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_email(to_email: str, subject: str, html_content: str, text_content: str = "") -> bool:
        """
        Sends an email. If EMAIL_DEV_MODE is true (the default), saves it as a local HTML preview.
        """
        email_enabled = os.getenv("EMAIL_ENABLED", "false").lower() == "true"
        email_dev_mode = os.getenv("EMAIL_DEV_MODE", "true").lower() == "true"

        smtp_host = os.getenv("SMTP_HOST", "localhost")
        try:
            smtp_port = int(os.getenv("SMTP_PORT", "1025"))
        except ValueError:
            smtp_port = 1025
        smtp_username = os.getenv("SMTP_USERNAME", "")
        smtp_password = os.getenv("SMTP_PASSWORD", "")
        smtp_from_email = os.getenv("SMTP_FROM_EMAIL", "no-reply@acme.com")
        smtp_from_name = os.getenv("SMTP_FROM_NAME", "AI Business Assistant")
        smtp_use_tls = os.getenv("SMTP_USE_TLS", "false").lower() == "true"

        if email_dev_mode:
            # Safe Local Development Mode - Save preview to a directory
            # Put it in D:/AI-Business-Intelligence-Assistant/backend/email_previews/
            preview_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "email_previews"))
            os.makedirs(preview_dir, exist_ok=True)
            
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"digest_{to_email}_{timestamp}.html"
            filepath = os.path.join(preview_dir, filename)
            
            # Combine content for easy browser viewing
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(f"<!-- TO: {to_email} -->\n")
                f.write(f"<!-- SUBJECT: {subject} -->\n")
                f.write(html_content)
                
            logger.info(f"[EMAIL DEV MODE] Simulated sending email to {to_email}. Preview saved at: {filepath}")
            print(f"[EMAIL DEV MODE] Simulated email sent to {to_email}. Preview: {filepath}")
            return True

        if not email_enabled:
            logger.info("Emails are disabled globally (EMAIL_ENABLED=false). Skipping send.")
            return False

        # Send actual SMTP email
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{smtp_from_name} <{smtp_from_email}>"
            msg["To"] = to_email

            if text_content:
                msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            # Establish SMTP connection
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
            if smtp_use_tls:
                server.starttls()
            if smtp_username and smtp_password:
                server.login(smtp_username, smtp_password)
                
            server.sendmail(smtp_from_email, to_email, msg.as_string())
            server.quit()
            logger.info(f"Successfully sent email to {to_email} via SMTP")
            return True
        except Exception as e:
            # Ensure the password is never logged
            logger.error(f"Failed to send SMTP email to {to_email}: {str(e)}")
            return False
