import os
import psycopg2

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://eapcet_db_user:KoxiSFpBhCMFByqVYavpYZq6XpNdv9Pg@dpg-d7578o9aae7s73bsmqo0-a/eapcet_db"
)

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

def init():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    cur.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'papers'
        )
    """)
    exists = cur.fetchone()[0]

    if not exists:
        print("Tables not found — running schema.sql ...")
        schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
        with open(schema_path, "r") as f:
            sql = f.read()
        cur.execute(sql)
        conn.commit()
        print("Schema created successfully.")
    else:
        print("Tables already exist — skipping schema init.")

    cur.close()
    conn.close()

if __name__ == "__main__":
    init()
