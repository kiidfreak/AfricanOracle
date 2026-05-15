"""
API Key authentication and rate limiting.
Tiers: demo (10/day), builder (1000/day), enterprise (unlimited).
"""

from fastapi import Header, HTTPException, Depends
from typing import Optional
from datetime import datetime
import os

# In production, this would be a database table.
# For now, env-based + hardcoded demo keys.
API_KEYS = {
    "demo-africast-2026": {
        "name": "Demo Key",
        "tier": "demo",
        "rate_limit": 50,
    },
    "builder-africast-arc": {
        "name": "Builder Key",
        "tier": "builder",
        "rate_limit": 1000,
    },
}

# Allow custom keys via env
_env_key = os.getenv("AFRICAST_API_KEY")
if _env_key:
    API_KEYS[_env_key] = {
        "name": "Custom Key",
        "tier": "builder",
        "rate_limit": 1000,
    }


class APIKeyInfo:
    def __init__(self, key: str, name: str, tier: str, rate_limit: int):
        self.key = key
        self.name = name
        self.tier = tier
        self.rate_limit = rate_limit


async def verify_api_key(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
) -> APIKeyInfo:
    """
    Validates the API key from the X-API-Key header.
    In demo mode (no key), returns a demo-tier identity.
    """
    # Allow unauthenticated access in demo mode
    if x_api_key is None:
        return APIKeyInfo(
            key="anonymous",
            name="Anonymous (Demo)",
            tier="demo",
            rate_limit=50,
        )

    key_data = API_KEYS.get(x_api_key)
    if not key_data:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key. Get one at https://africast.dev/keys",
        )

    return APIKeyInfo(
        key=x_api_key,
        name=key_data["name"],
        tier=key_data["tier"],
        rate_limit=key_data["rate_limit"],
    )
