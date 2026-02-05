#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
VENV_ACTIVATE="$BACKEND_DIR/venv/bin/activate"

if [[ ! -f "$VENV_ACTIVATE" ]]; then
  echo "Backend venv not found at $VENV_ACTIVATE"
  echo "Create it first, then re-run this script."
  exit 1
fi

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "Starting backend (FastAPI)"
(
  cd "$BACKEND_DIR"
  # shellcheck disable=SC1091
  source "$VENV_ACTIVATE"
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
) &
BACKEND_PID=$!

echo "Starting frontend (Vite)"
(
  cd "$FRONTEND_DIR"
  npm run dev
) &
FRONTEND_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID"
