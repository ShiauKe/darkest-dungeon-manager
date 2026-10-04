import { execFileSync } from "node:child_process";
import { hostname, platform, release } from "node:os";
import { randomUUID } from "node:crypto";
import { loadRosterFromSteam } from "../adapters/steam-save.js";

function git(args, options = {}) {
  return execFileSync("git", args, { encoding: "utf8", ...options }).trim();
}

export async function buildObservation() {
  const steam = await loadRosterFromSteam();
  return {
    schema: "dd1.local-observation.v1",
    messageId: randomUUID(),
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

export function publishObservation(observation, { branch = "local-observation" } = {}) {
  const payload = JSON.stringify(observation, null, 2) + "\n";

  git(["fetch", "origin", branch], { stdio: ["ignore", "pipe", "pipe"] });

  let parent = "";
  try {
    parent = git(["rev-parse", "FETCH_HEAD"]);
  } catch {
    parent = git(["rev-parse", "origin/main"]);
  }

  const blob = git(["hash-object", "-w", "--stdin"], { input: payload });
  const baseTree = git(["rev-parse", `${parent}^{tree}`]);
  const indexFile = `${process.cwd()}/.git/dd1-observation-index`;

  const env = { ...process.env, GIT_INDEX_FILE: indexFile };
  try {
    execFileSync("git", ["read-tree", baseTree], { env, stdio: "ignore" });
    execFileSync("git", ["update-index", "--add", "--cacheinfo", "100644", blob, "runtime/local-observation.json"], { env, stdio: "ignore" });
    const tree = execFileSync("git", ["write-tree"], { env, encoding: "utf8" }).trim();
    const commit = execFileSync(
      "git",
      ["commit-tree", tree, "-p", parent, "-m", `observe: ${observation.messageId}`],
      { env, encoding: "utf8" }
    ).trim();

    execFileSync("git", ["push", "origin", `${commit}:refs/heads/${branch}`], { stdio: "inherit" });

    const remote = git(["ls-remote", "--heads", "origin", branch]).split(/\s+/)[0];
    if (remote !== commit) {
      throw new Error(`delivery acknowledgement failed: remote=${remote || "missing"} expected=${commit}`);
    }

    return {
      state: "DELIVERED",
      messageId: observation.messageId,
      commit,
      branch
    };
  } finally {
    try { execFileSync("rm", ["-f", indexFile]); } catch {}
  }
}
