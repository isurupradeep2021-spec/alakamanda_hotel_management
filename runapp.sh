#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SPRING_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
NEST_DIR="$ROOT_DIR/room-service-backend"

DEFAULT_JWT_SECRET="TXlTdXBlclNlY3JldEtleUZvckpXVFNpZ25pbmdBbmRUb2tlbkdlbmVyYXRpb24xMjM0NTY="
SPRING_PORT="${SPRING_PORT:-8080}"
NEST_PORT="${NEST_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
JWT_SECRET="${JWT_SECRET:-$DEFAULT_JWT_SECRET}"
FRONTEND_ORIGIN="${FRONTEND_ORIGIN:-http://localhost:${FRONTEND_PORT}}"
SPRING_PROPERTIES_FILE="${SPRING_PROPERTIES_FILE:-$SPRING_DIR/src/main/resources/application.properties}"

cleanup() {
  local pids
  pids="$(jobs -pr || true)"
  if [[ -n "$pids" ]]; then
    kill $pids 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

require_dir() {
  local path="$1"
  local label="$2"

  if [[ ! -d "$path" ]]; then
    echo "$label directory not found: $path" >&2
    exit 1
  fi
}

require_command() {
  local cmd="$1"

  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Required command not found: $cmd" >&2
    exit 1
  fi
}

require_node_modules() {
  local path="$1"
  local label="$2"

  if [[ ! -d "$path/node_modules" ]]; then
    echo "$label dependencies are missing." >&2
    echo "Run: cd \"$path\" && npm install" >&2
    exit 1
  fi
}

require_dir "$SPRING_DIR" "Spring Boot backend"
require_dir "$FRONTEND_DIR" "Frontend"
require_dir "$NEST_DIR" "Room service backend"

require_command mvn
require_command npm

require_node_modules "$FRONTEND_DIR" "Frontend"
require_node_modules "$NEST_DIR" "Room service backend"

if [[ -f "$SPRING_PROPERTIES_FILE" ]]; then
  SPRING_DB_URL="$(grep -E '^spring\.datasource\.url=' "$SPRING_PROPERTIES_FILE" | tail -n 1 | cut -d= -f2-)"
  SPRING_DB_USER="$(grep -E '^spring\.datasource\.username=' "$SPRING_PROPERTIES_FILE" | tail -n 1 | cut -d= -f2-)"
  SPRING_DB_PASS="$(grep -E '^spring\.datasource\.password=' "$SPRING_PROPERTIES_FILE" | tail -n 1 | cut -d= -f2-)"

  if [[ -n "${SPRING_DB_URL:-}" ]]; then
    if [[ "$SPRING_DB_URL" =~ jdbc:mysql://([^:/?#]+):([0-9]+)/([^?]+) ]]; then
      export DB_HOST="${DB_HOST:-${BASH_REMATCH[1]}}"
      export DB_PORT="${DB_PORT:-${BASH_REMATCH[2]}}"
      export DB_NAME="${DB_NAME:-${BASH_REMATCH[3]}}"
    fi
  fi

  export DB_USER="${DB_USER:-$SPRING_DB_USER}"
  export DB_PASS="${DB_PASS:-$SPRING_DB_PASS}"
fi

echo "Starting Spring Boot backend on port ${SPRING_PORT}"
(
  cd "$SPRING_DIR"
  export SERVER_PORT="$SPRING_PORT"
  export JWT_SECRET
  mvn spring-boot:run
) &

echo "Starting NestJS room-service on port ${NEST_PORT}"
(
  cd "$NEST_DIR"
  export PORT="$NEST_PORT"
  export JWT_SECRET
  export FRONTEND_ORIGIN
  npm run start:dev
) &

echo "Starting Vite frontend on port ${FRONTEND_PORT}"
(
  cd "$FRONTEND_DIR"
  export VITE_API_BASE_URL="${VITE_API_BASE_URL:-http://127.0.0.1:${SPRING_PORT}/api}"
  export VITE_NEST_API_BASE_URL="${VITE_NEST_API_BASE_URL:-http://127.0.0.1:${NEST_PORT}/api}"
  npm run dev -- --host 0.0.0.0 --port "$FRONTEND_PORT"
) &

while jobs -pr >/dev/null; do
  wait || true
done
