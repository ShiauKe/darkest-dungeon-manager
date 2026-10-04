import fs from "node:fs";
import { execFileSync } from "node:child_process";

const [source, remotePath, branch] = process.argv.slice(2);
if (!source || !remotePath || !branch) throw new Error("usage: publish-artifact <source> <remotePath> <branch>");
const payload = fs.readFileSync(source);
const git = (args, options = {}) => execFileSync("git", args, { encoding: "utf8", ...options }).trim();

function remoteHead() {
  try {
    const line = git(["ls-remote", "--heads", "origin", branch]);
    return line ? line.split(/\s+/)[0] : null;
  } catch {
    return null;
  }
}

function buildCommit(parent) {
  const blob = git(["hash-object", "-w", "--stdin"], { input: payload });
  const baseTree = git(["rev-parse", `${parent}^{tree}`]);
  const indexFile = `${process.cwd()}/.git/dd1-artifact-index-${process.pid}`;
  const env = { ...process.env, GIT_INDEX_FILE: indexFile };
  try {
    execFileSync("git", ["read-tree", baseTree], { env, stdio: "ignore" });
    execFileSync("git", ["update-index", "--add", "--cacheinfo", "100644", blob, remotePath], { env, stdio: "ignore" });
    const tree = execFileSync("git", ["write-tree"], { env, encoding: "utf8" }).trim();
    return execFileSync("git", ["commit-tree", tree, "-p", parent, "-m", `artifact: publish ${remotePath}`], { env, encoding: "utf8" }).trim();
  } finally {
    try { fs.rmSync(indexFile, { force: true }); } catch {}
  }
}

let lastError;
for (let attempt = 1; attempt <= 4; attempt++) {
  const expected = remoteHead();
  const parent = expected ?? git(["rev-parse", "origin/main"]);
  const commit = buildCommit(parent);
  try {
    const refspec = expected
      ? `${commit}:refs/heads/${branch}`
      : `${commit}:refs/heads/${branch}`;
    execFileSync("git", ["push", "origin", refspec], { stdio: "inherit" });
    const acknowledged = remoteHead();
    if (acknowledged !== commit) throw new Error(`delivery acknowledgement failed: remote=${acknowledged ?? "missing"} expected=${commit}`);
    console.log(JSON.stringify({ state: "DELIVERED", branch, remotePath, commit, attempt }));
    process.exit(0);
  } catch (error) {
    lastError = error;
    if (attempt < 4) continue;
  }
}
throw lastError ?? new Error("artifact delivery failed");
