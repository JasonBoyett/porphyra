from collections.abc import Mapping
from typing import TypeVar, cast

from sqlmodel import Relationship

RelationshipValue = TypeVar("RelationshipValue")


def typed_relationship(
    *,
    back_populates: str,
    sa_relationship_kwargs: Mapping[str, object] | None = None,
) -> RelationshipValue:  # pyright: ignore[reportInvalidTypeVarUse]
    """Return a statically typed SQLModel relationship declaration."""
    return cast(
        RelationshipValue,
        Relationship(  # pyright: ignore[reportAny]
            back_populates=back_populates,
            sa_relationship_kwargs=sa_relationship_kwargs,
        ),
    )
