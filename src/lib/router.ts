import { useSyncExternalStore } from 'react'

export type Route =
  | { view: 'home' }
  /** `grain` : un lien pédagogique entrant, qui vise un module de la section. */
  | { view: 'learn'; grain?: string }
  | { view: 'aviary' }
  | { view: 'nest' }
  | { view: 'simulator' }
  | { view: 'lab' }
  | { view: 'colombe'; id: string }

/**
 * Mini-routeur par hash. Quatre sections de navigation — accueil, comprendre,
 * volière, le nid — plus le simulateur complet, les profils, le banc
 * d'essai, et la compatibilité avec les liens de partage historiques (#s=…),
 * qui ouvrent le simulateur avec leurs réglages.
 */
export function parseRoute(hash: string): Route {
  const clean = hash.replace(/^#/, '')
  if (clean.startsWith('s=')) return { view: 'simulator' }

  const path = clean.replace(/\/+$/, '')
  if (path === '' || path === '/') return { view: 'home' }
  if (path === '/simulateur') return { view: 'simulator' }
  if (path === '/comprendre') return { view: 'learn' }
  if (path === '/voliere') return { view: 'aviary' }
  // « mes-calculs » a été partagé et mis en favori : il continue d'ouvrir le nid.
  if (path === '/nid' || path === '/mes-calculs') return { view: 'nest' }
  if (path === '/lab') return { view: 'lab' }

  // Un lien pédagogique vise un module de la section « Comprendre ».
  const grain = path.match(/^\/apprendre\/([a-z0-9-]+)$/)
  if (grain) return { view: 'learn', grain: grain[1] }

  const colombe = path.match(/^\/colombe\/([a-z0-9-]+)$/)
  if (colombe) return { view: 'colombe', id: colombe[1] }

  return { view: 'home' }
}

export function navigate(hash: string): void {
  window.location.hash = hash
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
