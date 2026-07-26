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

  it('rend null quand le nombre de plans est incorrect', () => {
    const wrongTiers = { ...DEFAULT_INPUTS, tiers: [DEFAULT_INPUTS.tiers[0]] }
    expect(decodeInputs(encodeInputs(wrongTiers as never))).toBeNull()
  })
})
