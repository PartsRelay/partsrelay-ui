#!/usr/bin/env bash
set -euo pipefail

bun install --frozen-lockfile >/dev/null 2>&1 || bun install

if ! pgrep -f 'bun run dev' >/dev/null; then
  nohup setsid bun run dev >/tmp/ui-dev.log 2>&1 &
  echo 'ui is starting, follow it with: tail -f /tmp/ui-dev.log'
fi
