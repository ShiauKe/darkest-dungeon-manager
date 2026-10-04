import test from "node:test";
import assert from "node:assert/strict";
import { projectHero, resolveLevelFromXp } from "../src/domain/roster-projection.js";

test("maps DD1 resolve XP thresholds", () => {
  assert.equal(resolveLevelFromXp(0), 0);
  assert.equal(resolveLevelFromXp(2), 1);
  assert.equal(resolveLevelFromXp(8), 2);
  assert.equal(resolveLevelFromXp(14), 3);
  assert.equal(resolveLevelFromXp(24), 4);
  assert.equal(resolveLevelFromXp(36), 5);
});

test("projects progression fields from decoded hero adapter", () => {
  assert.deepEqual(
    projectHero({ name:"R1", heroClass:"leper", resolveXp:24, weaponRank:4, armourRank:3 }),
    {
      id:null, name:"R1", heroClass:"leper", resolveLevel:4, resolveXp:24,
      weaponRank:4, armourRank:3, stress:0, hp:null,
      skills:[], trinkets:[], quirks:[], diseases:[]
    }
  );
});
