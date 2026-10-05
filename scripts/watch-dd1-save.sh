#!/usr/bin/env bash
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STEAM="$HOME/Library/Application Support/Steam"
REMOTE="$(find "$STEAM/userdata" -type d -path '*/262060/remote' -print -quit 2>/dev/null || true)"
ROSTER="$REMOTE/profile_0/persist.roster.json"
INTERVAL="${DD1_WATCH_INTERVAL:-5}"

if [ ! -f "$ROSTER" ]; then
  echo "DD1_ROSTER_NOT_FOUND: $ROSTER" >&2
  exit 22
fi

mtime() {
  stat -f '%m' "$ROSTER"
}

last="$(mtime)"
echo "DD1_WATCHING"
echo "$ROSTER"
echo "interval=${INTERVAL}s"

while true; do
  sleep "$INTERVAL"
  current="$(mtime)"
  if [ "$current" != "$last" ]; then
    last="$current"
    echo "DD1_SAVE_CHANGED $(date '+%Y-%m-%d %H:%M:%S')"
    if bash "$ROOT/scripts/spike-ddsaveeditor.sh"; then
      echo "DD1_AUTO_PUBLISHED"
    else
      echo "DD1_AUTO_PUBLISH_FAILED" >&2
    fi
  fi
done
