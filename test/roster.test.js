import test from "node:test";
import assert from "node:assert/strict";
import { normalizeHero, normalizeRoster } from "../src/domain/roster.js";

test("normalizes common hero fields", () => {
  assert.deepEqual(
    normalizeHero({ roster_id: 7, hero_name: "Reynauld", hero_class: "crusader", resolve_level: 2, stress: 14 }),
    {
      id: "7",
      name: "Reynauld",
      heroClass: "crusader",
      resolveLevel: 2,
      stress: 14,
      hp: null,
      quirks: [],
      diseases: [],
      skills: [],
      trinkets: []
    }
  );
});

test("normalizes a roster", () => {
  const roster = normalizeRoster([{ id: 1, name: "A" }, { id: 2, name: "B" }]);
  assert.equal(roster.length, 2);
});
