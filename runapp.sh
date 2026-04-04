#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SPRING_DIR="$ROOT_DIR/alakamanda_hotel_management/backend"
FRONTEND_DIR="$ROOT_DIR/alakamanda_hotel_management/frontend"
NEST_DIR="$ROOT_DIR/code/server/room-service"

DEFAULT_JWT_SECRET="TXlTdXBlclNlY3JldEtleUZvckpXVFNpZ25pbmdBbmRUb2tlbkdlbmVyYXRpb24xMjM0NTY="
SPRING_PORT="${SPRING_PORT:-8080}"
NEST_PORT="${NEST_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
JWT_SECRET="${JWT_SECRET:-$DEFAULT_JWT_SECRET}"
FRONTEND_ORIGIN="${FRONTEND_ORIGIN:-http://localhost:${FRONTEND_PORT}}"

cleanup() {
  local pids
  pids="$(jobs -pr || true)"
  if [[ -n "$pids" ]]; then
    kill $pids 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

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

wait -n
