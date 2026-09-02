#!/usr/bin/env bash
# One-shot backup: commit progress.json (and any other changes) if there is anything to commit.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -n "$(git status --porcelain)" ]]; then
  git add -A
  git commit -q -m "progress: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "committed $(git rev-parse --short HEAD)"
else
  echo "nothing to back up"
fi
