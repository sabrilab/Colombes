import { useMemo, useState } from 'react'
import { Activity, Dumbbell, HardHat, PenLine, Users, UtensilsCrossed } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AppHeader } from '@/components/AppHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PricePad } from '@/components/home/PricePad'
import { AVIARY, type Colombe } from '@/lib/aviary'
import { describeHiddenAssumptions } from '@/lib/assumptions'
import { compute } from '@/lib/engine'
import { formatCompactCurrency, formatCurrency, formatMultiple, formatPercent } from '@/lib/format'
import { quickInputs } from '@/lib/quickSim'
import { navigate } from '@/lib/router'
import { useAnimatedNumber } from '@/lib/useAnimatedNumber'
import { useSimulator } from '@/store/simulator'

const DOVE_ICONS: Record<string, LucideIcon> = {
  turquoise: Activity,
  biset: UtensilsCrossed,
  diamant: Dumbbell,
  colombine: PenLine,
  ramier: HardHat,
  tourterelle: Users,
}

/** Le simulateur « à la louche » : deux curseurs, la valo en direct.
    Tout le reste vient d'hypothèses médianes (quickSim.ts), affichées. */
function MiniSimulator() {
  const [params, setParams] = useState({ price: 29, customers: 500 })
  const loadInputs = useSimulator((state) => state.loadInputs)

  const inputs = useMemo(() => quickInputs(params), [params])
  const results = useMemo(() => compute(inputs), [inputs])
  const animatedValue = useAnimatedNumber(results.valuation.value)

  const refine = () => {
    loadInputs(inputs)
    navigate('#/simulateur')
  }

  return (
    <Card className="reveal mt-8 gap-0 overflow-hidden p-5 lg:p-6" style={{ '--reveal-order': 2 } as React.CSSProperties}>
      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="font-display pb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Your SaaS, ballpark
          </p>
          <PricePad params={params} onChange={setParams} />
          <p className="pt-3 text-xs text-muted-foreground">
            Median assumptions applied: churn {formatPercent(inputs.revenueChurn)}/mo,{' '}
            {describeHiddenAssumptions(inputs)}.
          </p>
        </div>
        <div className="flex flex-col justify-center lg:border-l lg:border-border/60 lg:pl-6">
          <p className="text-sm text-muted-foreground" id="mini-simulateur-valo">
            Estimated valuation
          </p>
          <p
            className="metal-number font-mono text-4xl font-semibold tabular-nums lg:text-5xl"
            aria-live="polite"
            aria-labelledby="mini-simulateur-valo"
          >
            {formatCurrency(animatedValue)}
          </p>
          <div className="mt-2 flex items-baseline gap-6">
            <p>
              <span className="text-xs text-muted-foreground">MRR </span>
              <span className="font-mono text-xl font-semibold tabular-nums">
                {formatCurrency(results.revenue.mrr)}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {formatMultiple(results.valuation.multiple)} EBITDA
            </p>
          </div>
          <Button className="lume-pill mt-4 w-fit rounded-full px-5" onClick={refine}>
            Refine in the simulator
          </Button>
        </div>
      </div>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="font-mono text-sm tabular-nums">{value}</dd>
    </div>
  )
}

function ColombeCard({ colombe, order }: { colombe: Colombe; order: number }) {
  const results = useMemo(() => compute(colombe.inputs), [colombe])
  const Icon = DOVE_ICONS[colombe.id] ?? Activity
  const accent = `oklch(0.82 0.09 ${colombe.hue})`

  return (
    <button
      type="button"
      onClick={() => navigate(`#/colombe/${colombe.id}`)}
      className="reveal group text-left"
      style={{ '--reveal-order': order } as React.CSSProperties}
      aria-label={`View ${colombe.name}'s profile`}
    >
      <Card className="relative h-full gap-2.5 overflow-hidden p-4 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-foreground/25 group-focus-visible:border-foreground/40">
        {/* Halo d'accent, révélé au survol. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full opacity-[0.07] blur-2xl transition-opacity duration-300 group-hover:opacity-20"
          style={{ background: accent }}
        />
        <div className="flex items-center gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border"
            style={{
              background: `linear-gradient(150deg, oklch(0.5 0.07 ${colombe.hue} / 0.28), oklch(0.35 0.05 ${colombe.hue} / 0.10))`,
              borderColor: `oklch(0.7 0.08 ${colombe.hue} / 0.35)`,
              color: accent,
            }}
          >
            <Icon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-display text-base font-semibold">{colombe.name}</p>
            <p className="truncate text-xs text-muted-foreground">{colombe.sector}</p>
          </div>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{colombe.pitch}</p>
        <dl className="mt-auto flex gap-5 border-t border-border/60 pt-2.5">
          <Stat label="Valuation" value={formatCompactCurrency(results.valuation.value)} />
          <Stat label="MRR" value={formatCompactCurrency(results.revenue.mrr)} />
          <Stat label="Multiple" value={formatMultiple(results.valuation.multiple)} />
        </dl>
      </Card>
    </button>
  )
}

export function HomeView() {
  return (
    <>
      <AppHeader
        actions={
          <Button size="sm" variant="outline" onClick={() => navigate('#/simulateur')}>
            Full simulator
          </Button>
        }
      />
      <main className="mx-auto max-w-5xl px-4 py-10 lg:px-6 lg:py-14">
        <section>
          <div className="max-w-2xl">
            <h1
              className="font-display reveal text-3xl font-bold uppercase tracking-tight lg:text-4xl"
              style={{ '--reveal-order': 0 } as React.CSSProperties}
            >
              How much is a <span className="text-lume">SaaS</span> worth?
            </h1>
            <p
              className="reveal mt-3 text-muted-foreground"
              style={{ '--reveal-order': 1 } as React.CSSProperties}
            >
              Set a price and a customer count for a first estimate, explore the aviary to see
              what makes a great asset — then fine-tune yours in expert mode.
            </p>
          </div>
          <MiniSimulator />
        </section>

        <section className="mt-12 lg:mt-16" aria-label="The aviary">
          <h2
            className="font-display reveal text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground"
            style={{ '--reveal-order': 3 } as React.CSSProperties}
          >
            The aviary
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AVIARY.map((colombe, index) => (
              <ColombeCard key={colombe.id} colombe={colombe} order={4 + index} />
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Fictional companies, plausible numbers: every profile is calibrated on the
            simulator's market benchmarks (Acquire.com, FE International, ChartMogul).
          </p>
        </section>
      </main>
    </>
  )
}
