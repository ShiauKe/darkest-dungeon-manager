#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

VERSION="v0.0.70"
ASSET="DDSaveEditor-v0.0.70.zip"
RELEASE="https://github.com/robojumper/DarkestDungeonSaveEditor/releases/download/$VERSION/$ASSET"
STEAM="$HOME/Library/Application Support/Steam"
GAME="$STEAM/steamapps/common/DarkestDungeon"
REMOTE="$(find "$STEAM/userdata" -type d -path '*/262060/remote' -print -quit)"
ROSTER="$REMOTE/profile_0/persist.roster.json"

command -v java >/dev/null
command -v curl >/dev/null
command -v unzip >/dev/null
test -d "$GAME"
test -f "$ROSTER"

curl -fsSL "$RELEASE" -o "$TMP/$ASSET"
unzip -q "$TMP/$ASSET" -d "$TMP/tool"
JAR="$(find "$TMP/tool" -name 'DDSaveEditor.jar' -print -quit)"
test -f "$JAR"

java -jar "$JAR" names "$GAME" > "$TMP/names.txt"
java -jar "$JAR" decode --names "$TMP/names.txt" --output "$TMP/roster.json" "$ROSTER"

node "$ROOT/src/spike/project-decoded-roster.js" "$TMP/roster.json" "$ROOT/runtime/roster-spike.json"
node "$ROOT/src/runtime/publish-artifact.js" "$ROOT/runtime/roster-spike.json" "runtime/roster-spike.json" "roster-spike"

echo "SPIKE_DELIVERED"
