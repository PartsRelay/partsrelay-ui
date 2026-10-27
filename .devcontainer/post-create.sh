#!/usr/bin/env bash
set -euo pipefail

git submodule update --init

[ -f .env ] || cp .env.example .env

bun install
