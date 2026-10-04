import fs from "node:fs";
import { projectRoster } from "../domain/roster-projection.js";

const [input, output] = process.argv.slice(2);
const decoded = JSON.parse(fs.readFileSync(input, "utf8"));

function findHeroes(node, depth = 0, path = "$") {
  if (!node || depth > 8) return null;
  if (typeof node === "object" && !Array.isArray(node)) {
    for (const key of ["heroes", "hero_roster", "roster"]) {
      if (key in node) {
        const value = node[key];
        const list = Array.isArray(value) ? value : value && typeof value === "object" ? Object.values(value) : [];
        if (list.length) return { list, path: path + "." + key };
      }
    }
    for (const [key,value] of Object.entries(node)) {
      const found = findHeroes(value, depth + 1, path + "." + key);
      if (found) return found;
    }
  }
  if (Array.isArray(node)) {
    for (let i=0;i<node.length;i++) {
      const found=findHeroes(node[i],depth+1,path+"["+i+"]");
      if(found) return found;
    }
  }
  return null;
}

function shape(value, depth=0) {
  if (value === null) return "null";
  if (Array.isArray(value)) return { type:"array", length:value.length, item: value.length && depth<3 ? shape(value[0],depth+1) : undefined };
  if (typeof value !== "object") return typeof value;
  const out={type:"object",keys:{}};
  if(depth>=3) return out;
  for(const [k,v] of Object.entries(value).slice(0,80)) out.keys[k]=shape(v,depth+1);
  return out;
}

const found=findHeroes(decoded);
const rawHeroes=found?.list ?? [];\nconst heroBodies=rawHeroes.map(h=>h?.hero_file_data?.raw_data?.base_root ?? h);
const heroes=heroBodies.map(h=>({
  id:h.id??h.roster_id??null,
  name:h.name??h.hero_name??null,
  heroClass:h.heroClass??h.hero_class??h.class??null,
  resolveLevel:h.resolveLevel??h.resolve_level??h.level??0,
  stress:h.stress??0,
  hp:h.hp??h.current_hp??null,
  skills:h.skills??h.combat_skills??[],
  trinkets:h.trinkets??[],
  quirks:h.quirks??[],
  diseases:h.diseases??[]
}));
const projection=projectRoster(heroes,{profile:"profile_0"});
const meaningful=projection.heroes.filter(h=>h.name||h.heroClass||h.id!==null).length;
const result={
 schema:"darkest-dungeon.decoder-spike.v2",
 candidate:{project:"thanhnguyen2187/darkest-savior",ref:"master",mode:"temporary-spike"},
 decode:{state:"DECODED",heroCount:rawHeroes.length,rosterPath:found?.path??null},
 mapping:{state: meaningful ? "PARTIAL":"SCHEMA_DISCOVERY_REQUIRED",meaningfulHeroCount:meaningful},
 schemaProbe:{firstHeroEnvelope:rawHeroes.length?shape(rawHeroes[0]):null,firstHeroBody:heroBodies.length?shape(heroBodies[0]):null},
 projection
};
fs.writeFileSync(output,JSON.stringify(result,null,2)+"\n");
