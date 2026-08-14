import type { Route } from './router'

/**
 * Trois sections, et pas quatre.
 *
 * Une barre d'onglets répond à « où est-ce que je vais », et chaque onglet de
 * plus rend la réponse plus longue. Les trois qui restent sont trois intentions
 * de visite qu'on ne peut pas confondre :
 *
 *  — **Simuler**, « ça vaut combien ? » ;
 *  — **Le nid**, « où en sont mes idées ? » ;
 *  — **Comprendre**, « pourquoi ce chiffre ? ».
 *
 * La volière avait le sien. Elle ne le méritait pas : montrer six entreprises
 * connues sur la même échelle, c'est une façon de comprendre, pas une
 * destination à part. Elle vit donc en tête de « Comprendre », gardant son
 * adresse `#/voliere` et sa coque de section — seul l'onglet disparaît.
 */
export interface Section {
  id: Route['view']
  /** Libellé de l'onglet, traduit à l'affichage. */
  label: string
  hash: string
}

export const SECTIONS: Section[] = [
  { id: 'home', label: 'Simulate', hash: '#/' },
  { id: 'nest', label: 'The nest', hash: '#/nid' },
  { id: 'learn', label: 'Understand', hash: '#/comprendre' },
]

/**
 * Les vues qui prennent la coque de section — celles qui se lisent de haut en
 * bas, avec la barre d'onglets sous le pouce. La volière en est, sans être un
 * onglet ; le simulateur n'en est pas, c'est un écran de détail qu'on pousse et
 * dont on revient.
 */
export const SHELL_VIEWS: Route['view'][] = ['home', 'nest', 'learn', 'aviary']

export function isShellView(route: Route): boolean {
  return SHELL_VIEWS.includes(route.view)
}

/**
 * L'onglet qui doit s'allumer pour une route donnée. Les vues sans onglet
 * propre se rattachent à celle dont elles sont un détail : la volière et les
 * profils de colombe appartiennent à « Comprendre », le simulateur complet à
 * « Simuler ».
 */
export function activeSection(route: Route): Section['id'] | null {
  switch (route.view) {
    case 'aviary':
    case 'colombe':
      return 'learn'
    case 'simulator':
      return 'home'
    case 'lab':
      return null
    default:
      return route.view
  }
}
