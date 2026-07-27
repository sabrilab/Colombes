import { FR } from './fr'

export type Language = 'en' | 'fr'

export const LANGUAGES: Language[] = ['en', 'fr']

/**
 * Traduction à clé anglaise. La source reste lisible dans le code — on écrit
 * `t('Estimated valuation')`, pas `t('home.valuation.label')` — et une entrée
 * manquante retombe sur l'anglais au lieu d'afficher une clé nue.
 *
 * `vars` remplace les jetons `{nom}` : c'est le seul moyen de traduire une
 * phrase dont l'ordre des mots change d'une langue à l'autre.
 */
export function translate(
  language: Language,
  text: string,
  vars?: Record<string, string | number>,
): string {
  const template = language === 'fr' ? (FR[text] ?? text) : text
  if (!vars) return template

  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

/** Langue de départ : celle du navigateur si c'est du français, sinon l'anglais. */
export function detectLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en'
  return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}
