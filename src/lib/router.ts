import { useSyncExternalStore } from 'react'

export type Route =
  /** Le nid : l'accueil. On entre ici pour poser une idée. */
  | { view: 'nest' }
  /** Le simulateur « à la louche » : un prix, des clients, un ordre de grandeur. */
  | { view: 'ballpark' }
  /** `grain` : un lien pédagogique entrant, qui vise un module de la section. */
  | { view: 'learn'; grain?: string }
  | { view: 'aviary' }
  | { view: 'simulator' }
  | { view: 'lab' }
  | { view: 'colombe'; id: string }

/**
 * Mini-routeur par hash.
 *
 * La racine est le nid, et ce n'est pas un détail d'adressage : on ouvre cette
 * application pour poser une idée, pas pour régler des curseurs. Le simulateur
 * à la louche garde tout ce qu'il faisait et prend son adresse propre,
 * `#/simuler` — il vient après, quand l'idée existe.
 *
 * Les anciennes adresses continuent d'ouvrir ce qu'elles ouvraient : `#/nid` et
 * `#/mes-calculs` mènent au nid, les liens de partage (`#s=…`) au simulateur
 * complet avec leurs réglages.
 */
export function parseRoute(hash: string): Route {
  const clean = hash.replace(/^#/, '')
  if (clean.startsWith('s=')) return { view: 'simulator' }

  const path = clean.replace(/\/+$/, '')
  if (path === '' || path === '/') return { view: 'nest' }
  if (path === '/simuler') return { view: 'ballpark' }
  if (path === '/simulateur') return { view: 'simulator' }
  if (path === '/comprendre') return { view: 'learn' }
  if (path === '/voliere') return { view: 'aviary' }
  // Deux adresses d'avant, partagées et mises en favori. Le nid a déménagé à la
  // racine ; elles y mènent toujours.
  if (path === '/nid' || path === '/mes-calculs') return { view: 'nest' }
  if (path === '/lab') return { view: 'lab' }

  // Un lien pédagogique vise un module de la section « Comprendre ».
  const grain = path.match(/^\/apprendre\/([a-z0-9-]+)$/)
  if (grain) return { view: 'learn', grain: grain[1] }

  const colombe = path.match(/^\/colombe\/([a-z0-9-]+)$/)
  if (colombe) return { view: 'colombe', id: colombe[1] }

  return { view: 'nest' }
}

export function navigate(hash: string): void {
  window.location.hash = hash
}

/**
 * Revenir d'où l'on vient.
 *
 * Les écrans de détail — le simulateur complet, un profil — se poussent depuis
 * une section et doivent se refermer vers elle. On rend la main à l'historique
 * plutôt que de coder un parent en dur, parce qu'on arrive au simulateur depuis
 * l'accueil comme depuis le nid, et qu'un bouton « retour » qui ramène ailleurs
 * qu'à l'endroit d'où l'on vient est pire que pas de bouton.
 *
 * Le repli sert au cas où l'on a ouvert un lien partagé directement : il n'y a
 * alors rien derrière, et `history.back()` sortirait du site.
 */
export function goBack(fallback = '#/'): void {
  if (window.history.length > 1) window.history.back()
  else navigate(fallback)
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => '',
  )
  return parseRoute(hash)
}
