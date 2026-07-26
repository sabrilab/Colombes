import { useSyncExternalStore } from 'react'

export type Route = { view: 'home' } | { view: 'simulator' } | { view: 'colombe'; id: string }

/**
 * Mini-routeur par hash : trois routes et la compatibilité avec les liens de
 * partage historiques (#s=…), qui ouvrent le simulateur avec leurs réglages.
 */
export function parseRoute(hash: string): Route {
  const clean = hash.replace(/^#/, '')
  if (clean.startsWith('s=')) return { view: 'simulator' }

  const path = clean.replace(/\/+$/, '')
  if (path === '' || path === '/') return { view: 'home' }
  if (path === '/simulateur') return { view: 'simulator' }

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
