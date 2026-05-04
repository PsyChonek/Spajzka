import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export type Locale = 'en' | 'cs';
export const SUPPORTED_LOCALES: Locale[] = ['en', 'cs'];
export const DEFAULT_LOCALE: Locale = 'cs';

export type Translations<F extends string = string> = Partial<Record<Locale, Partial<Record<F, string | string[]>>>>;

export async function getUserItemsLanguage(userId: string | undefined): Promise<Locale> {
  if (!userId) return DEFAULT_LOCALE;
  try {
    const db = getDatabase();
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { itemsLanguage: 1 } }
    );
    const lang = user?.itemsLanguage;
    return SUPPORTED_LOCALES.includes(lang) ? (lang as Locale) : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export async function resolveLocale(req: AuthRequest, fallback: Locale = DEFAULT_LOCALE): Promise<Locale> {
  if (req.userId) {
    const lang = await getUserItemsLanguage(req.userId);
    if (lang) return lang;
  }
  return fallback;
}

export function pickTranslation<F extends string>(
  translations: Translations<F> | undefined | null,
  locale: Locale,
  field: F,
  fallback: Locale = DEFAULT_LOCALE
): string | string[] | undefined {
  if (!translations) return undefined;
  return translations[locale]?.[field] ?? translations[fallback]?.[field];
}

// Project an entity that has both legacy flat fields AND a translations map
// down to the requested locale. Falls back to the legacy fields if a
// translation entry doesn't exist (covers pre-migration docs).
// Project an entity that has both legacy flat fields AND a translations map
// down to the requested locale. Falls back to the legacy fields if a
// translation entry doesn't exist (covers pre-migration docs). Keeps the
// `translations` map on the response so the frontend can still switch locales
// reactively without re-fetching.
export function localizeEntity<T extends Record<string, any>>(
  entity: T,
  locale: Locale,
  textFields: string[] = ['name'],
  arrayFields: string[] = ['searchNames']
): T {
  if (!entity) return entity;
  const out: any = { ...entity };
  const translations = entity.translations as Translations | undefined;
  for (const f of textFields) {
    const v = pickTranslation(translations, locale, f as any);
    if (typeof v === 'string') out[f] = v;
  }
  for (const f of arrayFields) {
    const v = pickTranslation(translations, locale, f as any);
    if (Array.isArray(v)) out[f] = v;
  }
  return out;
}

// True iff client requested ?include=translations (edit dialogs need both locales)
export function shouldIncludeTranslations(req: AuthRequest): boolean {
  const v = req.query?.include;
  return v === 'translations' || (Array.isArray(v) && v.includes('translations'));
}

export function validateTranslationsInput(
  raw: unknown
): { ok: true; value?: Translations } | { ok: false; error: string } {
  if (raw === undefined || raw === null) return { ok: true, value: undefined };
  if (typeof raw !== 'object') return { ok: false, error: 'translations must be an object' };
  const out: Translations = {};
  for (const [locale, fields] of Object.entries(raw as any)) {
    if (!SUPPORTED_LOCALES.includes(locale as Locale)) {
      return { ok: false, error: `Unsupported locale "${locale}"` };
    }
    if (typeof fields !== 'object' || fields === null) {
      return { ok: false, error: `translations.${locale} must be an object` };
    }
    out[locale as Locale] = fields as any;
  }
  return { ok: true, value: out };
}

// Apply parsed translations onto a Mongo `$set` payload using dotted keys so
// per-locale fields can be set without overwriting the entire translations map.
export function mergeTranslationsIntoUpdate(
  updateData: Record<string, any>,
  translations: Translations | undefined
): void {
  if (!translations) return;
  for (const [loc, fields] of Object.entries(translations)) {
    for (const [field, val] of Object.entries(fields ?? {})) {
      updateData[`translations.${loc}.${field}`] = val;
    }
  }
}
