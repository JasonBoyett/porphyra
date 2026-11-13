import os
from pathlib import Path

test_database_path = Path(__file__).with_name("test-porphyra.sqlite3")
test_database_path.unlink(missing_ok=True)
os.environ["PORPHYRA_DATABASE_URL"] = f"sqlite:///{test_database_path}"
