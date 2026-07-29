import { lazy, Suspense, useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SectionShell } from '@/components/SectionShell'
import { SectionRoutes } from '@/components/SectionRoutes'
import { SimulatorView } from '@/components/views/SimulatorView'
import { ColombeProfileView } from '@/components/views/ColombeProfileView'
import { PadLabView } from '@/components/views/PadLabView'
import { useRoute } from '@/lib/router'
import { SECTIONS } from '@/lib/sections'
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
   * Les quatre sections partagent une coque montée une fois pour toutes.
   * C'est la condition du glissement : si l'en-tête et la barre étaient
   * remontés à chaque changement, la pastille du focus n'aurait aucun
   * ancêtre commun d'une section à l'autre — elle réapparaîtrait ailleurs
   * au lieu d'y aller.
   *
   * Le simulateur, les profils et le banc d'essai gardent leur propre
   * chrome : ce sont des vues de détail, pas des sections.
   */
  const isSection = SECTIONS.some((section) => section.id === route.view)

  if (isSection) {
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

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-svh bg-background text-foreground">
        {route.view === 'simulator' && <SimulatorView />}
        {route.view === 'lab' && <PadLabView />}
        {route.view === 'colombe' && <ColombeProfileView id={route.id} />}
      </div>
      <Toaster />
    </TooltipProvider>
  )
}
