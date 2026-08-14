import { lazy, Suspense, useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppShell } from '@/components/AppShell'
import { SectionShell } from '@/components/SectionShell'
import { SectionRoutes } from '@/components/SectionRoutes'
import { SimulatorView } from '@/components/views/SimulatorView'
import { ColombeProfileView } from '@/components/views/ColombeProfileView'
import { PadLabView } from '@/components/views/PadLabView'
import { useRoute } from '@/lib/router'
import { isShellView } from '@/lib/sections'
import { applyHashInputs } from '@/store/simulator'

/** La transition partage le morceau de Motion déjà chargé par la barre. */
const SectionView = lazy(() =>
  import('@/components/SectionView').then((m) => ({ default: m.SectionView })),
)

export default function App() {
  const route = useRoute()

  // Les liens de partage historiques (#s=…) portent des réglages : on les
  // applique dès qu'ils apparaissent, au chargement comme en cours de session.
  useEffect(() => {
    if (route.view === 'simulator') applyHashInputs()
  }, [route])

  /**
   * Les sections partagent une coque montée une fois pour toutes.
   * C'est la condition du glissement : si l'en-tête et la barre étaient
   * remontés à chaque changement, la pastille du focus n'aurait aucun
   * ancêtre commun d'une section à l'autre — elle réapparaîtrait ailleurs
   * au lieu d'y aller.
   *
   * Le simulateur, les profils et le banc d'essai gardent leur propre
   * chrome : ce sont des vues de détail, pas des sections.
   */
  if (isShellView(route)) {
    return (
      <TooltipProvider delayDuration={200}>
        <div className="min-h-svh bg-background text-foreground">
          <SectionShell>
            <Suspense fallback={<SectionRoutes route={route} />}>
              <SectionView route={route} />
            </Suspense>
          </SectionShell>
        </div>
        <Toaster />
      </TooltipProvider>
    )
  }

  /*
   * Le simulateur complet prend la même coque que les sections : c'est l'écran
   * où l'on reste le plus longtemps, et il n'avait aucune navigation — on y
   * arrivait par un bouton et on en repartait par le retour du navigateur.
   *
   * Le banc d'essai et les profils gardent leur chrome propre : ce sont des vues
   * de détail, ouvertes depuis un endroit précis et refermées vers lui.
   */
  if (route.view === 'simulator') {
    return (
      <TooltipProvider delayDuration={200}>
        <div className="min-h-svh bg-background text-foreground">
          {/* Écran de détail : un retour en haut, pas d'onglets. Il a déjà sa
              propre barre basse — le chiffre et les réglages — et deux barres
              empilées sous le pouce, c'est une de trop. */}
          <AppShell back tabs={false}>
            <SimulatorView />
          </AppShell>
        </div>
        <Toaster />
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-svh bg-background text-foreground">
        {route.view === 'lab' && <PadLabView />}
        {route.view === 'colombe' && <ColombeProfileView id={route.id} />}
      </div>
      <Toaster />
    </TooltipProvider>
  )
}
