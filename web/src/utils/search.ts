export function normalizeForSearch(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export function matchesQuery(
  query: string,
  ...candidates: (string | null | undefined)[]
): boolean {
  const q = normalizeForSearch(query).trim()
  if (!q) return true
  return candidates.some(c => typeof c === 'string' && normalizeForSearch(c).includes(q))
}
