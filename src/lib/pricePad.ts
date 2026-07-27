import { INPUT_BOUNDS, TIER_BOUNDS } from './inputBounds'

/**
 * Le pad du mini-simulateur : une seule surface où l'on pose sa colombe.
 * Horizontal = nombre de clients, vertical = prix (haut = cher). Les deux
 * axes sont logarithmiques, parce que l'intérêt se joue entre 10 et 1 000
 * clients bien plus qu'entre 15 000 et 20 000.
 */

export const PAD_BOUNDS = {
  // Un prix nul n'a pas de sens sur ce pad : le minimum est 1 €.
  price: { min: 1, max: TIER_BOUNDS.price.max },
  customers: { min: 1, max: INPUT_BOUNDS.customers.max },
} as const

export interface PadPosition {
  /** 0 = gauche, 1 = droite. */
  x: number
  /** 0 = haut, 1 = bas (repère écran). */
  y: number
}

export interface PadParams {
  price: number
  customers: number
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

function toValue(t: number, { min, max }: { min: number; max: number }): number {
  return Math.round(min * (max / min) ** clamp01(t))
}

function toFraction(value: number, { min, max }: { min: number; max: number }): number {
  if (!Number.isFinite(value) || value <= min) return 0
  return clamp01(Math.log(value / min) / Math.log(max / min))
}

export function padToParams({ x, y }: PadPosition): PadParams {
  return {
    customers: toValue(x, PAD_BOUNDS.customers),
    // L'axe écran descend, le prix monte : on inverse.
    price: toValue(1 - y, PAD_BOUNDS.price),
  }
}

export function paramsToPad({ price, customers }: PadParams): PadPosition {
  return {
    x: toFraction(customers, PAD_BOUNDS.customers),
    y: 1 - toFraction(price, PAD_BOUNDS.price),
  }
}

export interface PricingAnimal {
  name: string
  /** Prix mensuel minimum du palier, inclus. */
  minPrice: number
  /** Prix mensuel maximum, exclu. */
  maxPrice: number
  /** Repère canonique de Janz : revenu annuel par client. */
  annualAcv: number
  /** Clients qu'il faut à ce palier pour atteindre 100 M$ d'ARR. */
  customersFor100M: string
}

/**
 * Les paliers de Christoph Janz (Point Nine Capital), « Five Ways to Build a
 * $100M Business » : on classe un SaaS par son revenu par client, chaque
 * palier valant un ordre de grandeur. Les bornes sont les moyennes
 * géométriques entre deux repères canoniques, ramenées au mois.
 */
export const PRICING_ANIMALS: PricingAnimal[] = [
  { name: 'Mice', minPrice: 1, maxPrice: 3, annualAcv: 10, customersFor100M: '10M' },
  { name: 'Rabbits', minPrice: 3, maxPrice: 26, annualAcv: 100, customersFor100M: '1M' },
  { name: 'Deer', minPrice: 26, maxPrice: 263, annualAcv: 1_000, customersFor100M: '100K' },
  {
    name: 'Elephants',
    minPrice: 263,
    maxPrice: Infinity,
    annualAcv: 10_000,
    customersFor100M: '10K',
  },
]

export function animalFor(price: number): PricingAnimal {
  return (
    PRICING_ANIMALS.find((animal) => price >= animal.minPrice && price < animal.maxPrice) ??
    (price < PRICING_ANIMALS[0].minPrice ? PRICING_ANIMALS[0] : PRICING_ANIMALS.at(-1)!)
  )
}

export interface PadSegment {
  from: PadPosition
  to: PadPosition
}

/**
 * La courbe d'iso-revenu (prix × clients = MRR), tronquée au pad. Sur des axes
 * logarithmiques elle devient un segment de droite : on ne rend que ses deux
 * bouts. `null` si aucun point du pad n'atteint ce MRR.
 */
export function isoRevenueSegment(mrr: number): PadSegment | null {
  if (!Number.isFinite(mrr) || mrr <= 0) return null

  const { price, customers } = PAD_BOUNDS
  const customersLow = Math.max(customers.min, mrr / price.max)
  const customersHigh = Math.min(customers.max, mrr / price.min)
  if (customersLow > customersHigh) return null

  return {
    from: paramsToPad({ customers: customersLow, price: mrr / customersLow }),
    to: paramsToPad({ customers: customersHigh, price: mrr / customersHigh }),
  }
}
