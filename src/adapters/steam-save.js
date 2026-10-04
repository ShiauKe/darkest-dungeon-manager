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

async function inspectTree(root, depth = 3, relative = "") {
  if (depth < 0) return [];
  const current = path.join(root, relative);
  let entries;
  try {
    entries = await fs.readdir(current, { withFileTypes: true });
  } catch {
    return [];
  }

  const out = [];
  for (const entry of entries.slice(0, 200)) {
    const rel = path.join(relative, entry.name);
    out.push({ path: rel, kind: entry.isDirectory() ? "directory" : "file" });
    if (entry.isDirectory() && depth > 0) {
      out.push(...await inspectTree(root, depth - 1, rel));
    }
  }
  return out;
}

export async function discoverDarkestDungeonProfiles({ home = os.homedir() } = {}) {
  const userdataRoots = steamRoots(home).map(root => path.join(root, "userdata"));
  const profiles = [];
  for (const userdata of userdataRoots) {
    let users = [];
    try { users = await fs.readdir(userdata, { withFileTypes: true }); } catch { continue; }
    for (const user of users.filter(x => x.isDirectory())) {
      const remote = path.join(userdata, user.name, "262060", "remote");
      try {
        const stat = await fs.stat(remote);
        if (!stat.isDirectory()) continue;
        profiles.push({
          steamUserDir: user.name,
          remote,
          entries: await inspectTree(remote, 3)
        });
      } catch {}
    }
  }
  return profiles;
}

// Darkest Dungeon Steam App ID: 262060.
// This discovery intentionally reports file/directory metadata only; native save
// decoding stays behind this adapter and domain/UI code receives normalized data.
export async function loadRosterFromSteam() {
  const roots = await findDarkestDungeonSaveRoots();
  const profiles = await discoverDarkestDungeonProfiles();
  return {
    status: profiles.length ? "profile-found" : roots.length ? "save-root-found" : "save-root-not-found",
    roots,
    profiles,
    roster: [],
    decoder: profiles.length ? "profile-discovered-native-decoder-pending" : "pending-native-save-decoder"
  };
}
