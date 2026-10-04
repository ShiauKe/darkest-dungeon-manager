import fs from "node:fs";
import { execFileSync } from "node:child_process";

const [source, remotePath, branch] = process.argv.slice(2);
const payload = fs.readFileSync(source);
const git = (args, options = {}) => execFileSync("git", args, { encoding: "utf8", ...options }).trim();

try { git(["fetch", "origin", branch]); } catch {}
let parent;
try { parent = git(["rev-parse", "FETCH_HEAD"]); } catch { parent = git(["rev-parse", "origin/main"]); }

const blob = git(["hash-object", "-w", "--stdin"], { input: payload });
const baseTree = git(["rev-parse", `${parent}^{tree}`]);
const indexFile = `${process.cwd()}/.git/dd1-artifact-index`;
const env = { ...process.env, GIT_INDEX_FILE: indexFile };
try {
  execFileSync("git", ["read-tree", baseTree], { env });
  execFileSync("git", ["update-index", "--add", "--cacheinfo", "100644", blob, remotePath], { env });
  const tree = execFileSync("git", ["write-tree"], { env, encoding: "utf8" }).trim();
  const commit = execFileSync("git", ["commit-tree", tree, "-p", parent, "-m", "spike: publish bounded roster projection"], { env, encoding: "utf8" }).trim();
  execFileSync("git", ["push", "origin", `${commit}:refs/heads/${branch}`], { stdio: "inherit" });
  const remote = git(["ls-remote", "--heads", "origin", branch]).split(/\s+/)[0];
  if (remote !== commit) throw new Error("artifact delivery acknowledgement failed");
} finally {
  try { fs.rmSync(indexFile, { force: true }); } catch {}
}
