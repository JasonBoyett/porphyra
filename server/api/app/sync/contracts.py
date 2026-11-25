"""Schema-driven synchronization declarations.

Declarations deliberately describe metadata only.  They do not change Pydantic
serialization: a resource remains its ordinary response model on the wire.
"""

from __future__ import annotations

from collections.abc import Callable, Iterable
from dataclasses import dataclass, field
from typing import Any, Generic, TypeVar

from fastapi import FastAPI

from app.sync.model import CanSync

T = TypeVar("T", bound=CanSync[Any])


@dataclass(frozen=True)
class SyncTarget:
    """A stable, typed invalidation target sent to authorized clients."""

    tag: str
    identity: dict[str, Any]

    def __post_init__(self) -> None:
        if not self.tag:
            raise ValueError("A synchronization target tag is required.")
        if not self.identity:
            raise ValueError("A synchronization target identity is required.")

    def wire_value(self) -> dict[str, Any]:
        return {"tag": self.tag, "identity": self.identity}


@dataclass
class SyncAction:
    """A named action whose implementation is bound to a FastAPI endpoint."""

    name: str
    parameter_bindings: dict[str, str] = field(default_factory=dict)
    _endpoint: Callable[..., Any] | None = field(default=None, init=False, repr=False)

    def bind(self, endpoint: Callable[..., Any]) -> Callable[..., Any]:
        if self._endpoint is not None and self._endpoint is not endpoint:
            raise RuntimeError(
                f"Synchronization action '{self.name}' is already bound."
            )
        self._endpoint = endpoint
        return endpoint

    @property
    def endpoint(self) -> Callable[..., Any] | None:
        return self._endpoint


@dataclass
class SyncOperation:
    """A canonical resource refresh or conventional mutation endpoint."""

    _endpoint: Callable[..., Any] | None = field(default=None, init=False, repr=False)

    def bind(self, endpoint: Callable[..., Any]) -> Callable[..., Any]:
        if self._endpoint is not None and self._endpoint is not endpoint:
            raise RuntimeError("Synchronization operation is already bound.")
        self._endpoint = endpoint
        return endpoint

    @property
    def endpoint(self) -> Callable[..., Any] | None:
        return self._endpoint


@dataclass
class Syncable(Generic[T]):
    """Metadata for a Pydantic resource without wrapping its JSON shape."""

    model: type[T]
    tag: str
    identity: tuple[str, ...] | str
    refresh: SyncOperation | None = None
    mutate: SyncOperation | None = None
    actions: tuple[SyncAction, ...] = ()

    def __post_init__(self) -> None:
        if not self.tag:
            raise ValueError("A synchronization resource tag is required.")
        if isinstance(self.identity, str):
            self.identity = (self.identity,)
        if not self.identity:
            raise ValueError("A synchronization resource identity is required.")
        if len({action.name for action in self.actions}) != len(self.actions):
            raise ValueError(
                f"Synchronization resource '{self.tag}' has duplicate actions."
            )
        if self.model.sync_tag != self.tag:
            raise ValueError(
                f"Synchronization resource '{self.tag}' must match its model sync tag "
                f"'{self.model.sync_tag}'."
            )
        identity_aliases = tuple(
            field.alias or field_name
            for field_name, field in (
                self.model.sync_identity_type().model_fields.items()
            )
        )
        if identity_aliases != self.identity:
            raise ValueError(
                f"Synchronization resource '{self.tag}' identity must match its "
                "model identity schema."
            )

    def target_for(self, value: T) -> SyncTarget:
        return value.sync_target()


@dataclass
class SyncCollection(Generic[T]):
    """A JSON-array collection with an independent parent-scoped identity."""

    member: Syncable[T]
    tag: str
    identity: tuple[str, ...] | str
    refresh: SyncOperation
    actions: tuple[SyncAction, ...] = ()

    def __post_init__(self) -> None:
        if isinstance(self.identity, str):
            self.identity = (self.identity,)
        if not self.tag or not self.identity:
            raise ValueError("A collection tag and identity are required.")


def _route_for_endpoint(app: FastAPI, endpoint: Callable[..., Any]) -> Any:
    candidates: list[Any] = list(app.routes)
    routes: list[Any] = []
    while candidates:
        candidate = candidates.pop()
        if getattr(candidate, "endpoint", None) is endpoint:
            routes.append(candidate)
            continue
        effective_candidates = getattr(candidate, "effective_candidates", None)
        if callable(effective_candidates):
            nested_candidates = effective_candidates()
            if isinstance(nested_candidates, Iterable):
                candidates.extend(nested_candidates)
    if len(routes) != 1:
        raise RuntimeError(
            f"Synchronization endpoint {endpoint.__name__!r} must be registered "
            "exactly once; "
            f"found {len(routes)} routes."
        )
    return routes[0]


def _operation_metadata(operation: SyncOperation | None, app: FastAPI) -> str | None:
    if operation is None or operation.endpoint is None:
        return None
    route = _route_for_endpoint(app, operation.endpoint)
    if route.operation_id is None:
        raise RuntimeError(
            "A synchronization endpoint requires an explicit operation_id."
        )
    return route.operation_id


def _add_sync_tag(route: Any, tag: str) -> None:
    extra = dict(route.openapi_extra or {})
    tags = list(extra.get("x-sync-tags", []))
    if tag not in tags:
        tags.append(tag)
    extra["x-sync-tags"] = tags
    route.openapi_extra = extra


def sync_openapi_resources(
    app: FastAPI, resources: Iterable[Syncable[Any] | SyncCollection[Any]]
) -> None:
    """Validate bindings and install portable OpenAPI synchronization metadata."""

    resource_metadata: list[dict[str, Any]] = []
    for declaration in resources:
        if isinstance(declaration, SyncCollection):
            refresh = _operation_metadata(declaration.refresh, app)
            if (
                declaration.refresh is not None
                and declaration.refresh.endpoint is not None
            ):
                _add_sync_tag(
                    _route_for_endpoint(app, declaration.refresh.endpoint),
                    declaration.tag,
                )
            resource_metadata.append(
                {
                    "kind": "collection",
                    "tag": declaration.tag,
                    "identity": list(declaration.identity),
                    "memberTag": declaration.member.tag,
                    "refreshOperationId": refresh,
                }
            )
            continue

        actions: list[dict[str, Any]] = []
        for action in declaration.actions:
            if action.endpoint is None:
                raise RuntimeError(
                    f"Synchronization action '{action.name}' on '{declaration.tag}' "
                    "has no endpoint binding."
                )
            route = _route_for_endpoint(app, action.endpoint)
            _add_sync_tag(route, declaration.tag)
            if route.operation_id is None:
                raise RuntimeError(
                    "A synchronization action requires an explicit operation_id."
                )
            actions.append(
                {
                    "name": action.name,
                    "operationId": route.operation_id,
                    "parameterBindings": action.parameter_bindings,
                }
            )
        resource_metadata.append(
            {
                "kind": "resource",
                "tag": declaration.tag,
                "identity": list(declaration.identity),
                "refreshOperationId": _operation_metadata(declaration.refresh, app),
                "mutateOperationId": _operation_metadata(declaration.mutate, app),
                "actions": actions,
            }
        )

    original_openapi = app.openapi

    def openapi() -> dict[str, Any]:
        schema = original_openapi()
        schema["x-sync-resources"] = resource_metadata
        return schema

    app.openapi = openapi
