import { describe, expect, it } from 'vitest'
import { evaluateGoal } from './goals'
import { compute } from './engine'
import { DEFAULT_INPUTS } from './defaults'
import type { SimulatorInputs } from './engine/types'

function outcomeOf(target: number, months = 18, overrides: Partial<SimulatorInputs> = {}) {
  const inputs = { ...DEFAULT_INPUTS, ...overrides }
  return evaluateGoal(inputs, compute(inputs), { metric: 'mrr', target, months })
}

describe('evaluateGoal', () => {
  it('rend l écart au but depuis le MRR courant', () => {
    const outcome = outcomeOf(30_000)
    expect(outcome.current).toBeCloseTo(19_760)
    expect(outcome.target).toBe(30_000)
    expect(outcome.gap).toBeCloseTo(30_000 - 19_760)
  })

  it('date le mois où la projection franchit le but', () => {
    const outcome = outcomeOf(25_000, 36)
    expect(outcome.monthReached).not.toBeNull()
    expect(outcome.reachedInHorizon).toBe(true)
    // Le mois retenu doit être le premier à dépasser le but.
    const { projection } = compute(DEFAULT_INPUTS)
    expect(projection[outcome.monthReached!]).toBeGreaterThanOrEqual(25_000)
    expect(projection[outcome.monthReached! - 1]).toBeLessThan(25_000)
  })

  it('signale un but déjà atteint', () => {
    const outcome = outcomeOf(10_000)
    expect(outcome.monthReached).toBe(0)
    expect(outcome.gap).toBeLessThan(0)
  })

  it('déclare hors d atteinte un but au-dessus du plafond', () => {
    // Plafond par défaut : 90 000 €. Viser au-delà est impossible à réglages
    // constants, quelle que soit la patience.
    const outcome = outcomeOf(200_000, 36)
    expect(outcome.aboveCeiling).toBe(true)
    expect(outcome.monthReached).toBeNull()
    expect(outcome.reachedInHorizon).toBe(false)
  })

  it('chiffre les deux leviers qui rendraient le but atteignable', () => {
    const outcome = outcomeOf(200_000, 36)
    // Plafond = newMrr / netChurn : soit plus d'acquisition, soit moins de churn.
    expect(outcome.requiredNewCustomers).toBeGreaterThan(DEFAULT_INPUTS.newCustomersPerMonth)
    expect(outcome.requiredChurn).toBeLessThan(DEFAULT_INPUTS.revenueChurn)
    expect(outcome.requiredChurn).toBeGreaterThanOrEqual(0)
  })

  it('ne propose aucun levier quand le but est déjà sous le plafond', () => {
    const outcome = outcomeOf(30_000, 36)
    expect(outcome.aboveCeiling).toBe(false)
    expect(outcome.requiredNewCustomers).toBeNull()
    expect(outcome.requiredChurn).toBeNull()
  })

  it('reste défini quand la rétention nette est positive et sans plafond', () => {
    const outcome = outcomeOf(50_000, 36, { revenueChurn: 0.01, expansion: 0.02 })
    expect(outcome.ceiling).toBeNull()
    expect(outcome.aboveCeiling).toBe(false)
  })

  it('borne l horizon : un but franchi après la fenêtre n y est pas compté', () => {
    const short = outcomeOf(25_000, 3)
    expect(short.reachedInHorizon).toBe(false)
    expect(short.monthReached).not.toBeNull()
    expect(short.monthReached!).toBeGreaterThan(3)
  })
})
