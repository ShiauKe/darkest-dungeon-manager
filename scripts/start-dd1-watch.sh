#!/usr/bin/env bash
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$ROOT/runtime/dd1-watch.log"
PIDFILE="$ROOT/runtime/dd1-watch.pid"
mkdir -p "$ROOT/runtime"

if [ -f "$PIDFILE" ]; then
  pid="$(cat "$PIDFILE" 2>/dev/null || true)"
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    echo "DD1_WATCH_ALREADY_RUNNING pid=$pid"
    exit 0
  fi
  rm -f "$PIDFILE"
fi

nohup bash "$ROOT/scripts/watch-dd1-save.sh" >>"$LOG" 2>&1 &
pid=$!
echo "$pid" >"$PIDFILE"
echo "DD1_WATCH_STARTED pid=$pid"
echo "log=$LOG"
