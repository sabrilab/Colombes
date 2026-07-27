import { effectiveChurn } from './revenue'
import type { Economics, Revenue, SimulatorInputs } from './types'

export function computeEconomics(inputs: SimulatorInputs, revenue: Revenue): Economics {
  const unitMargin = revenue.arpu * inputs.grossMargin
  // C'est le churn après engagement qui gouverne la durée de vie.
  const churn = effectiveChurn(inputs)

  const ltv = churn > 0 ? unitMargin / churn : null
  // Le CAC mélangé est le vrai coût d'un client : c'est lui qui juge
  // l'acquisition, pas le prix payé sur le seul canal payant.
  const ltvCacRatio = ltv !== null && revenue.blendedCac > 0 ? ltv / revenue.blendedCac : null
  const paybackMonths = unitMargin > 0 ? revenue.blendedCac / unitMargin : null
  // Annualisé : la convention de marché (et les ancres/seuils de benchmarks.ts)
  // parle en NRR annuel, alors que churn et expansion sont mensuels.
  const nrr = (1 - churn + inputs.expansion) ** 12

  return { ltv, ltvCacRatio, paybackMonths, nrr }
}
