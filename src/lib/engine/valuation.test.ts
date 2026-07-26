import { describe, expect, it } from 'vitest'
import { computeEconomics } from './economics'
import { computeGrowth } from './projection'
import { computeRevenue } from './revenue'
import { computeValuation, profileLabelFor } from './valuation'
import { ADJ_SUM_MAX, MULTIPLE_MAX, MULTIPLE_MIN } from './benchmarks'
import type { SimulatorInputs } from './types'

function inputs(overrides: Partial<SimulatorInputs> = {}): SimulatorInputs {
  return {
    tiers: [
      { name: 'Starter', price: 9, mix: 0.4 },
      { name: 'Pro', price: 29, mix: 0.5 },
      { name: 'Scale', price: 79, mix: 0.1 },
    ],
    customers: 700,
    newCustomersPerMonth: 40,
    cac: 180,
    revenueChurn: 0.025,
    expansion: 0.008,
    grossMargin: 0.85,
    fixedCosts: 3000,
    founderDependency: 'medium',
    techTransferability: 'medium',
    topClientShare: 0.08,
    ageMonths: 30,
    baseMultipleOverride: null,
    ...overrides,
  }
}

function valuationOf(overrides: Partial<SimulatorInputs> = {}) {
  const i = inputs(overrides)
  const revenue = computeRevenue(i)
  const growth = computeGrowth(i, revenue)
  const economics = computeEconomics(i, revenue)
  return { valuation: computeValuation(i, revenue, economics, growth), revenue }
}

describe('profileLabelFor', () => {
  it('étiquette selon les paliers de la spec', () => {
    expect(profileLabelFor(2000)).toBe('micro')
    expect(profileLabelFor(5000)).toBe('bootstrapped')
    expect(profileLabelFor(99_000)).toBe('bootstrapped')
    expect(profileLabelFor(100_000)).toBe('established')
  })
})

describe('computeValuation — décomposition', () => {
  it('produit une ligne par critère du barème', () => {
    const { valuation } = valuationOf()
    expect(valuation.lines).toHaveLength(9)
    expect(valuation.lines.map((line) => line.key)).toContain('founderDependency')
  })

  it('réconcilie la somme des lignes avec le multiple, hors écrêtage', () => {
    const { valuation } = valuationOf()
    expect(valuation.adjClamped).toBe(false)
    expect(valuation.multipleClamped).toBe(false)
    const sum = valuation.lines.reduce((total, line) => total + line.deltaMultiple, 0)
    expect(valuation.baseMultiple + sum).toBeCloseTo(valuation.multiple, 6)
  })

  it('convertit chaque delta en points de multiple sur la base', () => {
    const { valuation } = valuationOf()
    for (const line of valuation.lines) {
      expect(line.deltaMultiple).toBeCloseTo(valuation.baseMultiple * line.deltaPct, 9)
    }
  })

  it('conserve les lignes à delta nul', () => {
    const { valuation } = valuationOf({ founderDependency: 'medium' })
    const line = valuation.lines.find((candidate) => candidate.key === 'founderDependency')
    expect(line).toBeDefined()
    expect(line?.deltaPct).toBe(0)
  })
})

describe('computeValuation — multiple', () => {
  it('récompense un churn faible par rapport à un churn fort', () => {
    const low = valuationOf({ revenueChurn: 0.01 }).valuation.multiple
    const high = valuationOf({ revenueChurn: 0.1 }).valuation.multiple
    expect(low).toBeGreaterThan(high)
  })

  it('pénalise une forte dépendance au fondateur', () => {
    const independent = valuationOf({ founderDependency: 'low' }).valuation.multiple
    const dependent = valuationOf({ founderDependency: 'high' }).valuation.multiple
    expect(independent).toBeGreaterThan(dependent)
  })

  it('écrête le cumul des deltas quand tout est optimal', () => {
    const { valuation } = valuationOf({
      revenueChurn: 0,
      expansion: 0.09,
      grossMargin: 0.95,
      topClientShare: 0,
      ageMonths: 96,
      founderDependency: 'low',
      techTransferability: 'high',
      newCustomersPerMonth: 400,
    })
    expect(valuation.adjClamped).toBe(true)
    expect(valuation.adjSum).toBeCloseTo(ADJ_SUM_MAX)
  })

  it('maintient le multiple dans ses bornes absolues', () => {
    const { valuation } = valuationOf({ revenueChurn: 0.15, grossMargin: 0.5, ageMonths: 0 })
    expect(valuation.multiple).toBeGreaterThanOrEqual(MULTIPLE_MIN)
    expect(valuation.multiple).toBeLessThanOrEqual(MULTIPLE_MAX)
  })

  it('respecte la surcharge du multiple de base', () => {
    const { valuation } = valuationOf({ baseMultipleOverride: 6 })
    expect(valuation.isOverridden).toBe(true)
    expect(valuation.baseMultiple).toBe(6)
  })

  it('suit la courbe quand la surcharge est nulle', () => {
    const { valuation } = valuationOf({ baseMultipleOverride: null })
    expect(valuation.isOverridden).toBe(false)
    expect(valuation.baseMultiple).toBeGreaterThan(2)
    expect(valuation.baseMultiple).toBeLessThan(5)
  })
})

describe('computeValuation — montants', () => {
  it('valorise sur le SDE seul en dessous de la zone de fondu', () => {
    const { valuation } = valuationOf()
    expect(valuation.arrWeight).toBe(0)
    expect(valuation.value).toBeCloseTo(valuation.valuationSde)
  })

  it('valorise sur l ARR seul au-dessus de la zone de fondu', () => {
    const { valuation } = valuationOf({ customers: 20_000 })
    expect(valuation.arrWeight).toBe(1)
    expect(valuation.value).toBeCloseTo(valuation.valuationArr)
  })

  it('mélange les deux bases dans la zone de fondu', () => {
    const { valuation, revenue } = valuationOf({ customers: 3800 })
    expect(revenue.mrr).toBeGreaterThan(60_000)
    expect(revenue.mrr).toBeLessThan(140_000)
    expect(valuation.arrWeight).toBeGreaterThan(0)
    expect(valuation.arrWeight).toBeLessThan(1)
  })

  it('annule la composante SDE d un actif déficitaire au lieu de la rendre négative', () => {
    const { valuation } = valuationOf({ fixedCosts: 100_000 })
    expect(valuation.isLossMaking).toBe(true)
    expect(valuation.valuationSde).toBe(0)
    expect(valuation.value).toBeGreaterThanOrEqual(0)
  })

  it('encadre la valeur par une fourchette symétrique', () => {
    const { valuation } = valuationOf()
    expect(valuation.low).toBeCloseTo(valuation.value * 0.85)
    expect(valuation.high).toBeCloseTo(valuation.value * 1.15)
  })
})
