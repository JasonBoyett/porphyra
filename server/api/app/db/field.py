from typing import TypeVar, cast

from sqlmodel import Field

FieldValue = TypeVar("FieldValue")


def typed_field(
    *args: object,
    **kwargs: object,
) -> FieldValue:  # pyright: ignore[reportInvalidTypeVarUse]
    """Return a statically typed SQLModel field declaration."""
    return cast(
        FieldValue,
        Field(*args, **kwargs),
    )
