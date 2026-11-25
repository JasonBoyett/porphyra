from app.sync.tags import SyncTag


def sync_tags(*tags: SyncTag) -> dict[str, list[SyncTag]]:
    """Create the typed OpenAPI extension consumed by the web API generator."""
    return {"x-sync-tags": list(tags)}
