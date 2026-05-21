#!/usr/bin/env python3
"""Launch the Monkey Statistics agent tools installer web UI."""

from __future__ import annotations

import argparse
import sys
import threading
import webbrowser
from pathlib import Path


def current_python_command() -> str:
    executable = (sys.executable or "").strip()
    if not executable:
        return "python"
    return str(Path(executable).resolve())


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Launch the Monkey Statistics agent tools installer web UI."
    )
    parser.add_argument("--port", type=int, default=8322, help="Port to serve on.")
    parser.add_argument("--no-browser", action="store_true", help="Do not open a browser automatically.")
    args = parser.parse_args()

    try:
        from installer_web.app import create_app
    except ModuleNotFoundError as exc:
        if exc.name == "flask":
            print("Flask is required to launch the installer UI.")
            print(f"Run `{current_python_command()} -m pip install -r scripts/requirements.txt` and try again.")
            return 1
        if exc.name == "tomli":
            print("A TOML parser is required on this Python version.")
            print(f"Run `{current_python_command()} -m pip install -r scripts/requirements.txt` and try again.")
            return 1
        raise

    app = create_app()
    url = f"http://127.0.0.1:{args.port}"
    print(f"Monkey Statistics Agent Tools Installer starting at {url}")
    print("Press Ctrl+C to stop.\n")

    if not args.no_browser:
        threading.Timer(1.0, webbrowser.open, args=[url]).start()

    app.run(host="127.0.0.1", port=args.port, debug=False, threaded=True)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("\nInstaller UI stopped.")
        raise SystemExit(0)
