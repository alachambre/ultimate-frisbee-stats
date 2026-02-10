#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_VENV_DIR="$BACKEND_DIR/venv"
BACKEND_PYTHON="$BACKEND_VENV_DIR/bin/python"
FRONTEND_VITE="$FRONTEND_DIR/node_modules/.bin/vite"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is not available on PATH."
  echo "Install Node.js (includes npm), then re-run this script."
  exit 1
fi

if [[ ! -x "$BACKEND_PYTHON" ]]; then
  PYTHON_CMD=""
  if command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
  elif command -v python >/dev/null 2>&1; then
    PYTHON_CMD="python"
  fi

  if [[ -z "$PYTHON_CMD" ]]; then
    echo "Python is not installed or not available on PATH."
    echo "Install Python 3, then re-run this script."
    exit 1
  fi

  echo "Backend venv not found. Creating it at $BACKEND_VENV_DIR"
  "$PYTHON_CMD" -m venv "$BACKEND_VENV_DIR"
fi

if ! "$BACKEND_PYTHON" -c "import fastapi, uvicorn" >/dev/null 2>&1; then
  echo "Backend dependencies missing. Installing from requirements.txt"
  "$BACKEND_PYTHON" -m pip install -r "$BACKEND_DIR/requirements.txt"
fi

if [[ ! -f "$FRONTEND_VITE" ]]; then
  echo "Frontend dependencies missing. Installing with npm"
  (
    cd "$FRONTEND_DIR"
    npm install
  )
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
  "$BACKEND_PYTHON" -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
) &
BACKEND_PID=$!

echo "Starting frontend (Vite)"
(
  cd "$FRONTEND_DIR"
  npm run dev
) &
FRONTEND_PID=$!

wait "$BACKEND_PID" "$FRONTEND_PID"
