import { computeEconomics } from './economics'
import { computeGrowth, computeProjection } from './projection'
import { computeRevenue } from './revenue'
import { computeValuation } from './valuation'
import type { SimulatorInputs, SimulatorResults } from './types'

/**
 * Seul point d'entrée public du moteur. Fonction pure : aucune mutation
 * de l'argument, aucun effet de bord, aucun accès au temps ou au hasard.
 */
export function compute(inputs: SimulatorInputs): SimulatorResults {
  const revenue = computeRevenue(inputs)
  const economics = computeEconomics(inputs, revenue)
  const growth = computeGrowth(inputs, revenue)
  const projection = computeProjection(inputs, revenue)
  const valuation = computeValuation(inputs, revenue, economics, growth)

  return { revenue, economics, growth, projection, valuation }
}

export { healthOf, priceZoneFor, HEALTH_THRESHOLDS, PRICE_ZONES } from './benchmarks'
export type { HealthMetric, PriceZone } from './benchmarks'
export * from './types'
