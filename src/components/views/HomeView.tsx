import { useMemo, useState } from 'react'
import { AppHeader } from '@/components/AppHeader'
import { BrandMark } from '@/components/BrandMark'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PricePad } from '@/components/home/PricePad'
import { SavedLibrary } from '@/components/home/SavedLibrary'
import { TierCarousel } from '@/components/home/TierCarousel'
import { animalFor } from '@/lib/pricePad'
import { AVIARY, type Colombe } from '@/lib/aviary'
import { describeHiddenAssumptions } from '@/lib/assumptions'
import { compute } from '@/lib/engine'
import { formatCompactCurrency, formatCurrency, formatMultiple, formatPercent } from '@/lib/format'
import { quickInputs } from '@/lib/quickSim'
import { navigate } from '@/lib/router'
import { useAnimatedNumber } from '@/lib/useAnimatedNumber'
import { useSimulator } from '@/store/simulator'

/** Le simulateur « à la louche » : deux curseurs, la valo en direct.
    Tout le reste vient d'hypothèses médianes (quickSim.ts), affichées. */
function MiniSimulator() {
  const [params, setParams] = useState({ price: 29, customers: 500 })
  const [showTiers, setShowTiers] = useState(false)
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
      {/* Le bascule des paliers vit dans la carte : ils s'y montrent, sans
          panneau qui recouvre tout. */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {showTiers ? 'The five tiers' : 'Your SaaS, ballpark'}
        </p>
        <Button
          variant={showTiers ? 'default' : 'outline'}
          size="sm"
          className="h-7 rounded-full px-3 text-xs"
          aria-pressed={showTiers}
          onClick={() => setShowTiers((value) => !value)}
        >
          Tiers
        </Button>
      </div>

      {showTiers ? (
        <div className="mx-auto max-w-xl py-2">
          <TierCarousel current={animalFor(params.price)} />
        </div>
      ) : (
      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <PricePad params={params} onChange={setParams} />
          <p className="pt-3 text-xs text-muted-foreground">
            Median assumptions applied: churn {formatPercent(inputs.revenueChurn)}/mo,{' '}
            {describeHiddenAssumptions(inputs)}.
          </p>
        </div>
        <div className="flex flex-col justify-center lg:border-l lg:border-border/60 lg:pl-6">
          {/* Les paliers en ronde, juste au-dessus du chiffre. */}
          <TierCarousel current={animalFor(params.price)} />

          <p className="mt-3 text-sm text-muted-foreground" id="mini-simulateur-valo">
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
      )}
    </Card>
  )
}

function ColombeCard({ colombe, order }: { colombe: Colombe; order: number }) {
  const results = useMemo(() => compute(colombe.inputs), [colombe])

  return (
    <button
      type="button"
      onClick={() => navigate(`#/colombe/${colombe.id}`)}
      className="reveal group text-left"
      style={{ '--reveal-order': order } as React.CSSProperties}
      aria-label={`View ${colombe.name}'s profile`}
    >
      <Card className="h-full gap-0 overflow-hidden p-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-foreground/25 group-focus-visible:border-foreground/40">
        {/* Bandeau d'identité : la marque et son secteur, rien d'autre. */}
        <div className="card-band flex items-center gap-3 border-b border-border/50 p-4">
          <BrandMark
            id={colombe.id}
            className="size-10 shrink-0 rounded-full ring-1 ring-foreground/10"
          />
          <div className="min-w-0">
            <p className="font-display text-base font-semibold leading-tight">{colombe.name}</p>
            <p className="truncate text-xs text-muted-foreground">{colombe.sector}</p>
          </div>
        </div>

        {/* Socle : un seul chiffre qui compte, et son multiple. */}
        <div className="flex items-end justify-between gap-3 p-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Valuation
            </p>
            <p className="font-mono text-2xl font-semibold tabular-nums">
              {formatCompactCurrency(results.valuation.value)}
            </p>
          </div>
          <p className="font-mono text-sm text-muted-foreground tabular-nums">
            {formatMultiple(results.valuation.multiple)}
          </p>
        </div>
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

        <SavedLibrary />

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
