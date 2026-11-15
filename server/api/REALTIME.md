# Realtime durable-data synchronization

Porphyra uses WebSockets only to signal that an authorized HTTP GET may be
stale. A message has exactly this useful content:

```json
{ "type": "changed", "tags": ["campus-events"] }
```

Tags are broad, non-sensitive concerns. They never contain record identifiers,
church identifiers, volunteer details, or response data. The browser matches a
tag against active TanStack Query metadata and refetches through the normal
authorized HTTP API. HTTP remains the source of truth.

## Current concerns

- `dashboard`: viewer and church/campus/ministry/team directory data.
- `campus-events`: campus event list fields and fields shared with planning.
- `campus-event-planning`: detailed ministry, team, role, and volunteer planning.

The campus event planning GET declares both event concerns. This intentionally
lets an event mutation invalidate the list and detail views without revealing
which event changed.

The current web volunteer schedule is static presentation data and has no
durable API read or write to synchronize. Church-event creation likewise has no
current synchronized GET consumer. Add concern metadata and an authorized
audience when either workflow gains a durable read model; do not emit speculative
signals before then.

## Authentication

The API uses bearer JWTs. Browser WebSocket APIs cannot set an `Authorization`
header, so the sync connection sends the JWT as a dedicated
`porphyra.jwt.<token>` WebSocket subprotocol alongside `porphyra.sync.v1`.
The server validates the JWT exactly as it does for HTTP and accepts only an
already-provisioned user. The token is not placed in the URL, query string, or
application logs. Deployments should also avoid logging `Sec-WebSocket-Protocol`
headers because that header carries the credential.

## Delivery guarantees

Mutations resolve recipients from church membership and queue notifications on
the SQLAlchemy session before commit. One application-level session listener
dispatches after commit, coalesces identical notifications, and discards queued
work on rollback.

The socket registry is process-local and best effort, matching Porphyra's
current deployment. It supports multiple tabs per user and is not an offline or
Portico data sync system. Future scaling work is recorded in `plan.md`.
