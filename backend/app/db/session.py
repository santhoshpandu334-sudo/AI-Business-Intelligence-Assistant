from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

Base = declarative_base()

# Try connecting to primary PostgreSQL URL; fallback gracefully to SQLite for local development
engine = None
try:
    if settings.DATABASE_URL.startswith("postgresql"):
        engine = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20
        )
        # Test connection
        with engine.connect() as conn:
            pass
        logger.info("Successfully connected to primary PostgreSQL database.")
    else:
        engine = create_engine(
            settings.DATABASE_URL,
            connect_args={"check_same_thread": False}
        )
except Exception as e:
    logger.warning(f"Could not connect to PostgreSQL ({e}). Falling back to local SQLite database.")
    engine = create_engine(
        settings.SQLITE_FALLBACK_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
