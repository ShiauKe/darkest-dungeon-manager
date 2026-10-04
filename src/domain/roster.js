export function normalizeHero(raw = {}) {
  return {
    id: String(raw.id ?? raw.rosterId ?? raw.roster_id ?? ""),
    name: String(raw.name ?? raw.heroName ?? raw.hero_name ?? "Unknown"),
    heroClass: String(raw.heroClass ?? raw.hero_class ?? raw.class ?? "unknown"),
    resolveLevel: Number(raw.resolveLevel ?? raw.resolve_level ?? raw.level ?? 0),
    stress: Number(raw.stress ?? 0),
    hp: raw.hp == null ? null : Number(raw.hp),
    quirks: Array.isArray(raw.quirks) ? raw.quirks : [],
    diseases: Array.isArray(raw.diseases) ? raw.diseases : [],
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    trinkets: Array.isArray(raw.trinkets) ? raw.trinkets : []
  };
}

export function normalizeRoster(rawHeroes = []) {
  return rawHeroes.map(normalizeHero).filter(hero => hero.id || hero.name !== "Unknown");
}
