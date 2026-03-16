from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv
import logging

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")
GOOGLE_CLOUD_SQL_CONNECTION_NAME = os.getenv("GOOGLE_CLOUD_SQL_CONNECTION_NAME")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME", "business_intelligence")

# Google Cloud SQL configuration
if GOOGLE_CLOUD_SQL_CONNECTION_NAME and DB_PASSWORD:
    DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@/{DB_NAME}?host=/cloudsql/{GOOGLE_CLOUD_SQL_CONNECTION_NAME}"
    logger.info(f"Using Google Cloud SQL: {GOOGLE_CLOUD_SQL_CONNECTION_NAME}")
elif DATABASE_URL:
    # Existing Neon or other PostgreSQL setup
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    # Log database type for deployment verification
    if "neon.tech" in DATABASE_URL:
        logger.info("Using Neon Database (PostgreSQL)")
    elif "postgresql" in DATABASE_URL:
        logger.info("Using PostgreSQL database")
    else:
        logger.info("Using configured DATABASE_URL")
else:
    # Fallback for local development
    DATABASE_URL = "sqlite:///./sql_app.db"
    logger.warning("Using local SQLite database - not recommended for production")

# Connection arguments based on database type
connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}
elif "postgresql" in DATABASE_URL or "neon.tech" in DATABASE_URL:
    # For Neon/PostgreSQL: sslmode is already in the URL query string,
    # so we only set connect_timeout here to avoid conflicts
    connect_args = {
        "connect_timeout": 10,
        "application_name": "TrendAI_Backend"
    }

# Create engine with production-ready settings
engine_kwargs = {
    "connect_args": connect_args,
    "pool_pre_ping": True,  # Verify connections before use
    "pool_recycle": 300,    # Recycle connections every 5 minutes
    "pool_size": 10,        # Connection pool size
    "max_overflow": 20,     # Maximum overflow connections
    "echo": False           # Set to True for SQL debugging
}

# For SQLite, use different settings
if "sqlite" in DATABASE_URL:
    engine_kwargs = {
        "connect_args": connect_args,
        "echo": False
    }

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Database dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Health check function for database connectivity
def check_db_connection():
    """Check if database connection is working"""
    try:
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        logger.info("Database connection check: SUCCESS")
        return True
    except Exception as e:
        logger.error(f"Database connection check: FAILED - {e}")
        return False

# Initialize database tables (for deployment)
def init_database():
    """Initialize database tables - call this during deployment"""
    try:
        logger.info("Initializing database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize database tables: {e}")
        return False
