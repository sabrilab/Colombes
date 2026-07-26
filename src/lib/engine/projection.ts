import { PROJECTION_MONTHS } from './benchmarks'
import type { Growth, Revenue, SimulatorInputs } from './types'

export function computeGrowth(inputs: SimulatorInputs, revenue: Revenue): Growth {
  const netChurn = inputs.revenueChurn - inputs.expansion

  // Point fixe de la récurrence : mrr* × netChurn = newMrr.
  // À rétention nette négative ou nulle, il n'y a pas de plafond.
  const mrrCeiling = netChurn > 0 ? revenue.newMrr / netChurn : null

  const growthMoM = revenue.mrr > 0 ? (revenue.newMrr - revenue.mrr * netChurn) / revenue.mrr : 0
  const growthAnnual = (1 + growthMoM) ** 12 - 1
  const ruleOf40 = growthAnnual * 100 + revenue.netMargin * 100

  return { netChurn, mrrCeiling, growthMoM, growthAnnual, ruleOf40 }
}

export function computeProjection(inputs: SimulatorInputs, revenue: Revenue): number[] {
  const retention = 1 - inputs.revenueChurn + inputs.expansion
  const series: number[] = [revenue.mrr]

  for (let month = 1; month <= PROJECTION_MONTHS; month++) {
    const next = series[month - 1] * retention + revenue.newMrr
    series.push(Math.max(0, next))
  }

  return series
}
