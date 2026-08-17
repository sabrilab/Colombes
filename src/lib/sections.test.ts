import { describe, expect, it } from 'vitest'
import { SECTIONS, activeSection, isShellView } from './sections'
import { parseRoute } from './router'

describe('SECTIONS', () => {
  it('tient en trois onglets', () => {
    // Apple recommande trois à cinq onglets ; en dessous de trois une barre
    // n'a plus de raison d'être, au-delà on ne la lit plus d'un coup d'œil.
    // Si un quatrième revient un jour, que ce soit une décision, pas un oubli.
    expect(SECTIONS).toHaveLength(3)
  })

  it('mène chaque onglet vers une route reconnue', () => {
    for (const section of SECTIONS) {
      expect(parseRoute(section.hash)).toMatchObject({ view: section.id })
    }
  })
})

describe('SECTIONS, dans l’ordre', () => {
  it('ouvre sur le nid : c’est lui, l’accueil', () => {
    expect(SECTIONS[0]).toMatchObject({ id: 'nest', hash: '#/' })
  })
})

describe('activeSection', () => {
  it('rattache la volière et les profils à « Comprendre »', () => {
    // La volière n'a plus d'onglet : sans ce rattachement, on y arriverait avec
    // une barre entièrement éteinte — l'écran où l'on ne sait plus où l'on est.
    expect(activeSection({ view: 'aviary' })).toBe('learn')
    expect(activeSection({ view: 'colombe', id: 'x' })).toBe('learn')
  })

  it('rattache le simulateur complet à « Simuler »', () => {
    expect(activeSection({ view: 'simulator' })).toBe('ballpark')
  })

  it('n’allume rien sur le banc d’essai', () => {
    expect(activeSection({ view: 'lab' })).toBeNull()
  })
})

describe('isShellView', () => {
  it('donne la coque de section à la volière, qui n’est pourtant pas un onglet', () => {
    expect(isShellView({ view: 'aviary' })).toBe(true)
  })

  it('la refuse aux écrans de détail', () => {
    // Le simulateur et le banc d'essai portent leur propre chrome : un retour
    // plutôt que des onglets.
    expect(isShellView({ view: 'simulator' })).toBe(false)
    expect(isShellView({ view: 'lab' })).toBe(false)
  })
})
