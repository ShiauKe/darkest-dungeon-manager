export const ROSTER_PROJECTION_SCHEMA = "darkest-dungeon.roster.v1";

export function projectHero(hero = {}) {
  return {
    id: hero.id ?? null,
    name: hero.name ?? null,
    heroClass: hero.heroClass ?? hero.class ?? null,
    resolveLevel: Number(hero.resolveLevel ?? hero.level ?? 0),
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
