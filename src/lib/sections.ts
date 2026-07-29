import type { Route } from './router'

/**
 * Les quatre sections de navigation. Quatre et pas cinq : sur un téléphone,
 * cinq onglets tombent sous les 70 px chacun et le choix ne se lit plus.
 *
 * Chacune répond à une intention de visite différente — « ça vaut combien ? »,
 * « pourquoi ce chiffre ? », « je me situe où ? », « où en étais-je ? » — et
 * non à un morceau de l'interface. C'est ce qui les rend stables : elles ne
 * bougeront pas quand l'interface, elle, bougera.
 */
export interface Section {
  id: Route['view']
  /** Libellé de l'onglet, traduit à l'affichage. */
  label: string
  hash: string
}

export const SECTIONS: Section[] = [
  { id: 'home', label: 'Simulate', hash: '#/' },
  { id: 'learn', label: 'Understand', hash: '#/comprendre' },
  { id: 'aviary', label: 'Aviary', hash: '#/voliere' },
  { id: 'saved', label: 'My runs', hash: '#/mes-calculs' },
]

/**
 * La section qui doit s'allumer pour une route donnée. Les vues sans onglet
 * propre se rattachent à celle dont elles sont un détail : un profil de
 * colombe appartient à la volière, le simulateur complet à la simulation.
 */
export function activeSection(route: Route): Section['id'] | null {
  switch (route.view) {
    case 'colombe':
      return 'aviary'
    case 'simulator':
      return 'home'
    case 'lab':
      return null
    default:
      return route.view
  }
}
