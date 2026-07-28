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

/**
 * Rappel compact de la valorisation, pour garder le lien geste → conséquence
 * quand le panneau mobile recouvre la carte héros.
 *
 * `live` reste réservé au panneau : la carte héros annonce déjà le chiffre, et
 * trois régions vivantes pour une même valeur noieraient un lecteur d'écran.
 */
function ValuationTicker({ live = false }: { live?: boolean }) {
  const { valuation } = useResults()
  const value = useAnimatedNumber(valuation.value)
  const t = useT()

  return (
    <p
      className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-sm"
      aria-live={live ? 'polite' : undefined}
    >
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
      {/* Collante sur grand écran seulement : là, elle tient dans un coin sans
          rien masquer. Au téléphone elle occupait le tiers haut de l'écran en
          permanence — c'est la barre du bas qui y garde le chiffre en vue. */}
      <div className="lg:sticky lg:top-[4.5rem] lg:z-10">
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
        <AppHeader />
        <SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto">
          <SheetHeader className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <SheetTitle>{t('Control panel')}</SheetTitle>
            <ValuationTicker live />
          </SheetHeader>
          <div className="px-4 pb-8">
            <ControlPanel />
          </div>
        </SheetContent>

        {/* La barre du bas laisse la place au défilement : le chiffre reste en
            vue sans rien recouvrir, et les réglages tombent sous le pouce
            plutôt qu'en haut de l'écran, hors de portée d'une seule main. */}
        <div className="glass-bar fixed inset-x-0 bottom-0 z-30 border-t border-border/60 pb-[env(safe-area-inset-bottom)] lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5">
            <ValuationTicker />
            <SheetTrigger asChild>
              <Button size="sm" className="lume-pill h-11 shrink-0 px-5">
                {t('Settings')}
              </Button>
            </SheetTrigger>
          </div>
        </div>

        <div className="mx-auto flex max-w-[1600px] gap-6 p-4 pb-28 lg:p-6">
          <aside className="hidden w-[360px] shrink-0 lg:block">
            <div className="sticky top-[4.5rem] max-h-[calc(100svh-6rem)] overflow-y-auto pr-2">
              <ControlPanel />
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            <Results />
          </main>
        </div>
      </Sheet>
    </>
  )
}
