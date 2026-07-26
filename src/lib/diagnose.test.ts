import { describe, expect, it } from 'vitest'
import { diagnose } from './diagnose'
import { compute } from './engine'
import { DEFAULT_INPUTS } from './defaults'
import type { SimulatorInputs } from './engine/types'

function resultsOf(overrides: Partial<SimulatorInputs> = {}) {
  return compute({ ...DEFAULT_INPUTS, ...overrides })
}

describe('diagnose', () => {
  it('explique une exploitation déficitaire en nommant les coûts', () => {
    const results = resultsOf({ fixedCosts: 100_000 })
    const texts = diagnose(results).map((insight) => insight.text)
    expect(diagnose(results)[0].tone).toBe('bad')
    expect(texts.join(' ')).toMatch(/fixed costs/i)
  })

  it('désigne un churn destructeur comme premier frein', () => {
    const results = resultsOf({ revenueChurn: 0.09, expansion: 0 })
    const first = diagnose(results)[0]
    expect(first.tone).toBe('bad')
    expect(first.text).toMatch(/churn/i)
  })

  it('salue une base qui compose toute seule quand le NRR dépasse 100 %', () => {
    const results = resultsOf({ revenueChurn: 0.01, expansion: 0.015 })
    const goods = diagnose(results).filter((insight) => insight.tone === 'good')
    expect(goods.map((insight) => insight.text).join(' ')).toMatch(/compounds|expansion/i)
  })

  it('prévient quand le MRR approche de son plafond', () => {
    // Plafond = newMrr/netChurn ; on cale le MRR tout près.
    const results = resultsOf({
      customers: 4_000,
      newCustomersPerMonth: 100,
      revenueChurn: 0.05,
      expansion: 0,
    })
    const texts = diagnose(results).map((insight) => insight.text)
    expect(texts.join(' ')).toMatch(/ceiling/i)
  })

  it('rend toujours entre 1 et 3 lectures, la plus grave d abord', () => {
    for (const overrides of [{}, { revenueChurn: 0.12 }, { fixedCosts: 90_000 }]) {
      const insights = diagnose(resultsOf(overrides))
      expect(insights.length).toBeGreaterThanOrEqual(1)
      expect(insights.length).toBeLessThanOrEqual(3)
    }
  })
})
