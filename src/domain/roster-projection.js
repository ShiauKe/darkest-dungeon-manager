export const ROSTER_PROJECTION_SCHEMA = "darkest-dungeon.roster.v1";

export const RESOLVE_XP_THRESHOLDS = {
  radiant: [0, 2, 7, 13, 21, 29, 40],
  darkest: [0, 2, 8, 14, 24, 36, 48],
  stygian: [0, 2, 8, 14, 24, 36, 48]
};

export function resolveLevelFromXp(value, difficulty = "stygian") {
  const xp = Number(value);
  if (!Number.isFinite(xp) || xp < 0) return 0;
  const thresholds = RESOLVE_XP_THRESHOLDS[difficulty] ?? RESOLVE_XP_THRESHOLDS.stygian;
  let level = 0;
  for (let i = 1; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i;
  }
  return level;
}

export function projectHero(hero = {}, meta = {}) {
  const resolveXp = hero.resolveXp == null ? null : Number(hero.resolveXp);
  const explicitLevel = hero.resolveLevel ?? hero.level;
  return {
    id: hero.id ?? null,
    name: hero.name ?? null,
    heroClass: hero.heroClass ?? hero.class ?? null,
    resolveLevel: explicitLevel == null ? resolveLevelFromXp(resolveXp, meta.difficulty) : Number(explicitLevel),
    resolveXp,
    weaponRank: hero.weaponRank == null ? null : Number(hero.weaponRank),
    armourRank: hero.armourRank == null ? null : Number(hero.armourRank),
    stress: Number(hero.stress ?? 0),
    hp: hero.hp ?? null,
    skills: Array.isArray(hero.skills) ? hero.skills : [],
    trinkets: Array.isArray(hero.trinkets) ? hero.trinkets : [],
    quirks: Array.isArray(hero.quirks) ? hero.quirks : [],
    diseases: Array.isArray(hero.diseases) ? hero.diseases : []
  };
}

export function projectRoster(heroes = [], meta = {}) {
  return {
    schema: ROSTER_PROJECTION_SCHEMA,
    projectedAt: new Date().toISOString(),
    profile: meta.profile ?? null,
    difficulty: meta.difficulty ?? "stygian",
    heroes: heroes.map(hero => projectHero(hero, meta))
  };
}

export function assertRosterProjection(value) {
  if (!value || value.schema !== ROSTER_PROJECTION_SCHEMA || !Array.isArray(value.heroes)) {
    throw new Error("invalid roster projection");
  }
  return value;
}
