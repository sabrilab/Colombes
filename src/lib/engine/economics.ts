import type { Economics, Revenue, SimulatorInputs } from './types'

export function computeEconomics(inputs: SimulatorInputs, revenue: Revenue): Economics {
  const unitMargin = revenue.arpu * inputs.grossMargin

  const ltv = inputs.revenueChurn > 0 ? unitMargin / inputs.revenueChurn : null
  const ltvCacRatio = ltv !== null && inputs.cac > 0 ? ltv / inputs.cac : null
  const paybackMonths = unitMargin > 0 ? inputs.cac / unitMargin : null
  const nrr = 1 - inputs.revenueChurn + inputs.expansion

  return { ltv, ltvCacRatio, paybackMonths, nrr }
}
