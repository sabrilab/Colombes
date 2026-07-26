import { describe, expect, it } from 'vitest'
import { decodeInputs, encodeInputs } from './urlState'
import { DEFAULT_INPUTS } from './defaults'

describe('encodeInputs / decodeInputs', () => {
  it('fait un aller-retour sans perte', () => {
    expect(decodeInputs(encodeInputs(DEFAULT_INPUTS))).toEqual(DEFAULT_INPUTS)
  })

  it('préserve une surcharge de multiple', () => {
    const inputs = { ...DEFAULT_INPUTS, baseMultipleOverride: 5.5 }
    expect(decodeInputs(encodeInputs(inputs))?.baseMultipleOverride).toBe(5.5)
  })

  it('produit un fragment sûr pour une URL', () => {
    expect(encodeInputs(DEFAULT_INPUTS)).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('rend null sur un fragment illisible plutôt que de lever', () => {
    expect(decodeInputs('pas-du-base64-valide!!')).toBeNull()
    expect(decodeInputs('')).toBeNull()
    expect(decodeInputs('YWJj')).toBeNull()
  })

  it('rend null sur un objet de forme inattendue', () => {
    const truncated = btoa(JSON.stringify({ customers: 10 }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    expect(decodeInputs(truncated)).toBeNull()
  })

  it('accepte de 1 à 4 plans', () => {
    const single = { ...DEFAULT_INPUTS, tiers: [DEFAULT_INPUTS.tiers[0]] }
    expect(decodeInputs(encodeInputs(single))?.tiers).toHaveLength(1)

    const four = {
      ...DEFAULT_INPUTS,
      tiers: [...DEFAULT_INPUTS.tiers, { name: 'Entreprise', price: 199, mix: 0.05 }],
    }
    expect(decodeInputs(encodeInputs(four))?.tiers).toHaveLength(4)
  })

  it('rend null quand le nombre de plans sort de 1 à 4', () => {
    const none = { ...DEFAULT_INPUTS, tiers: [] }
    expect(decodeInputs(encodeInputs(none as never))).toBeNull()

    const five = {
      ...DEFAULT_INPUTS,
      tiers: Array.from({ length: 5 }, (_, i) => ({ name: `P${i}`, price: 10, mix: 0.2 })),
    }
    expect(decodeInputs(encodeInputs(five as never))).toBeNull()
  })

  it('écrête les valeurs hors bornes d’un lien forgé', () => {
    const hostile = {
      ...DEFAULT_INPUTS,
      customers: -5,
      cac: 1e308,
      grossMargin: 2,
      revenueChurn: -0.4,
      baseMultipleOverride: 999,
    }
    const decoded = decodeInputs(encodeInputs(hostile))
    expect(decoded).not.toBeNull()
    expect(decoded?.customers).toBe(0)
    expect(decoded?.cac).toBe(2_000)
    expect(decoded?.grossMargin).toBe(0.99)
    expect(decoded?.revenueChurn).toBe(0)
    expect(decoded?.baseMultipleOverride).toBe(10)
  })

  it('écrête aussi le prix et la part de chaque palier', () => {
    const hostile = {
      ...DEFAULT_INPUTS,
      tiers: [
        { name: 'Starter', price: -10, mix: 5 },
        { name: 'Pro', price: 1e9, mix: -1 },
        { name: 'Scale', price: 79, mix: 0.1 },
      ] as typeof DEFAULT_INPUTS.tiers,
    }
    const decoded = decodeInputs(encodeInputs(hostile))
    expect(decoded?.tiers[0]).toMatchObject({ price: 0, mix: 1 })
    expect(decoded?.tiers[1]).toMatchObject({ price: 500, mix: 0 })
    expect(decoded?.tiers[2]).toMatchObject({ price: 79, mix: 0.1 })
  })

  it('les valeurs dans les bornes traversent sans modification', () => {
    expect(decodeInputs(encodeInputs(DEFAULT_INPUTS))).toEqual(DEFAULT_INPUTS)
  })
})
