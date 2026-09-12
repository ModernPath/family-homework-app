"""Vercel entrypoint; static frontend is served by Vercel, not Python."""
from hosting.app import create_app

app = create_app()
