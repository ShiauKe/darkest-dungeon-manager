import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { projectRoster } from "../domain/roster-projection.js";

function commandExists(command) {
  try {
    execFileSync("sh", ["-lc", `command -v ${command}`], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function decoderCapability() {
  return {
    provider: "darkest-savior",
    command: "darkest-savior",
    available: commandExists("darkest-savior"),
    mode: "external-cli"
  };
}

function heroValues(decoded) {
  const root = decoded?.base_root ?? decoded ?? {};
  const heroes = root?.heroes ?? root?.roster?.heroes ?? root?.hero_roster ?? {};
  if (Array.isArray(heroes)) return heroes;
  if (heroes && typeof heroes === "object") return Object.values(heroes);
  return [];
}

export function decodeRosterWithExternalCli(nativeRosterPath, { profile = "profile_0" } = {}) {
  if (!commandExists("darkest-savior")) {
    return { state: "DECODER_MISSING", capability: decoderCapability(), projection: null };
  }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dd-roster-"));
  const output = path.join(dir, "roster.json");
  try {
    execFileSync("darkest-savior", ["convert", "--from", nativeRosterPath, "--to", output], {
      stdio: ["ignore", "ignore", "pipe"]
    });
    const decoded = JSON.parse(fs.readFileSync(output, "utf8"));
    const projection = projectRoster(heroValues(decoded), { profile });
    return {
      state: "ROSTER_READY",
      capability: decoderCapability(),
      heroCount: projection.heroes.length,
      projection
    };
  } catch (error) {
    return {
      state: "DECODER_FAILED",
      capability: decoderCapability(),
      errorType: error?.name ?? "Error",
      projection: null
    };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
