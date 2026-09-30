#!/usr/bin/env bash
# Start Interview OS (and the Prep Hub library) → http://localhost:8777
cd "$(dirname "$0")" && exec python3 server.py "$@"
