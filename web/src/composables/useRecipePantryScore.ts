import type { PantryItem } from '@shared/api-client'
import type { Recipe } from '@/stores/recipesStore'

export interface PantryScore {
  covered: number
  total: number
  /** null when recipe has no itemId-linked ingredients (can't score) */
  pct: number | null
  missing: string[]
}

export function computePantryScore(recipe: Recipe, pantryItems: PantryItem[]): PantryScore {
  const linked = (recipe.ingredients ?? []).filter((i) => i.itemId)
  if (linked.length === 0) return { covered: 0, total: 0, pct: null, missing: [] }

  const inStock = new Set(
    pantryItems.filter((p) => (p.quantity ?? 0) > 0).map((p) => p.itemId)
  )

  let covered = 0
  const missing: string[] = []
  for (const ing of linked) {
    if (ing.itemId && inStock.has(ing.itemId)) {
      covered++
    } else {
      missing.push(ing.itemName)
    }
  }

  return { covered, total: linked.length, pct: covered / linked.length, missing }
}

/** Higher = better coverage. Used to sort recipes. */
export function pantryScoreSortKey(s: PantryScore): number {
  if (s.pct === null) return -1
  if (s.pct === 0) return 0
  if (s.pct === 1) return 2 + s.covered // all covered → highest; more linked = more useful signal
  return 1 + s.pct                       // partial → sort by fraction
}
