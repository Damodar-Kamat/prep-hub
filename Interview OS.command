#!/usr/bin/env bash
# Double-click in Finder to launch Interview OS (opens your browser at http://localhost:8777)
cd "$(dirname "$0")" && exec python3 server.py
