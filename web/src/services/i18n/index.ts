import { createI18n } from 'vue-i18n'
import { Quasar } from 'quasar'
import enUS from 'quasar/lang/en-US'
import csCZ from 'quasar/lang/cs'
import en from '@/locales/en.json'
import cs from '@/locales/cs.json'

export type SupportedLocale = 'en' | 'cs'

export const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'cs']
export const DEFAULT_LOCALE: SupportedLocale = 'cs'

export const i18n = createI18n({
  legacy: false,
  // `allowComposition: true` + global scope below means useI18n() in
  // components shares the same locale ref as i18n.global, so changing the
  // locale propagates to every component that calls useI18n().
  globalInjection: true,
  allowComposition: true,
  locale: DEFAULT_LOCALE,
  fallbackLocale: 'en',
  messages: { en, cs }
})

const quasarLangPacks: Record<SupportedLocale, any> = {
  en: enUS,
  cs: csCZ
}

export function setInterfaceLocale(locale: SupportedLocale) {
  if (!SUPPORTED_LOCALES.includes(locale)) return
  i18n.global.locale.value = locale
  Quasar.lang.set(quasarLangPacks[locale])
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', locale)
  }
}
