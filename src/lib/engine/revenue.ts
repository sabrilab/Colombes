import { ANNUAL_CHURN_RELIEF } from './benchmarks'
import type { Revenue, SimulatorInputs } from './types'

export function computeRevenue(inputs: SimulatorInputs): Revenue {
  const mixTotal = inputs.tiers.reduce((sum, tier) => sum + Math.max(tier.mix, 0), 0)

  const listArpu =
    mixTotal > 0
      ? inputs.tiers.reduce((sum, tier) => sum + tier.price * (Math.max(tier.mix, 0) / mixTotal), 0)
      : 0

  // Le paiement annuel se paie d'une remise : l'ARPU mensuel équivalent
  // baisse au prorata de la part de clients qui en profitent.
  const arpu = listArpu * (1 - inputs.annualShare * inputs.annualDiscount)

  const mrr = inputs.customers * arpu
  const arr = mrr * 12
  const newMrr = inputs.newCustomersPerMonth * arpu

  // Douze mois encaissés d'un coup pour la part annuelle : c'est de la
  // trésorerie, pas du revenu de plus — l'ARR ne bouge pas.
  const cashUpfront = mrr * 12 * inputs.annualShare

  /**
   * Les lifetime deals restent à l'écart du MRR et de l'ARR. Ce sont des
   * encaissements uniques : les compter comme du récurrent gonflerait un
   * multiple qui, précisément, se paie sur la récurrence.
   */
  const ltdCashMonthly = inputs.ltdPerMonth * inputs.ltdPrice

  const variableCost = mrr * (1 - inputs.grossMargin)
  const acquisitionCost = inputs.newCustomersPerMonth * inputs.cac
  const sdeMonthly = mrr - variableCost - acquisitionCost - inputs.fixedCosts
  const sdeAnnual = sdeMonthly * 12
  const netMargin = mrr > 0 ? sdeMonthly / mrr : 0

  return {
    arpu,
    mrr,
    arr,
    newMrr,
    variableCost,
    acquisitionCost,
    sdeMonthly,
    sdeAnnual,
    netMargin,
    cashUpfront,
    ltdCashMonthly,
  }
}

/**
 * Churn effectif après engagement : un client engagé douze mois ne décide
 * qu'au renouvellement, donc la part annuelle de la base fuit moins vite.
 * C'est cette valeur, et non le churn saisi, qui alimente rétention,
 * projection et plafond.
 */
export function effectiveChurn(inputs: SimulatorInputs): number {
  return inputs.revenueChurn * (1 - inputs.annualShare * ANNUAL_CHURN_RELIEF)
}
