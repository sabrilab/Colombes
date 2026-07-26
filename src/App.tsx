import { useEffect, useState } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ControlPanel } from '@/components/controls/ControlPanel'
import { ValuationCard } from '@/components/results/ValuationCard'
import { KpiGrid } from '@/components/results/KpiGrid'
import { ProjectionChart } from '@/components/results/ProjectionChart'
import { MultipleBreakdown } from '@/components/results/MultipleBreakdown'
import { ScenarioBar } from '@/components/scenarios/ScenarioBar'
import { ThemeToggle } from '@/components/ThemeToggle'
import { applyHashInputs } from '@/store/simulator'

function Results() {
  return (
    <div className="space-y-3">
      {/* Collante : sans elle en vue, le lien entre le geste et sa conséquence disparaît. */}
      <div className="sticky top-4 z-10 lg:top-6">
        <ValuationCard />
      </div>
      <ScenarioBar />
      <KpiGrid />
      <ProjectionChart />
      <MultipleBreakdown />
    </div>
  )
}

export default function App() {
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    applyHashInputs()
  }, [])

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-svh bg-background text-foreground">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 lg:px-6">
          <div>
            <h1 className="text-base font-medium">Simulateur d'actif SaaS</h1>
            <p className="text-xs text-muted-foreground">
              Pricing, rétention et valorisation, en direct
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  Réglages
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Panneau de contrôle</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-8">
                  <ControlPanel />
                </div>
              </SheetContent>
            </Sheet>
            <ThemeToggle />
          </div>
        </header>

        <div className="mx-auto flex max-w-[1600px] gap-6 p-4 lg:p-6">
          <aside className="hidden w-[360px] shrink-0 lg:block">
            <div className="sticky top-6 max-h-[calc(100svh-3rem)] overflow-y-auto pr-2">
              <ControlPanel />
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            <Results />
          </main>
        </div>
      </div>
      <Toaster />
    </TooltipProvider>
  )
}
