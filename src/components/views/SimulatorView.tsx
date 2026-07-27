import { useState } from 'react'
import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ControlPanel } from '@/components/controls/ControlPanel'
import { ValuationCard } from '@/components/results/ValuationCard'
import { GoalCard } from '@/components/results/GoalCard'
import { KpiGrid } from '@/components/results/KpiGrid'
import { ProjectionChart } from '@/components/results/ProjectionChart'
import { MultipleBreakdown } from '@/components/results/MultipleBreakdown'
import { ScenarioBar } from '@/components/scenarios/ScenarioBar'
import { SaveBar } from '@/components/scenarios/SaveBar'
import { useResults, useT } from '@/store/simulator'
import { useAnimatedNumber } from '@/lib/useAnimatedNumber'
import { formatCurrency, formatMultiple } from '@/lib/format'

/** Rappel compact de la valorisation, pour garder le lien geste → conséquence
    quand le panneau mobile recouvre la carte héros. */
function ValuationTicker() {
  const { valuation } = useResults()
  const value = useAnimatedNumber(valuation.value)
  const t = useT()

  return (
    <p className="flex items-baseline gap-2 text-sm" aria-live="polite">
      <span className="text-muted-foreground">{t('Valuation')}</span>
      <span className="font-mono text-base font-semibold tabular-nums">
        {formatCurrency(value)}
      </span>
      <span className="text-xs text-muted-foreground">
        {formatMultiple(valuation.multiple)} EBITDA
      </span>
    </p>
  )
}

function Results() {
  return (
    <div className="space-y-3">
      {/* Collante : sans elle en vue, le lien entre le geste et sa conséquence disparaît. */}
      <div className="sticky top-4 z-10 lg:top-6">
        <ValuationCard />
      </div>
      <SaveBar />
      <GoalCard />
      <ScenarioBar />
      <KpiGrid />
      <ProjectionChart />
      <MultipleBreakdown />
    </div>
  )
}

export function SimulatorView() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const t = useT()

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <AppHeader
          actions={
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="lg:hidden">
                {t('Settings')}
              </Button>
            </SheetTrigger>
          }
        />
        <SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto">
          <SheetHeader className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <SheetTitle>{t('Control panel')}</SheetTitle>
            <ValuationTicker />
          </SheetHeader>
          <div className="px-4 pb-8">
            <ControlPanel />
          </div>
        </SheetContent>
      </Sheet>

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
    </>
  )
}
