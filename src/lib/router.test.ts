import { describe, expect, it } from 'vitest'
import { parseRoute } from './router'

describe('parseRoute', () => {
  it('reconnaît l accueil', () => {
    expect(parseRoute('')).toEqual({ view: 'home' })
    expect(parseRoute('#')).toEqual({ view: 'home' })
    expect(parseRoute('#/')).toEqual({ view: 'home' })
  })

  it('reconnaît le simulateur', () => {
    expect(parseRoute('#/simulateur')).toEqual({ view: 'simulator' })
    expect(parseRoute('#/simulateur/')).toEqual({ view: 'simulator' })
  })

  it('reconnaît le profil d une colombe', () => {
    expect(parseRoute('#/colombe/turquoise')).toEqual({ view: 'colombe', id: 'turquoise' })
  })

  it('reconnaît le banc d essai du pad', () => {
    expect(parseRoute('#/lab')).toEqual({ view: 'lab' })
  })

  it('reconnaît les quatre sections de navigation', () => {
    expect(parseRoute('#/')).toEqual({ view: 'home' })
    expect(parseRoute('#/comprendre')).toEqual({ view: 'learn' })
    expect(parseRoute('#/voliere')).toEqual({ view: 'aviary' })
    expect(parseRoute('#/mes-calculs')).toEqual({ view: 'saved' })
  })

  it('mène un lien pédagogique vers son module, dans la section Comprendre', () => {
    expect(parseRoute('#/apprendre/levers')).toEqual({ view: 'learn', grain: 'levers' })
    expect(parseRoute('#/apprendre/what-remains')).toEqual({
      view: 'learn',
      grain: 'what-remains',
    })
  })

  it('retombe sur l accueil nu si le grain est mal formé', () => {
    expect(parseRoute('#/apprendre/')).toEqual({ view: 'home' })
    expect(parseRoute('#/apprendre/A_B')).toEqual({ view: 'home' })
  })

  it('route les liens de partage historiques vers le simulateur', () => {
    expect(parseRoute('#s=eyJhIjoxfQ')).toEqual({ view: 'simulator' })
  })

  it('retombe sur l accueil pour tout hash inconnu', () => {
    expect(parseRoute('#/nimporte/quoi')).toEqual({ view: 'home' })
    expect(parseRoute('#/colombe/')).toEqual({ view: 'home' })
  })
})
