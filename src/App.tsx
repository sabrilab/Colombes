import { useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { HomeView } from '@/components/views/HomeView'
import { SimulatorView } from '@/components/views/SimulatorView'
import { ColombeProfileView } from '@/components/views/ColombeProfileView'
import { PadLabView } from '@/components/views/PadLabView'
import { useRoute } from '@/lib/router'
import { applyHashInputs } from '@/store/simulator'

export default function App() {
  const route = useRoute()

  // Les liens de partage historiques (#s=…) portent des réglages : on les
  // applique dès qu'ils apparaissent, au chargement comme en cours de session.
  useEffect(() => {
    if (route.view === 'simulator') applyHashInputs()
  }, [route])

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-svh bg-background text-foreground">
        {route.view === 'home' && <HomeView openGrain={route.grain} />}
        {route.view === 'simulator' && <SimulatorView />}
        {route.view === 'lab' && <PadLabView />}
        {route.view === 'colombe' && <ColombeProfileView id={route.id} />}
      </div>
      <Toaster />
    </TooltipProvider>
  )
}
