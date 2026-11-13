import json
from pathlib import Path
from typing import Any


def load_seed_data() -> dict[str, Any]:
    path = Path(__file__).with_name("data.json")
    return json.loads(path.read_text())
