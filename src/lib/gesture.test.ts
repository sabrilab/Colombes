import { describe, expect, it } from 'vitest'
import { isTap, TAP_SLOP } from './gesture'

describe('isTap', () => {
  it('pardonne le tremblement d’un doigt', () => {
    // Le cas qui a cassé le nid : au téléphone, toucher un œuf ne l'ouvrait
    // jamais parce que le doigt avait bougé de deux pixels entre le contact et
    // le relâchement, et que deux pixels comptaient comme un glissement.
    expect(isTap({ x: 100, y: 100 }, { x: 102, y: 101 })).toBe(true)
  })

  it('reconnaît un vrai glissement', () => {
    expect(isTap({ x: 100, y: 100 }, { x: 140, y: 100 })).toBe(false)
  })

  it('tranche au seuil, sans l’inclure', () => {
    expect(isTap({ x: 0, y: 0 }, { x: TAP_SLOP, y: 0 })).toBe(false)
    expect(isTap({ x: 0, y: 0 }, { x: TAP_SLOP - 0.5, y: 0 })).toBe(true)
  })

  it('mesure la distance, pas un axe', () => {
    // Six par six font plus de huit en diagonale : un glissement oblique reste
    // un glissement, même si aucun de ses deux côtés ne dépasse le seuil.
    expect(isTap({ x: 0, y: 0 }, { x: 6, y: 6 })).toBe(false)
  })
})
