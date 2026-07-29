import { useEffect } from 'react'
import { HomeView } from '@/components/views/HomeView'
import { LearnView } from '@/components/views/LearnView'
import { AviaryView } from '@/components/views/AviaryView'
import { SavedView } from '@/components/views/SavedView'
import type { Route } from '@/lib/router'

/**
 * Le contenu d'une section, sans animation : c'est aussi le repli affiché
 * tant que la couche animée n'est pas chargée. Rien d'animé ici, pour qu'il
 * n'entraîne aucune bibliothèque dans le paquet principal.
 */
export function SectionRoutes({ route }: { route: Route }) {
  /**
   * Le défilement repart en haut à chaque section, sinon on atterrit au
   * milieu de la précédente. Sauf quand un lien pédagogique vise un module :
   * là, c'est la section qui décide où aller, et on ne lui coupe pas l'herbe
   * sous le pied.
   */
  const grain = route.view === 'learn' ? route.grain : undefined

  useEffect(() => {
    if (grain) return
    window.scrollTo({ top: 0 })
  }, [route.view, grain])

  return (
    <>
      {route.view === 'home' && <HomeView />}
      {route.view === 'learn' && <LearnView openGrain={route.grain} />}
      {route.view === 'aviary' && <AviaryView />}
      {route.view === 'saved' && <SavedView />}
    </>
  )
}
