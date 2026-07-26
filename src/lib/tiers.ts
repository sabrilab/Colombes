import type { Tier } from './engine/types'
import { TIER_BOUNDS, TIER_COUNT_BOUNDS } from './inputBounds'

const TIER_NAME_POOL = ['Starter', 'Pro', 'Scale', 'Entreprise']

/** Rend le même tableau (même référence) si on est déjà au plafond de plans. */
export function addTierTo(tiers: Tier[]): Tier[] {
  if (tiers.length >= TIER_COUNT_BOUNDS.max) return tiers

  const used = new Set(tiers.map((tier) => tier.name))
  const name =
    TIER_NAME_POOL.find((candidate) => !used.has(candidate)) ?? `Plan ${tiers.length + 1}`

  // Un nouveau plan naît au-dessus du plus cher, part à 0 : il n'altère pas
  // le mix existant tant qu'on ne le règle pas.
  const topPrice = Math.max(...tiers.map((tier) => tier.price), 1)
  const price = Math.min(TIER_BOUNDS.price.max, Math.round(topPrice * 2))

  return [...tiers, { name, price, mix: 0 }]
}

/** Rend le même tableau (même référence) s'il ne reste qu'un plan. */
export function removeTierAt(tiers: Tier[], index: number): Tier[] {
  if (tiers.length <= TIER_COUNT_BOUNDS.min) return tiers
  return tiers.filter((_, i) => i !== index)
}
