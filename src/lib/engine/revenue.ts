import type { Revenue, SimulatorInputs } from './types'

export function computeRevenue(inputs: SimulatorInputs): Revenue {
  const mixTotal = inputs.tiers.reduce((sum, tier) => sum + Math.max(tier.mix, 0), 0)

  const arpu =
    mixTotal > 0
      ? inputs.tiers.reduce((sum, tier) => sum + tier.price * (Math.max(tier.mix, 0) / mixTotal), 0)
      : 0

  const mrr = inputs.customers * arpu
  const arr = mrr * 12
  const newMrr = inputs.newCustomersPerMonth * arpu

  const variableCost = mrr * (1 - inputs.grossMargin)
  const acquisitionCost = inputs.newCustomersPerMonth * inputs.cac
  const sdeMonthly = mrr - variableCost - acquisitionCost - inputs.fixedCosts
  const sdeAnnual = sdeMonthly * 12
  const netMargin = mrr > 0 ? sdeMonthly / mrr : 0

  return { arpu, mrr, arr, newMrr, variableCost, acquisitionCost, sdeMonthly, sdeAnnual, netMargin }
}
