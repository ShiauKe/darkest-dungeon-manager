import { execFileSync } from "node:child_process";
import { hostname, platform, release } from "node:os";
import { loadRosterFromSteam } from "../adapters/steam-save.js";

export async function buildObservation() {
  const steam = await loadRosterFromSteam();
  return {
    schema: "dd1.local-observation.v1",
    observedAt: new Date().toISOString(),
    source: {
      host: hostname(),
      platform: platform(),
      release: release(),
      cwd: process.cwd()
    },
    capability: "darkest-dungeon-steam-save",
    steam
  };
}

export function publishObservation({ file = "runtime/local-observation.json", branch = "local-observation" } = {}) {
  execFileSync("git", ["fetch", "origin"], { stdio: "inherit" });
  let exists = true;
  try {
    execFileSync("git", ["rev-parse", "--verify", branch], { stdio: "ignore" });
  } catch {
    exists = false;
  }
  if (!exists) execFileSync("git", ["branch", branch, "origin/main"], { stdio: "inherit" });

  const original = execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
  execFileSync("git", ["switch", branch], { stdio: "inherit" });
  try {
    execFileSync("git", ["add", file], { stdio: "inherit" });
    const dirty = execFileSync("git", ["status", "--porcelain", "--", file], { encoding: "utf8" }).trim();
    if (dirty) execFileSync("git", ["commit", "-m", "observe: publish local Steam state"], { stdio: "inherit" });
    execFileSync("git", ["push", "-u", "origin", branch], { stdio: "inherit" });
  } finally {
    execFileSync("git", ["switch", original || "main"], { stdio: "inherit" });
  }
}
