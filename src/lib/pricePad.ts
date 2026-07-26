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
