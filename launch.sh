#!/bin/bash
ROOT="$(cd "$(dirname "$0")" && pwd)"

osascript <<EOF
tell application "Terminal"
    activate
    do script "cd '$ROOT/backend' && conda activate hoarder && uvicorn app.main:app --reload"
    do script "cd '$ROOT/frontend' && npm run dev"
end tell
EOF