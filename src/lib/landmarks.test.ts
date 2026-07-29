import { describe, expect, it } from 'vitest'
import { LANDMARKS, landmarkAcv, landmarkTier, landmarksForTier } from './landmarks'
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

describe('landmarksForTier', () => {
  it('couvre les cinq paliers, sans en laisser un vide', () => {
    // C'est la promesse pédagogique : chaque animal a une marque qui l'incarne.
    for (const animal of PRICING_ANIMALS) {
      expect(landmarksForTier(animal).length, animal.name).toBeGreaterThan(0)
    }
  })

  it('range chaque repère dans un palier et un seul', () => {
    const placed = PRICING_ANIMALS.flatMap(landmarksForTier)
    expect(placed).toHaveLength(LANDMARKS.length)
    expect(new Set(placed.map((company) => company.id)).size).toBe(LANDMARKS.length)
  })

  it('donne un palier cohérent avec landmarkTier', () => {
    for (const animal of PRICING_ANIMALS) {
      for (const company of landmarksForTier(animal)) {
        expect(landmarkTier(company).name, company.id).toBe(animal.name)
      }
    }
  })

  it('incarne les baleines, que le pad ne peut pas atteindre', () => {
    // Le palier hors cadran est justement celui qu'il faut rendre tangible.
    const whales = PRICING_ANIMALS.find((animal) => animal.name === 'Whales')!
    expect(landmarksForTier(whales).map((company) => company.id)).toContain('salesforce')
  })
})
