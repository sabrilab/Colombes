import { describe, expect, it } from 'vitest'
import { FACES, isImageAvatar } from './avatar'

describe('isImageAvatar', () => {
  it('distingue une image d’un emoji', () => {
    // Tout l'affichage repose là-dessus : une image se pose dans une balise,
    // un emoji dans du texte, et se tromper donne un carré vide.
    expect(isImageAvatar('data:image/jpeg;base64,/9j/4AAQ')).toBe(true)
    expect(isImageAvatar('🥚')).toBe(false)
    expect(isImageAvatar(undefined)).toBe(false)
    expect(isImageAvatar('')).toBe(false)
  })
})

describe('FACES', () => {
  it('n’a pas de doublon', () => {
    // Deux fois le même visage dans le rang de choix : on croit avoir mal visé.
    expect(new Set(FACES).size).toBe(FACES.length)
  })

  it('tient sur une ligne qu’on pousse du doigt', () => {
    expect(FACES.length).toBeLessThanOrEqual(12)
  })
})
