
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker

load_dotenv()

connection_string = (
    f"DRIVER={{{os.getenv('DB_DRIVER')}}};"
    f"SERVER={os.getenv('DB_SERVER')};"
    f"DATABASE={os.getenv('DB_NAME')};"
    "Trusted_Connection=yes;"
    "TrustServerCertificate=yes;"
)

connection_url = URL.create(
    "mssql+pyodbc",
    query={
        "odbc_connect": connection_string
    }
)

engine = create_engine(
    connection_url,
    pool_pre_ping=True,
    echo=True
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


if __name__ == "__main__":

    try:
        with engine.connect() as conn:

            result = conn.execute(
                text("""
                    SELECT
                        @@SERVERNAME AS server_name,
                        DB_NAME() AS database_name
                """)
            )

            row = result.fetchone()

            print("Connection successful!")
            print("Server:", row.server_name)
            print("Database:", row.database_name)

    except Exception as e:
        print("Connection failed:", e)
