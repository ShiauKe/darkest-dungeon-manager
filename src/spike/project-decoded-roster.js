import fs from "node:fs";
import { projectRoster } from "../domain/roster-projection.js";

const [input, output] = process.argv.slice(2);
const decoded = JSON.parse(fs.readFileSync(input, "utf8"));

function findHeroes(node, depth = 0) {
  if (!node || depth > 8) return [];
  if (Array.isArray(node)) {
    const heroish = node.filter(x => x && typeof x === "object" && ("heroClass" in x || "hero_class" in x || "resolve_level" in x || "resolveLevel" in x));
    if (heroish.length) return heroish;
    for (const child of node) {
      const found = findHeroes(child, depth + 1);
      if (found.length) return found;
    }
    return [];
  }
  if (typeof node === "object") {
    for (const key of ["heroes", "hero_roster", "roster"]) {
      if (key in node) {
        const value = node[key];
        const list = Array.isArray(value) ? value : value && typeof value === "object" ? Object.values(value) : [];
        if (list.length) return list;
      }
    }
    for (const value of Object.values(node)) {
      const found = findHeroes(value, depth + 1);
      if (found.length) return found;
    }
  }
  return [];
}

const rawHeroes = findHeroes(decoded);
const heroes = rawHeroes.map(h => ({
  id: h.id ?? h.roster_id ?? null,
  name: h.name ?? h.hero_name ?? null,
  heroClass: h.heroClass ?? h.hero_class ?? h.class ?? null,
  resolveLevel: h.resolveLevel ?? h.resolve_level ?? h.level ?? 0,
  stress: h.stress ?? 0,
  hp: h.hp ?? h.current_hp ?? null,
  skills: h.skills ?? h.combat_skills ?? [],
  trinkets: h.trinkets ?? [],
  quirks: h.quirks ?? [],
  diseases: h.diseases ?? []
}));

const projection = projectRoster(heroes, { profile: "profile_0" });
const result = {
  schema: "darkest-dungeon.decoder-spike.v1",
  candidate: { project: "robojumper/DarkestDungeonSaveEditor", version: "v0.0.70", mode: "temporary-spike" },
  decode: { state: "DECODED", heroCount: projection.heroes.length },
  projection
};
fs.mkdirSync(new URL("../../runtime/", import.meta.url), { recursive: true });
fs.writeFileSync(output, JSON.stringify(result, null, 2) + "\n");
