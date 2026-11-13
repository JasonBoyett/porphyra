from __future__ import annotations

from typing import Self

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,
        extra="ignore",
    )

    @classmethod
    def from_db_model(cls, db_model: object) -> Self:
        return cls.model_validate(db_model, from_attributes=True)
