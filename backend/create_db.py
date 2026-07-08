import psycopg2
from psycopg2 import sql
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
import environ

# Re-use your environment logic
# We need to connect to a different database first (e.g. mglp_db) to create a new one
# but since mglp_db was what worked before, let's try connecting to "postgres" or another known db if possible
# Actually, let's try to connect to mglp_db if it still exists.

# For simplicity, let's just use the current .env and try to find a DB to connect to
# We'll try "postgres" first with the same credentials

PG_HOST = "204.168.170.209"
PG_USER = "wouter"
PG_PASSWORD = "kiraoliver"
NEW_DB = "centralen_db"

def create_db():
    conn = None
    try:
        # Try to connect to 'postgres' database first to run create command
        conn = psycopg2.connect(
            dbname='postgres',
            user=PG_USER,
            password=PG_PASSWORD,
            host=PG_HOST,
            port='5432'
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        cur.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(NEW_DB)))
        print(f"Database {NEW_DB} created successfully.")
        
    except Exception as e:
        print(f"Error: {e}")
        # Try to connect to any other database and see? No, usually 'postgres' is the way.
        
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    create_db()
