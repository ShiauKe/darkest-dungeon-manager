#!/usr/bin/env bash
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
STEAM="$HOME/Library/Application Support/Steam"
REMOTE="$(find "$STEAM/userdata" -type d -path '*/262060/remote' -print -quit 2>/dev/null || true)"
ROSTER="$REMOTE/profile_0/persist.roster.json"

publish_artifact(){
  node "$ROOT/src/runtime/publish-artifact.js" "$1" "$2" "$3"
}
publish_state(){
  local stage="$1" state="$2" detail="$3"
  mkdir -p "$ROOT/runtime"
  node - "$ROOT/runtime/roster-spike.json" "$stage" "$state" "$detail" <<'NODE'
import fs from "node:fs";
const [out,stage,state,detail]=process.argv.slice(2);
fs.writeFileSync(out,JSON.stringify({
  schema:"darkest-dungeon.decoder-spike.v1",
  candidate:{project:"thanhnguyen2187/darkest-savior",ref:"master",mode:"temporary-spike"},
  observedAt:new Date().toISOString(),stage,state,detail
},null,2)+"\n");
NODE
  publish_artifact "$ROOT/runtime/roster-spike.json" "runtime/roster-spike.json" "roster-spike"
}

echo "[1/5] environment"
if ! command -v go >/dev/null 2>&1; then
  echo "GO_RUNTIME_MISSING"; publish_state environment BLOCKED "go runtime missing"; exit 20
fi
if [ ! -f "$ROSTER" ]; then
  publish_state input BLOCKED "persist.roster.json not found"; exit 22
fi
publish_state environment READY "$(go version)"

echo "[2/5] acquire candidate"
git clone -q --depth 1 --branch master https://github.com/thanhnguyen2187/darkest-savior.git "$TMP/source" || {
  publish_state acquire FAILED "candidate clone failed"; exit 23
}

echo "[3/5] build temporary binary"
(cd "$TMP/source" && go build -o "$TMP/darkest-savior" .) || {
  publish_state build FAILED "go build failed"; exit 24
}
publish_state build READY "temporary binary built"

echo "[4/5] decode real roster"
"$TMP/darkest-savior" convert --from "$ROSTER" --to "$TMP/roster.json" || {
  publish_state decode FAILED "candidate could not decode roster"; exit 25
}
publish_state decode DECODED "real persist.roster.json converted to JSON"

echo "[5/5] bounded projection + acknowledged delivery"
node "$ROOT/src/spike/project-decoded-roster.js" "$TMP/roster.json" "$ROOT/runtime/roster-spike.json" || {
  publish_state projection FAILED "decoded JSON did not map to current projection"; exit 26
}
publish_artifact "$ROOT/runtime/roster-spike.json" "runtime/roster-spike.json" "roster-spike"
echo "SPIKE_DELIVERED"
