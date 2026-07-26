/**
 * Bornes de chaque entrée du simulateur — point unique de vérité, partagé
 * entre les jauges du panneau de contrôle et le décodage des liens partagés
 * (urlState.ts), pour qu'un lien forgé ne puisse pas alimenter le moteur
 * avec des valeurs hors cadran.
 */

export interface Bounds {
  min: number
  max: number
}

export const TIER_COUNT_BOUNDS: Bounds = { min: 1, max: 4 }

export const TIER_BOUNDS = {
  price: { min: 0, max: 500 },
  mix: { min: 0, max: 1 },
} as const satisfies Record<string, Bounds>

export const INPUT_BOUNDS = {
  customers: { min: 0, max: 20_000 },
  newCustomersPerMonth: { min: 0, max: 1_000 },
  cac: { min: 0, max: 2_000 },
  revenueChurn: { min: 0, max: 0.15 },
  expansion: { min: 0, max: 0.1 },
  grossMargin: { min: 0.5, max: 0.99 },
  fixedCosts: { min: 0, max: 100_000 },
  topClientShare: { min: 0, max: 0.6 },
  ageMonths: { min: 0, max: 96 },
  /** Aligné sur MULTIPLE_MIN / MULTIPLE_MAX de benchmarks.ts. */
  baseMultipleOverride: { min: 1, max: 10 },
} as const satisfies Record<string, Bounds>

export function clampTo(bounds: Bounds, value: number): number {
  return Math.min(bounds.max, Math.max(bounds.min, value))
}
