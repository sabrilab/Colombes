import type { Level, SimulatorInputs, Tier } from '@/lib/engine/types'

/**
 * L'état voyage dans le fragment et non dans la query : un fragment n'est
 * jamais transmis au serveur ni journalisé, et les hypothèses financières
 * d'un actif n'ont rien à faire dans des logs.
 */
const HASH_KEY = 's'
const LEVELS: Level[] = ['low', 'medium', 'high']

function toBase64Url(value: string): string {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  return atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
}

export function encodeInputs(inputs: SimulatorInputs): string {
  return toBase64Url(JSON.stringify(inputs))
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isTier(value: unknown): value is Tier {
  if (typeof value !== 'object' || value === null) return false
  const tier = value as Record<string, unknown>
  return typeof tier.name === 'string' && isNumber(tier.price) && isNumber(tier.mix)
}

/** Rend `null` sur toute entrée douteuse : un lien périmé ne casse pas l'écran. */
export function decodeInputs(fragment: string): SimulatorInputs | null {
  if (!fragment) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(fromBase64Url(fragment))
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) return null
  const candidate = parsed as Record<string, unknown>

  if (!Array.isArray(candidate.tiers) || candidate.tiers.length !== 3) return null
  if (!candidate.tiers.every(isTier)) return null

  const numericKeys = [
    'customers',
    'newCustomersPerMonth',
    'cac',
    'revenueChurn',
    'expansion',
    'grossMargin',
    'fixedCosts',
    'topClientShare',
    'ageMonths',
  ] as const
  if (!numericKeys.every((key) => isNumber(candidate[key]))) return null

  if (!LEVELS.includes(candidate.founderDependency as Level)) return null
  if (!LEVELS.includes(candidate.techTransferability as Level)) return null

  const override = candidate.baseMultipleOverride
  if (override !== null && !isNumber(override)) return null

  return candidate as unknown as SimulatorInputs
}

export function readInputsFromHash(): SimulatorInputs | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const fragment = params.get(HASH_KEY)
  return fragment ? decodeInputs(fragment) : null
}

export function buildShareUrl(inputs: SimulatorInputs): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#${HASH_KEY}=${encodeInputs(inputs)}`
}
