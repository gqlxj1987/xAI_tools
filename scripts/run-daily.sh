#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DATE_KEY="$(date +%F)"

npm run run:tasks -- --date "$DATE_KEY" "$@"
