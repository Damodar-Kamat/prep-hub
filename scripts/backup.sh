#!/usr/bin/env bash
# One-shot backup: commit private/progress.json (and any other private data) + push to the private repo if there is anything to commit.
set -euo pipefail
cd "$(dirname "$0")/../private"   # the private data repo (prep-hub-data), NOT the public code repo
[[ -d .git ]] || { echo "private/ is not a git repo — see README"; exit 1; }

if [[ -n "$(git status --porcelain)" ]]; then
  git add -A
  git commit -q -m "progress: $(date '+%Y-%m-%d %H:%M:%S')"
  echo "committed $(git rev-parse --short HEAD)"
  git push -q && echo "pushed to $(git remote get-url origin)"
else
  echo "nothing to back up"
fi
