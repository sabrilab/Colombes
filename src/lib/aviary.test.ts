import { describe, expect, it } from 'vitest'
import { AVIARY, colombeById } from './aviary'
import { compute } from './engine'
import { clampTo, INPUT_BOUNDS, TIER_BOUNDS, TIER_COUNT_BOUNDS } from './inputBounds'

describe('AVIARY', () => {
  it('contient 6 colombes aux identifiants uniques, en kebab-case', () => {
    expect(AVIARY).toHaveLength(6)
    const ids = AVIARY.map((colombe) => colombe.id)
    expect(new Set(ids).size).toBe(6)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/)
  })

  it('chaque colombe a une identité rédigée complète', () => {
    for (const colombe of AVIARY) {
      expect(colombe.name.length, colombe.id).toBeGreaterThan(0)
      expect(colombe.sector.length, colombe.id).toBeGreaterThan(0)
      expect(colombe.pitch.length, colombe.id).toBeGreaterThanOrEqual(40)
      expect(colombe.lesson.length, colombe.id).toBeGreaterThanOrEqual(80)
    }
  })

  it('les entrées de chaque colombe respectent les bornes des jauges', () => {
    for (const colombe of AVIARY) {
      const { inputs } = colombe
      expect(inputs.tiers.length).toBeGreaterThanOrEqual(TIER_COUNT_BOUNDS.min)
      expect(inputs.tiers.length).toBeLessThanOrEqual(TIER_COUNT_BOUNDS.max)
      for (const tier of inputs.tiers) {
        expect(clampTo(TIER_BOUNDS.price, tier.price), colombe.id).toBe(tier.price)
        expect(clampTo(TIER_BOUNDS.mix, tier.mix), colombe.id).toBe(tier.mix)
      }
      for (const key of Object.keys(INPUT_BOUNDS) as (keyof typeof INPUT_BOUNDS)[]) {
        if (key === 'baseMultipleOverride') continue
        const value = inputs[key]
        expect(clampTo(INPUT_BOUNDS[key], value), `${colombe.id}.${key}`).toBe(value)
      }
    }
  })

  it('le moteur valorise chaque colombe à un montant fini et positif', () => {
    for (const colombe of AVIARY) {
      const results = compute(colombe.inputs)
      expect(Number.isFinite(results.valuation.value), colombe.id).toBe(true)
      expect(results.valuation.value, colombe.id).toBeGreaterThan(0)
    }
  })

  it('les archétypes sont différenciés : ARPU du simple au triple chiffre', () => {
    const arpus = AVIARY.map((colombe) => compute(colombe.inputs).revenue.arpu)
    expect(Math.min(...arpus)).toBeLessThan(15)
    expect(Math.max(...arpus)).toBeGreaterThan(100)
  })
})

describe('colombeById', () => {
  it('retrouve une colombe par id et rend null sinon', () => {
    expect(colombeById(AVIARY[0].id)?.name).toBe(AVIARY[0].name)
    expect(colombeById('inconnue')).toBeNull()
  })
})
