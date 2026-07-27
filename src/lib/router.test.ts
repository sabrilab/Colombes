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

  it('route les liens de partage historiques vers le simulateur', () => {
    expect(parseRoute('#s=eyJhIjoxfQ')).toEqual({ view: 'simulator' })
  })

  it('retombe sur l accueil pour tout hash inconnu', () => {
    expect(parseRoute('#/nimporte/quoi')).toEqual({ view: 'home' })
    expect(parseRoute('#/colombe/')).toEqual({ view: 'home' })
  })
})
