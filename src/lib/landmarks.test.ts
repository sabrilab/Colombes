import { describe, expect, it } from 'vitest'
import { LANDMARKS, landmarkAcv, landmarkTier } from './landmarks'
import { PRICING_ANIMALS } from './pricePad'

describe('LANDMARKS', () => {
  it('donne des identifiants uniques et une identité complète', () => {
    const ids = LANDMARKS.map((company) => company.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const company of LANDMARKS) {
      expect(company.name.length, company.id).toBeGreaterThan(0)
      expect(company.initial.length, company.id).toBe(1)
      expect(company.color, company.id).toMatch(/^#[0-9a-f]{6}$/i)
      expect(company.sector.length, company.id).toBeGreaterThan(0)
      // Chaque chiffre doit être daté et sourcé : sans ça, c'est une rumeur.
      expect(company.period.length, company.id).toBeGreaterThan(0)
      expect(company.basis.length, company.id).toBeGreaterThan(10)
    }
  })

  it('ne porte que des grandeurs positives et finies', () => {
    for (const company of LANDMARKS) {
      expect(company.annualRevenue, company.id).toBeGreaterThan(0)
      expect(Number.isFinite(company.annualRevenue), company.id).toBe(true)
      expect(company.customers, company.id).toBeGreaterThan(0)
      expect(Number.isFinite(company.customers), company.id).toBe(true)
    }
  })

  it('couvre les cinq paliers, pour que la nomenclature s incarne', () => {
    const tiers = new Set(LANDMARKS.map((company) => landmarkTier(company).name))
    for (const animal of PRICING_ANIMALS) {
      expect(tiers.has(animal.name), animal.name).toBe(true)
    }
  })
})

describe('landmarkAcv', () => {
  it('rend le revenu annuel par client', () => {
    const acv = landmarkAcv({ annualRevenue: 1_000_000, customers: 500 } as never)
    expect(acv).toBe(2_000)
  })
})

describe('landmarkTier', () => {
  it('classe sur le prix mensuel déduit, pas sur le revenu total', () => {
    // 1 200 $/an ⇒ 100 $/mois ⇒ palier des cerfs.
    const tier = landmarkTier({ annualRevenue: 1_200_000, customers: 1_000 } as never)
    expect(tier.name).toBe('Deer')
  })
})
