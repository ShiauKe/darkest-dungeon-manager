import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

export function steamRoots(home = os.homedir()) {
  return [
    path.join(home, "Library/Application Support/Steam"),
    path.join(home, ".steam/steam"),
    path.join(home, ".local/share/Steam")
  ];
}

export async function findDarkestDungeonSaveRoots({ home = os.homedir() } = {}) {
  const candidates = steamRoots(home).flatMap(root => [
    path.join(root, "userdata"),
    path.join(root, "steamapps/common/DarkestDungeon")
  ]);
  const existing = [];
  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate);
      if (stat.isDirectory()) existing.push(candidate);
    } catch {}
  }
  return existing;
}

export async function inspectSaveDirectory(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return entries.map(entry => ({
    name: entry.name,
    kind: entry.isDirectory() ? "directory" : "file"
  }));
}

// Boundary: Darkest Dungeon's native save decoding belongs here.
// Domain/UI code must consume normalized roster data rather than native save files.
export async function loadRosterFromSteam() {
  const roots = await findDarkestDungeonSaveRoots();
  return {
    status: roots.length ? "save-root-found" : "save-root-not-found",
    roots,
    roster: [],
    decoder: "pending-native-save-decoder"
  };
}
