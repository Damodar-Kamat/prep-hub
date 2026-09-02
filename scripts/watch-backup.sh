#!/usr/bin/env bash
# Commit once per Save. Run this in a terminal tab while you study:
#   ./scripts/watch-backup.sh
# The browser only writes progress.json when you click the Save button, so this makes
# roughly one commit per Save (plus any content edits you make). Ctrl-C to stop.
# If you'd rather commit by hand, skip this and run ./scripts/backup.sh when you want.
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
