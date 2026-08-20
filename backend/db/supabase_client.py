"""
Supabase Client — Database Access Layer

Provides initialized Supabase client for:
- Storing predictions and results
- User authentication verification
- Row-level security enforcement
"""

import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


@lru_cache()
def get_supabase_client():
    """
    Return a cached Supabase client instance.

    Environment variables required:
        - SUPABASE_URL
        - SUPABASE_SERVICE_ROLE_KEY
    """
    from supabase import create_client, Client

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required"
        )

    client: Client = create_client(url, key)
    return client


async def save_prediction(prediction_data: dict) -> dict:
    """Save a prediction record to Supabase."""
    client = get_supabase_client()
    result = client.table("predictions").insert(prediction_data).execute()
    return result.data[0] if result.data else {}


async def update_prediction(prediction_id: str, update_data: dict) -> dict:
    """Update an existing prediction record."""
    client = get_supabase_client()
    result = (
        client.table("predictions")
        .update(update_data)
        .eq("id", prediction_id)
        .execute()
    )
    return result.data[0] if result.data else {}


async def get_prediction(prediction_id: str) -> dict | None:
    """Get a prediction by ID."""
    client = get_supabase_client()
    result = (
        client.table("predictions")
        .select("*")
        .eq("id", prediction_id)
        .single()
        .execute()
    )
    return result.data


async def get_user_predictions(user_id: str) -> list[dict]:
    """Get all predictions for a user, most recent first."""
    client = get_supabase_client()
    result = (
        client.table("predictions")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []
