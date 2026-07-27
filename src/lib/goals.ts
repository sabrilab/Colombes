import type { SimulatorInputs, SimulatorResults } from './engine/types'

/**
 * Le passage du point A au point B. Un objectif ne se contente pas d'afficher
 * un écart : il dit quand la trajectoire actuelle y arrive, ou pourquoi elle
 * n'y arrivera jamais — et dans ce cas, de combien il faut bouger.
 */

export interface Goal {
  /** v1 : seul le MRR est visé, parce que c'est ce que la projection modélise. */
  metric: 'mrr'
  target: number
  /** Horizon en mois. Au-delà, un but « atteint » ne compte plus. */
  months: number
}

export interface GoalOutcome {
  current: number
  target: number
  /** Positif tant qu'il reste du chemin. */
  gap: number
  /** Premier mois de la projection qui franchit le but, `null` si jamais. */
  monthReached: number | null
  /** Le but tombe-t-il dans l'horizon demandé ? */
  reachedInHorizon: boolean
  /** Plafond de MRR à réglages constants, `null` si la base compose seule. */
  ceiling: number | null
  /** Le but est au-dessus du plafond : aucune patience n'y suffira. */
  aboveCeiling: boolean
  /**
   * Les deux leviers exacts, quand le but dépasse le plafond. Le plafond vaut
   * `newMrr / netChurn` : on résout donc l'égalité sur chacun des deux termes.
   */
  requiredNewCustomers: number | null
  requiredChurn: number | null
}

export function evaluateGoal(
  inputs: SimulatorInputs,
  results: SimulatorResults,
  goal: Goal,
): GoalOutcome {
  const { revenue, growth, projection } = results
  const current = revenue.mrr
  const target = goal.target

  const monthIndex = projection.findIndex((mrr) => mrr >= target)
  const monthReached = monthIndex === -1 ? null : monthIndex

  const ceiling = growth.mrrCeiling
  const aboveCeiling = ceiling !== null && target > ceiling

  let requiredNewCustomers: number | null = null
  let requiredChurn: number | null = null

  if (aboveCeiling && revenue.arpu > 0) {
    // Plafond = newMrr / netChurn. Pour que le plafond atteigne le but, il faut
    // soit assez de nouveau revenu chaque mois, soit une fuite assez faible.
    const requiredNewMrr = target * growth.netChurn
    requiredNewCustomers = Math.ceil(requiredNewMrr / revenue.arpu)
    // netChurn = churn − expansion : on relâche le churn, l'expansion est acquise.
    requiredChurn = Math.max(0, revenue.newMrr / target + inputs.expansion)
  }

  return {
    current,
    target,
    gap: target - current,
    monthReached,
    reachedInHorizon: monthReached !== null && monthReached <= goal.months,
    ceiling,
    aboveCeiling,
    requiredNewCustomers,
    requiredChurn,
  }
}
