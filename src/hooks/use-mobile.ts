import { useEffect, useState } from 'react'

/** Le point de rupture de la barre latérale, en pixels. Identique à `lg` de Tailwind. */
const MOBILE_BREAKPOINT = 1024

/**
 * Vrai en dessous du point de rupture.
 *
 * On écoute la requête de média plutôt que `window.innerWidth` : le navigateur
 * ne prévient qu'aux franchissements, alors qu'un écouteur de redimensionnement
 * se déclenche à chaque pixel et fait rendre l'application des dizaines de fois
 * pendant qu'on tire une fenêtre.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth < MOBILE_BREAKPOINT,
  )

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(query.matches)
    query.addEventListener('change', onChange)
    onChange()
    return () => query.removeEventListener('change', onChange)
  }, [])

  return isMobile
}
