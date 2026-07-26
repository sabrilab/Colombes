import { priceZoneFor } from './engine'
import type { SimulatorInputs } from './engine/types'
import { DEFAULT_INPUTS } from './defaults'
import { clampTo, INPUT_BOUNDS } from './inputBounds'

export interface QuickParams {
  /** Prix mensuel de l'abonnement, en euros. */
  price: number
  customers: number
}

/**
 * Le mini-simulateur de l'accueil ne demande que deux chiffres. Tout le reste
 * est déduit d'hypothèses médianes de marché — chaque déduction est bornée
 * par les jauges pour que « Affiner dans le simulateur » reparte d'un état sain.
 */
export function quickInputs({ price, customers }: QuickParams): SimulatorInputs {
  const zone = priceZoneFor(price)
  // Milieu de la zone de churn typique pour ce niveau de prix.
  const revenueChurn = Number(((zone.churnMin + zone.churnMax) / 2).toFixed(3))

  const grossMargin = DEFAULT_INPUTS.grossMargin
  // Un CAC calé sur ~8 mois de payback : ni machine à cash, ni gouffre.
  const cac = clampTo(INPUT_BOUNDS.cac, Math.round(8 * price * grossMargin))
  // Une acquisition qui renouvelle ~5 % de la base chaque mois.
  const newCustomersPerMonth = clampTo(
    INPUT_BOUNDS.newCustomersPerMonth,
    Math.max(5, Math.round(customers * 0.05)),
  )
  // Des charges fixes à ~20 % du MRR, plancher de solo-fondateur.
  const fixedCosts = clampTo(
    INPUT_BOUNDS.fixedCosts,
    Math.max(500, Math.round(price * customers * 0.2)),
  )

  return {
    ...DEFAULT_INPUTS,
    tiers: [{ name: 'Abonnement', price, mix: 1 }],
    customers: clampTo(INPUT_BOUNDS.customers, customers),
    newCustomersPerMonth,
    cac,
    revenueChurn,
    expansion: 0.005,
    grossMargin,
    fixedCosts,
    topClientShare: 0.05,
    ageMonths: 24,
  }
}
