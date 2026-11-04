"""Create a NEW, dedicated fictional V5 database. Never resets or opens normal data."""

import argparse
from pathlib import Path

from .db import DEFAULT_DB, connect, initialize


def create_presentation(path):
    target = Path(path).expanduser().resolve()
    if (
        target == DEFAULT_DB.resolve()
        or target.name != "classall-v5-presentation.sqlite3"
    ):
        raise ValueError(
            "Use a dedicated file named classall-v5-presentation.sqlite3 outside the normal database."
        )
    target.parent.mkdir(parents=True, exist_ok=True)
    # Exclusive creation refuses existing paths, symlinks and a second reset.
    with target.open("xb"):
        pass
    initialize(str(target))
    with connect(str(target)) as db:
        db.execute("CREATE TABLE presentation_scenario(name TEXT PRIMARY KEY)")
        db.execute(
            "INSERT INTO presentation_scenario VALUES ('v5-fictional-new-database')"
        )
        # Only this newly created database: preserve ALL seeded history, but move
        # future Mathematics hosting to an already approved fictional peer.
        db.execute("INSERT OR IGNORE INTO tutor_approvals VALUES (4,1)")
        db.execute(
            "UPDATE sessions SET tutor_id=4 WHERE tutor_id=2 AND subject_id=1 AND status='upcoming'"
        )
        db.execute("DELETE FROM tutor_approvals WHERE tutor_id=2 AND subject_id=1")
    return target


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database", required=True)
    args = parser.parse_args()
    print(create_presentation(args.database))


if __name__ == "__main__":
    main()
