class EmptyResponseError(Exception):
    """Represents an API response with no body."""

    def __init__(self, status_code: int) -> None:
        self.status_code = status_code
        super().__init__(str(status_code))
