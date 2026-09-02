#!/usr/bin/env bash
# Auto-commit on save. Run this in a terminal tab while you study:
#   ./scripts/watch-backup.sh
# It watches for changes (progress.json written by the browser, edits to content, etc.)
# and commits them automatically, debounced. Ctrl-C to stop.
set -euo pipefail
cd "$(dirname "$0")/.."

INTERVAL="${1:-15}"   # seconds between checks
echo "watching $(pwd) — auto-commit every ${INTERVAL}s when there are changes (Ctrl-C to stop)"

commit_if_dirty() {
  if [[ -n "$(git status --porcelain)" ]]; then
    git add -A
    git commit -q -m "progress: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "$(date '+%H:%M:%S')  committed $(git rev-parse --short HEAD)"
  fi
}

if command -v fswatch >/dev/null 2>&1; then
  # event-driven, still debounced by --latency
  commit_if_dirty
  fswatch -o -l "$INTERVAL" --exclude '\.git' . | while read -r _; do
    commit_if_dirty
  done
else
  # portable polling fallback (no extra tools needed)
  while true; do
    commit_if_dirty
    sleep "$INTERVAL"
  done
fi
