from enum import StrEnum


class SyncTag(StrEnum):
    """Non-sensitive concerns that may make an authorized GET response stale."""

    DASHBOARD = "dashboard"
    CAMPUS_EVENTS = "campus-events"
    CAMPUS_EVENT_PLANNING = "campus-event-planning"
