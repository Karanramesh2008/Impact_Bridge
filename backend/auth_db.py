import sqlite3
from pathlib import Path
from datetime import datetime, timezone


DB_PATH = Path(__file__).resolve().parent / "impactbridge.db"


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    connection = get_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('corporate', 'ngo')),
            created_at TEXT NOT NULL
        )
    """)

    connection.commit()
    connection.close()


def create_user(
    name: str,
    email: str,
    password_hash: str,
    role: str
):
    connection = get_connection()

    try:
        cursor = connection.execute(
            """
            INSERT INTO users
            (name, email, password_hash, role, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                name,
                email,
                password_hash,
                role,
                datetime.now(timezone.utc).isoformat()
            )
        )

        connection.commit()

        user_id = cursor.lastrowid

        return get_user_by_id(user_id)

    except sqlite3.IntegrityError:
        return None

    finally:
        connection.close()


def get_user_by_email(email: str):
    connection = get_connection()

    user = connection.execute(
        """
        SELECT *
        FROM users
        WHERE email = ?
        """,
        (email,)
    ).fetchone()

    connection.close()

    return dict(user) if user else None


def get_user_by_id(user_id: int):
    connection = get_connection()

    user = connection.execute(
        """
        SELECT *
        FROM users
        WHERE id = ?
        """,
        (user_id,)
    ).fetchone()

    connection.close()

    return dict(user) if user else None