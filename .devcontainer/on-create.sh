#!/usr/bin/env bash
set -euo pipefail

sudo chown -R "$(id -u):$(id -g)" "${HOME}/.bun" 2>/dev/null || true
