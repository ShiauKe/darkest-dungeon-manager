export const ROSTER_PROJECTION_SCHEMA = "darkest-dungeon.roster.v1";

const RESOLVE_XP_THRESHOLDS = [0, 2, 8, 14, 24, 36];

export function resolveLevelFromXp(value) {
  const xp = Number(value);
  if (!Number.isFinite(xp) || xp < 0) return 0;
  let level = 0;
  for (let i = 1; i < RESOLVE_XP_THRESHOLDS.length; i++) {
    if (xp >= RESOLVE_XP_THRESHOLDS[i]) level = i;
  }
  return level;
}

export function projectHero(hero = {}) {
  const resolveXp = hero.resolveXp == null ? null : Number(hero.resolveXp);
  const explicitLevel = hero.resolveLevel ?? hero.level;
  return {
    id: hero.id ?? null,
    name: hero.name ?? null,
    heroClass: hero.heroClass ?? hero.class ?? null,
    resolveLevel: explicitLevel == null ? resolveLevelFromXp(resolveXp) : Number(explicitLevel),
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
    heroes: heroes.map(projectHero)
  };
}

export function assertRosterProjection(value) {
  if (!value || value.schema !== ROSTER_PROJECTION_SCHEMA || !Array.isArray(value.heroes)) {
    throw new Error("invalid roster projection");
  }
  return value;
}
