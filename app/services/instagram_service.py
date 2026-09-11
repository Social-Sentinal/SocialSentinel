from app.services.data_adapters import UnifiedSocialDataProvider

_provider = UnifiedSocialDataProvider()


def get_instagram_user_details(username: str) -> dict:
    """
    Fetch rich Instagram user profile details using Multi-Tier Data Provider Architecture.
    """
    return _provider.get_user_profile(username)


def fetch_live_instagram_posts(query: str) -> list[dict]:
    """
    Search & ingest live social posts using Multi-Tier Data Provider Architecture.
    """
    return _provider.get_posts(query=query, limit=15)
