import { computed, type ComputedRef } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import type { SupportedLocale } from '@/services/i18n'

type Translations = Partial<Record<SupportedLocale, Partial<Record<string, string | string[]>>>>

interface Translatable {
  translations?: Translations | null
  name?: string | null
  searchNames?: string[] | null
  description?: string | null
  instructions?: string[] | null
}

const FALLBACK_CHAIN: SupportedLocale[] = ['cs', 'en']

export function useContentLocale(): ComputedRef<SupportedLocale> {
  const authStore = useAuthStore()
  return computed(() => (authStore.user?.itemsLanguage as SupportedLocale | undefined) ?? 'cs')
}

export function pickTranslated<T extends string | string[]>(
  entity: Translatable | null | undefined,
  field: string,
  locale: SupportedLocale
): T | undefined {
  if (!entity) return undefined
  const t = entity.translations
  if (t) {
    const direct = t[locale]?.[field]
    if (direct !== undefined && direct !== null && direct !== '') return direct as T
    for (const fb of FALLBACK_CHAIN) {
      if (fb === locale) continue
      const v = t[fb]?.[field]
      if (v !== undefined && v !== null && v !== '') return v as T
    }
  }
  // Legacy fall-through to the flat field
  const legacy = (entity as any)[field]
  return (legacy as T) ?? undefined
}

export function tName(entity: Translatable | null | undefined, locale: SupportedLocale): string {
  return (pickTranslated<string>(entity, 'name', locale) ?? '') as string
}

export function tDescription(entity: Translatable | null | undefined, locale: SupportedLocale): string {
  return (pickTranslated<string>(entity, 'description', locale) ?? '') as string
}

export function tInstructions(entity: Translatable | null | undefined, locale: SupportedLocale): string[] {
  const v = pickTranslated<string[]>(entity, 'instructions', locale)
  return Array.isArray(v) ? v : []
}

export function tSearchNames(entity: Translatable | null | undefined, locale: SupportedLocale): string[] {
  const v = pickTranslated<string[]>(entity, 'searchNames', locale)
  return Array.isArray(v) ? v : []
}

// Search-aware variant: matches names across ALL locales (so a Czech-locale
// user can still find an item by typing its English name).
export function entityMatchesQuery(entity: Translatable, query: string): boolean {
  if (!entity || !query) return false
  const q = query.toLowerCase().trim()
  if (!q) return false
  const candidates: (string | undefined)[] = [(entity as any).name]
  const t = entity.translations
  if (t) {
    for (const loc of FALLBACK_CHAIN) {
      const n = t[loc]?.name
      if (typeof n === 'string') candidates.push(n)
      const sn = t[loc]?.searchNames
      if (Array.isArray(sn)) candidates.push(...sn)
    }
  }
  if (Array.isArray((entity as any).searchNames)) candidates.push(...((entity as any).searchNames as string[]))
  return candidates.some(c => typeof c === 'string' && c.toLowerCase().includes(q))
}
