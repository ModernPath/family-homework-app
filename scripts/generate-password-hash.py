#!/usr/bin/env python3
"""Generate a scrypt hash for FAMILY_APP_PASSWORD_HASH."""

from getpass import getpass
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from hosting.auth import hash_password


def main() -> None:
    password = getpass("Family password: ")
    confirmation = getpass("Repeat password: ")
    if password != confirmation:
        raise SystemExit("Passwords do not match")
    print(hash_password(password))


if __name__ == "__main__":
    main()
