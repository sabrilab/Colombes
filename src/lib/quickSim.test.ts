import { describe, expect, it } from 'vitest'
import { quickInputs } from './quickSim'
import { compute, priceZoneFor } from './engine'
import { clampTo, INPUT_BOUNDS } from './inputBounds'

describe('quickInputs', () => {
  it('construit un plan unique au prix donné, part à 100 %', () => {
    const inputs = quickInputs({ price: 29, customers: 500 })
    expect(inputs.tiers).toHaveLength(1)
    expect(inputs.tiers[0].price).toBe(29)
    expect(inputs.tiers[0].mix).toBe(1)
    expect(inputs.customers).toBe(500)
  })

  it('déduit un churn dans la zone typique du prix', () => {
    for (const price of [9, 29, 120, 350]) {
      const zone = priceZoneFor(price)
      const { revenueChurn } = quickInputs({ price, customers: 300 })
      expect(revenueChurn, `prix ${price}`).toBeGreaterThanOrEqual(zone.churnMin)
      expect(revenueChurn, `prix ${price}`).toBeLessThanOrEqual(zone.churnMax)
    }
  })

  it('cale le CAC sur un payback d environ 8 mois', () => {
    const inputs = quickInputs({ price: 49, customers: 400 })
    const payback = inputs.cac / (49 * inputs.grossMargin)
    expect(payback).toBeGreaterThan(7)
    expect(payback).toBeLessThan(9)
  })

  it('reste dans les bornes des jauges pour les cas extrêmes', () => {
    for (const [price, customers] of [
      [1, 1],
      [500, 20_000],
      [9, 15_000],
    ] as const) {
      const inputs = quickInputs({ price, customers })
      for (const key of Object.keys(INPUT_BOUNDS) as (keyof typeof INPUT_BOUNDS)[]) {
        if (key === 'baseMultipleOverride') continue
        const value = inputs[key]
        expect(clampTo(INPUT_BOUNDS[key], value), `${price}×${customers}.${key}`).toBe(value)
      }
    }
  })

  it('produit une valorisation finie et positive', () => {
    const results = compute(quickInputs({ price: 19, customers: 800 }))
    expect(Number.isFinite(results.valuation.value)).toBe(true)
    expect(results.valuation.value).toBeGreaterThan(0)
  })
})
